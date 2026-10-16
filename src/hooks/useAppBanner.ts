import { db } from '@/firebase/config';
import type { AppMessage } from '@/types';
import { getBannerId } from '@/types';
import { log } from '@/utils/log';
import {
  arrayUnion,
  doc,
  onSnapshot,
  updateDoc,
  type Timestamp,
} from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuthStore } from '../store/authStore';

function mapAppMessage(
  id: string,
  data: Record<string, unknown>,
): AppMessage | null {
  const titleHe = typeof data.titleHe === 'string' ? data.titleHe : '';
  const titleEn = typeof data.titleEn === 'string' ? data.titleEn : '';
  const bodyHe = typeof data.bodyHe === 'string' ? data.bodyHe : '';
  const bodyEn = typeof data.bodyEn === 'string' ? data.bodyEn : '';
  const activeFrom = data.activeFrom;
  const activeUntil = data.activeUntil;
  const createdAt = data.createdAt;

  if (
    !titleHe ||
    !titleEn ||
    !bodyHe ||
    !bodyEn ||
    !activeFrom ||
    typeof activeFrom !== 'object' ||
    !('toMillis' in activeFrom) ||
    !activeUntil ||
    typeof activeUntil !== 'object' ||
    !('toMillis' in activeUntil) ||
    !createdAt ||
    typeof createdAt !== 'object' ||
    !('toMillis' in createdAt)
  ) {
    return null;
  }

  const ctaTextHe =
    typeof data.ctaTextHe === 'string' ? data.ctaTextHe : null;
  const ctaTextEn =
    typeof data.ctaTextEn === 'string' ? data.ctaTextEn : null;
  const ctaUrl = typeof data.ctaUrl === 'string' ? data.ctaUrl : null;

  return {
    id,
    titleHe,
    titleEn,
    bodyHe,
    bodyEn,
    ctaTextHe,
    ctaTextEn,
    ctaUrl,
    activeFrom: activeFrom as Timestamp,
    activeUntil: activeUntil as Timestamp,
    isActive: data.isActive === true,
    createdAt: createdAt as Timestamp,
  };
}

function isWithinActiveWindow(message: AppMessage, nowMs: number): boolean {
  return (
    nowMs >= message.activeFrom.toMillis() &&
    nowMs <= message.activeUntil.toMillis()
  );
}

export function useAppBanner() {
  const userId = useAuthStore((state) => state.user?.uid ?? null);
  const [rawMessage, setRawMessage] = useState<AppMessage | null>(null);
  const [dismissedBannerIds, setDismissedBannerIds] = useState<string[]>([]);
  const [optimisticallyDismissedIds, setOptimisticallyDismissedIds] = useState<
    string[]
  >([]);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    log('[useAppBanner] enter');

    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 60_000);

    const messageRef = doc(db, 'appMessages', 'active');
    const unsubscribeMessage = onSnapshot(
      messageRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setRawMessage(null);
          return;
        }

        setRawMessage(mapAppMessage(snapshot.id, snapshot.data()));
      },
      (error) => {
        log('[useAppBanner] message snapshot error', error);
        setRawMessage(null);
      },
    );

    return () => {
      log('[useAppBanner] exit');
      clearInterval(interval);
      unsubscribeMessage();
    };
  }, []);

  useEffect(() => {
    if (!userId) {
      setDismissedBannerIds([]);
      return;
    }

    const userRef = doc(db, 'users', userId);
    const unsubscribeUser = onSnapshot(
      userRef,
      (snapshot) => {
        const data = snapshot.data();
        const ids = data?.dismissedBannerIds;
        setDismissedBannerIds(
          Array.isArray(ids)
            ? ids.filter((id): id is string => typeof id === 'string')
            : [],
        );
      },
      (error) => {
        log('[useAppBanner] user snapshot error', error);
        setDismissedBannerIds([]);
      },
    );

    return () => {
      unsubscribeUser();
    };
  }, [userId]);

  const banner = useMemo(() => {
    if (!rawMessage || !rawMessage.isActive) {
      return null;
    }

    if (!isWithinActiveWindow(rawMessage, nowMs)) {
      return null;
    }

    const bannerId = getBannerId(rawMessage.createdAt);
    const allDismissed = [...dismissedBannerIds, ...optimisticallyDismissedIds];

    if (allDismissed.includes(bannerId)) {
      return null;
    }

    return rawMessage;
  }, [dismissedBannerIds, nowMs, optimisticallyDismissedIds, rawMessage]);

  const dismiss = useCallback(() => {
    if (!rawMessage || !userId) {
      return;
    }

    const bannerId = getBannerId(rawMessage.createdAt);
    setOptimisticallyDismissedIds((current) =>
      current.includes(bannerId) ? current : [...current, bannerId],
    );

    void updateDoc(doc(db, 'users', userId), {
      dismissedBannerIds: arrayUnion(bannerId),
    }).catch((error) => {
      log('[useAppBanner] dismiss error', error);
      setOptimisticallyDismissedIds((current) =>
        current.filter((id) => id !== bannerId),
      );
    });
  }, [rawMessage, userId]);

  return { banner, dismiss };
}
