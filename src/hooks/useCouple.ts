import { FirebaseError } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { useCallback, useEffect, useState } from 'react';

import {
  acceptInvite,
  cancelInvite,
  checkPendingInvite,
  declineInvite,
  disconnectCouple,
  ensureCoupleForUser,
  getCoupleMembers,
  type CoupleMemberInfo,
  getPendingOutgoingInvite,
  getUserDocument,
  invitePartner,
} from '../firebase/firestore';
import { useAuthStore } from '../store/authStore';
import { usePeriodsStore } from '../store/periodsStore';
import { useSettingsStore } from '../store/settingsStore';
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

async function refreshCoupleData(coupleId: string, userId: string): Promise<void> {
  const { setPartnerEmail, setOutgoingInvite } = useAuthStore.getState();

  // Never read or write pendingInvite here — only bootstrap sets it after this completes.
  log('[refreshCoupleData] start', { coupleId, userId });

  const members = await getCoupleMembers(coupleId);
  const partner = members.find((member) => member.userId !== userId);
  setPartnerEmail(partner?.email ?? null);

  const outgoing = await getPendingOutgoingInvite(coupleId);
  setOutgoingInvite(outgoing);

  usePeriodsStore.setState({ isLoading: true, periods: [] });
  await useSettingsStore.getState().loadSettings(coupleId);

  log('[refreshCoupleData] done', {
    coupleId,
    partnerEmail: partner?.email ?? null,
    outgoingInvite: outgoing,
  });
}

export function useCouple() {
  const user = useAuthStore((state) => state.user);
  const coupleId = useAuthStore((state) => state.coupleId);
  const partnerEmail = useAuthStore((state) => state.partnerEmail);
  const pendingInvite = useAuthStore((state) => state.pendingInvite);
  const outgoingInvite = useAuthStore((state) => state.outgoingInvite);
  const setCoupleId = useAuthStore((state) => state.setCoupleId);
  const setPartnerEmail = useAuthStore((state) => state.setPartnerEmail);
  const setPendingInvite = useAuthStore((state) => state.setPendingInvite);
  const setOutgoingInvite = useAuthStore((state) => state.setOutgoingInvite);
  const isCoupleBootstrapping = useAuthStore((state) => state.isCoupleBootstrapping);

  const [loading, setLoading] = useState(false);
  const [acceptingInvite, setAcceptingInvite] = useState(false);
  const [cancellingInvite, setCancellingInvite] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshCoupleState = useCallback(async () => {
    const { user: currentUser, coupleId: currentCoupleId } = useAuthStore.getState();
    if (!currentUser?.uid || !currentCoupleId) {
      setPartnerEmail(null);
      setOutgoingInvite(null);
      return;
    }

    await refreshCoupleData(currentCoupleId, currentUser.uid);
  }, [setOutgoingInvite, setPartnerEmail]);

  useEffect(() => {
    if (isCoupleBootstrapping) {
      log('[useCouple] skip refreshCoupleState — bootstrap in progress');
      return;
    }

    void refreshCoupleState();
  }, [refreshCoupleState, coupleId, user?.uid, isCoupleBootstrapping]);

  const invitePartnerByEmail = useCallback(
    async (email: string) => {
      const { coupleId: currentCoupleId } = useAuthStore.getState();
      if (!currentCoupleId) {
        throw new Error('Couple is not initialized');
      }

      setLoading(true);
      setError(null);
      try {
        await invitePartner(currentCoupleId, email);
        await refreshCoupleState();
      } catch (inviteError) {
        logFirebaseError('[invitePartnerByEmail] error', inviteError);
        setError(
          inviteError instanceof Error
            ? inviteError.message
            : 'Failed to send invite',
        );
        throw inviteError;
      } finally {
        setLoading(false);
      }
    },
    [refreshCoupleState],
  );

  const disconnect = useCallback(async () => {
    const { user: currentUser, coupleId: currentCoupleId } = useAuthStore.getState();
    if (!currentUser?.uid || !currentCoupleId) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await disconnectCouple(currentUser.uid, currentCoupleId);
      const nextCoupleId = await ensureCoupleForUser(
        currentUser.uid,
        currentUser.email ?? '',
      );
      setCoupleId(nextCoupleId);
      setPartnerEmail(null);
      setOutgoingInvite(null);
      await refreshCoupleData(nextCoupleId, currentUser.uid);
    } catch (disconnectError) {
      logFirebaseError('[disconnect] error', disconnectError);
      setError(
        disconnectError instanceof Error
          ? disconnectError.message
          : 'Failed to disconnect',
      );
      throw disconnectError;
    } finally {
      setLoading(false);
    }
  }, [setCoupleId, setOutgoingInvite, setPartnerEmail]);

  const acceptPendingInvite = useCallback(async () => {
    const {
      user: currentUser,
      pendingInvite: invite,
    } = useAuthStore.getState();

    log('[acceptPendingInvite] start', {
      userId: currentUser?.uid ?? null,
      pendingInvite: invite,
    });

    if (!currentUser?.uid || !invite) {
      console.warn('[acceptPendingInvite] missing user or pendingInvite');
      return;
    }

    const { inviteId, coupleId: newCoupleId } = invite;

    setAcceptingInvite(true);
    setError(null);
    try {
      log('[acceptPendingInvite] calling acceptInvite', {
        userId: currentUser.uid,
        inviteId,
        coupleId: newCoupleId,
      });

      await acceptInvite(currentUser.uid, inviteId, newCoupleId);

      log('[acceptPendingInvite] acceptInvite succeeded — refreshing token');
      try {
        await getAuth().currentUser?.getIdToken(true);
      } catch (tokenError) {
        log('[acceptPendingInvite] token refresh failed (non-fatal)', tokenError);
      }

      log('[acceptPendingInvite] updating store');
      setCoupleId(newCoupleId);
      setPendingInvite(null);

      await refreshCoupleData(newCoupleId, currentUser.uid);

      log('[acceptPendingInvite] complete', { coupleId: newCoupleId });
    } catch (acceptError) {
      logFirebaseError('[acceptPendingInvite] error', acceptError);
      setError(
        acceptError instanceof Error
          ? acceptError.message
          : 'Failed to accept invite',
      );
      throw acceptError;
    } finally {
      setAcceptingInvite(false);
    }
  }, [setCoupleId, setPendingInvite]);

  const declinePendingInvite = useCallback(async () => {
    const { pendingInvite: invite } = useAuthStore.getState();
    if (!invite) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await declineInvite(invite.coupleId, invite.inviteId);
      setPendingInvite(null);
    } catch (declineError) {
      logFirebaseError('[declinePendingInvite] error', declineError);
      setError(
        declineError instanceof Error
          ? declineError.message
          : 'Failed to decline invite',
      );
      throw declineError;
    } finally {
      setLoading(false);
    }
  }, [setPendingInvite]);

  const cancelOutgoingInvite = useCallback(async () => {
    const {
      coupleId: currentCoupleId,
      outgoingInvite: invite,
    } = useAuthStore.getState();

    log('[cancelOutgoingInvite] start', {
      coupleId: currentCoupleId,
      outgoingInvite: invite,
    });

    if (!currentCoupleId || !invite) {
      console.warn('[cancelOutgoingInvite] missing coupleId or outgoingInvite');
      return;
    }

    setCancellingInvite(true);
    setError(null);
    try {
      log('[cancelOutgoingInvite] calling cancelInvite', {
        coupleId: currentCoupleId,
        inviteId: invite.inviteId,
      });

      await cancelInvite(currentCoupleId, invite.inviteId);

      log('[cancelOutgoingInvite] cancelInvite succeeded — clearing store');
      setOutgoingInvite(null);

      const { user: currentUser } = useAuthStore.getState();
      if (currentUser?.uid) {
        await refreshCoupleData(currentCoupleId, currentUser.uid);
      }

      log('[cancelOutgoingInvite] complete');
    } catch (cancelError) {
      logFirebaseError('[cancelOutgoingInvite] error', cancelError);
      setError(
        cancelError instanceof Error
          ? cancelError.message
          : 'Failed to cancel invite',
      );
      throw cancelError;
    } finally {
      setCancellingInvite(false);
    }
  }, [setOutgoingInvite]);

  const isConnected = Boolean(partnerEmail);

  return {
    coupleId,
    partnerEmail,
    outgoingInvite,
    pendingInvite,
    isConnected,
    loading,
    acceptingInvite,
    cancellingInvite,
    error,
    invitePartner: invitePartnerByEmail,
    disconnect,
    acceptPendingInvite,
    declinePendingInvite,
    cancelOutgoingInvite,
    refreshCoupleState,
  };
}

export async function bootstrapCoupleForAuthUser(
  userId: string,
  authEmail: string | null | undefined,
): Promise<void> {
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

    // Refresh partner/outgoing/settings/periods — never touches pendingInvite.
    await refreshCoupleData(resolvedCoupleId, userId);
    if (!isCurrentBootstrap()) {
      log('[bootstrapCoupleForAuthUser] stale after refreshCoupleData');
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
    const lookupEmail = authEmail ?? userDoc?.email ?? '';
    log('[bootstrapCoupleForAuthUser] calling checkPendingInvite', {
      authEmail: authEmail ?? null,
      userDocEmail: userDoc?.email ?? null,
      lookupEmail: lookupEmail || '(empty)',
    });

    if (!lookupEmail) {
      log(
        '[bootstrapCoupleForAuthUser] no email yet — skipping invite check (pendingInvite unchanged)',
      );
      return;
    }

    let pending: Awaited<ReturnType<typeof checkPendingInvite>> = null;
    try {
      pending = await checkPendingInvite(lookupEmail);
    } catch (error) {
      logError('[bootstrapCoupleForAuthUser] checkPendingInvite failed', error);
      return;
    }

    if (!isCurrentBootstrap()) {
      log('[bootstrapCoupleForAuthUser] stale after checkPendingInvite');
      return;
    }

    log('[bootstrapCoupleForAuthUser] checkPendingInvite result', pending);

    if (!pending) {
      log(
        '[bootstrapCoupleForAuthUser] no pending invite found — leaving pendingInvite unchanged',
      );
      return;
    }

    log('[bootstrap] calling getCoupleMembers', pending.coupleId);

    let invitingMembers: CoupleMemberInfo[] = [];
    try {
      invitingMembers = await getCoupleMembers(pending.coupleId);
    } catch (err) {
      logError('[bootstrap] getCoupleMembers FAILED:', err);
      // Still proceed — inviterEmail is optional
      invitingMembers = [];
    }

    if (!isCurrentBootstrap()) {
      log('[bootstrapCoupleForAuthUser] stale after getCoupleMembers');
      return;
    }

    const inviter = invitingMembers.find((member) => member.role === 'owner');
    const inviterEmail = inviter?.email ?? '';

    const bannerState = {
      inviteId: pending.inviteId,
      coupleId: pending.coupleId,
      inviterEmail,
    };

    log('[bootstrapCoupleForAuthUser] setting pending invite banner', bannerState);

    useAuthStore.getState().setPendingInvite({
      inviteId: pending.inviteId,
      coupleId: pending.coupleId,
      inviterEmail,
    });
  } finally {
    if (isCurrentBootstrap()) {
      useAuthStore.getState().setCoupleBootstrapping(false);
    }

    log('[bootstrap] pendingInvite in store right now:', {
      pendingInvite: useAuthStore.getState().pendingInvite,
      coupleId: useAuthStore.getState().coupleId,
      generation,
      isCurrent: isCurrentBootstrap(),
    });
  }
}
