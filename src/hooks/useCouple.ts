import { FirebaseError } from 'firebase/app';
import { useCallback, useEffect, useState } from 'react';

import {
  checkPartnerAccessValid,
  ensureCoupleForUser,
  getPartnerAccess,
  getUserDocument,
  revokePartnerAccess,
  type PartnerAccess,
} from '../firebase/firestore';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { clearOwnerInvitePin } from '../utils/partnerInviteCache';
import { loadPartnerSession } from '../utils/partnerSession';
import { log, logError } from '../utils/log';

function logFirebaseError(label: string, error: unknown): void {
  if (error instanceof FirebaseError) {
    logError(label, {
      code: error.code,
      message: error.message,
      customData: error.customData,
    });
    return;
  }
  logError(label, error);
}

/** Increments on each bootstrap start; stale bootstraps must not mutate authStore. */
let coupleBootstrapGeneration = 0;

async function refreshOwnerCoupleData(coupleId: string): Promise<void> {
  log('[refreshOwnerCoupleData] start', { coupleId });
  await useSettingsStore.getState().loadSettings(coupleId);
  log('[refreshOwnerCoupleData] done', { coupleId });
}

export function useCouple() {
  const user = useAuthStore((state) => state.user);
  const coupleId = useAuthStore((state) => state.coupleId);
  const isPartnerMode = useAuthStore((state) => state.isPartnerMode);
  const isCoupleBootstrapping = useAuthStore((state) => state.isCoupleBootstrapping);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [partnerAccess, setPartnerAccess] = useState<PartnerAccess | null>(null);
  const [isLoadingAccess, setIsLoadingAccess] = useState(true);

  const refreshCoupleState = useCallback(async () => {
    const {
      user: currentUser,
      coupleId: currentCoupleId,
      isPartnerMode: partnerMode,
    } = useAuthStore.getState();

    try {
      if (partnerMode) {
        if (!currentCoupleId) {
          return;
        }
        await refreshOwnerCoupleData(currentCoupleId);
        return;
      }

      if (!currentUser?.uid || !currentCoupleId) {
        setPartnerAccess(null);
        return;
      }

      const access = await getPartnerAccess(currentUser.uid);
      console.log('[useCouple] getPartnerAccess result', JSON.stringify(access));
      console.log('[useCouple] setting partnerAccess', access?.isActive ? 'ACTIVE' : 'null/inactive');
      setPartnerAccess(access?.isActive ? access : null);
      await refreshOwnerCoupleData(currentCoupleId);
    } finally {
      setIsLoadingAccess(false);
    }
  }, []);

  useEffect(() => {
    if (isCoupleBootstrapping) {
      log('[useCouple] skip refreshCoupleState — bootstrap in progress');
      return;
    }

    void refreshCoupleState();
  }, [refreshCoupleState, coupleId, user?.uid, isCoupleBootstrapping, isPartnerMode]);

  const disconnectPartner = useCallback(async () => {
    const { user: currentUser } = useAuthStore.getState();
    if (!currentUser?.uid || isPartnerMode) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await revokePartnerAccess(currentUser.uid);
      await clearOwnerInvitePin();
      setPartnerAccess(null);
      await refreshCoupleState();
    } catch (disconnectError) {
      logFirebaseError('[disconnectPartner] error', disconnectError);
      setError(
        disconnectError instanceof Error
          ? disconnectError.message
          : 'Failed to disconnect partner',
      );
      throw disconnectError;
    } finally {
      setLoading(false);
    }
  }, [isPartnerMode, refreshCoupleState]);

  const isPartnerConnected = Boolean(partnerAccess?.isActive);

  return {
    coupleId,
    partnerAccess,
    isPartnerConnected,
    isLoadingAccess,
    loading,
    error,
    disconnectPartner,
    refreshCoupleState,
    setPartnerAccess,
  };
}

export async function bootstrapCoupleForAuthUser(
  userId: string,
  authEmail: string | null | undefined,
): Promise<void> {
  const { isPartnerMode } = useAuthStore.getState();
  if (isPartnerMode) {
    log('[bootstrapCoupleForAuthUser] skipped — partner mode active');
    return;
  }

  const generation = ++coupleBootstrapGeneration;

  const isCurrentBootstrap = () => generation === coupleBootstrapGeneration;

  useAuthStore.getState().setCoupleBootstrapping(true);

  log('[bootstrapCoupleForAuthUser] start', {
    userId,
    authEmail: authEmail ?? null,
    generation,
  });

  try {
    const resolvedCoupleId = await ensureCoupleForUser(userId, authEmail ?? '');
    if (!isCurrentBootstrap()) {
      log('[bootstrapCoupleForAuthUser] stale after ensureCoupleForUser');
      return;
    }

    useAuthStore.getState().setCoupleId(resolvedCoupleId);
    log('[bootstrapCoupleForAuthUser] coupleId', resolvedCoupleId);

    await refreshOwnerCoupleData(resolvedCoupleId);
    if (!isCurrentBootstrap()) {
      log('[bootstrapCoupleForAuthUser] stale after refreshOwnerCoupleData');
      return;
    }

    const userDoc = await getUserDocument(userId);
    if (userDoc) {
      useAuthStore.getState().setUserProfile({
        firstName: userDoc.firstName ?? '',
        lastName: userDoc.lastName ?? '',
        country: userDoc.country ?? '',
        phone: userDoc.phone ?? '',
      });
    }
  } finally {
    if (isCurrentBootstrap()) {
      useAuthStore.getState().setCoupleBootstrapping(false);
    }

    log('[bootstrapCoupleForAuthUser] complete', {
      coupleId: useAuthStore.getState().coupleId,
      generation,
      isCurrent: isCurrentBootstrap(),
    });
  }
}

export async function bootstrapPartnerMode(): Promise<boolean> {
  const session = await loadPartnerSession();
  if (!session) {
    return false;
  }

  const valid = await checkPartnerAccessValid(session.ownerId);
  if (!valid) {
    const { clearPartnerSession } = await import('../utils/partnerSession');
    await clearPartnerSession();
    return false;
  }

  useAuthStore.getState().setPartnerMode(
    true,
    session.ownerId,
    session.ownerName,
  );
  useAuthStore.getState().setCoupleId(session.coupleId);

  const { useOnboardingStore } = await import('../store/onboardingStore');
  await useOnboardingStore.getState().markComplete();

  await useSettingsStore.getState().loadSettings(session.coupleId);

  log('[bootstrapPartnerMode] active', session);
  return true;
}
