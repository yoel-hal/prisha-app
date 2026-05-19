import { useCallback, useEffect, useState } from 'react';

import {
  acceptInvite,
  checkPendingInvite,
  declineInvite,
  disconnectCouple,
  ensureCoupleForUser,
  getCoupleMembers,
  getPendingOutgoingInvite,
  invitePartner,
} from '../firebase/firestore';
import { useAuthStore } from '../store/authStore';

export function useCouple() {
  const user = useAuthStore((state) => state.user);
  const coupleId = useAuthStore((state) => state.coupleId);
  const partnerEmail = useAuthStore((state) => state.partnerEmail);
  const pendingInvite = useAuthStore((state) => state.pendingInvite);
  const setCoupleId = useAuthStore((state) => state.setCoupleId);
  const setPartnerEmail = useAuthStore((state) => state.setPartnerEmail);
  const setPendingInvite = useAuthStore((state) => state.setPendingInvite);

  const [outgoingInviteEmail, setOutgoingInviteEmail] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshCoupleState = useCallback(async () => {
    if (!user?.uid || !coupleId) {
      setPartnerEmail(null);
      setOutgoingInviteEmail(null);
      return;
    }

    const members = await getCoupleMembers(coupleId);
    const partner = members.find((member) => member.userId !== user.uid);
    setPartnerEmail(partner?.email ?? null);

    const outgoing = await getPendingOutgoingInvite(coupleId);
    setOutgoingInviteEmail(outgoing?.partnerEmail ?? null);
  }, [coupleId, setPartnerEmail, user?.uid]);

  useEffect(() => {
    void refreshCoupleState();
  }, [refreshCoupleState]);

  const invitePartnerByEmail = useCallback(
    async (email: string) => {
      if (!coupleId) {
        throw new Error('Couple is not initialized');
      }

      setLoading(true);
      setError(null);
      try {
        await invitePartner(coupleId, email);
        setOutgoingInviteEmail(normalizeEmail(email));
        await refreshCoupleState();
      } catch (inviteError) {
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
    [coupleId, refreshCoupleState],
  );

  const disconnect = useCallback(async () => {
    if (!user?.uid || !coupleId) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await disconnectCouple(user.uid, coupleId);
      const nextCoupleId = await ensureCoupleForUser(
        user.uid,
        user.email ?? '',
      );
      setCoupleId(nextCoupleId);
      setPartnerEmail(null);
      setOutgoingInviteEmail(null);
      await refreshCoupleState();
    } catch (disconnectError) {
      setError(
        disconnectError instanceof Error
          ? disconnectError.message
          : 'Failed to disconnect',
      );
      throw disconnectError;
    } finally {
      setLoading(false);
    }
  }, [coupleId, refreshCoupleState, setCoupleId, setPartnerEmail, user]);

  const acceptPendingInvite = useCallback(async () => {
    if (!user?.uid || !pendingInvite) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await acceptInvite(
        user.uid,
        pendingInvite.inviteId,
        pendingInvite.coupleId,
      );
      setCoupleId(pendingInvite.coupleId);
      setPendingInvite(null);
      await refreshCoupleState();
    } catch (acceptError) {
      setError(
        acceptError instanceof Error
          ? acceptError.message
          : 'Failed to accept invite',
      );
      throw acceptError;
    } finally {
      setLoading(false);
    }
  }, [pendingInvite, refreshCoupleState, setCoupleId, setPendingInvite, user]);

  const declinePendingInvite = useCallback(async () => {
    if (!pendingInvite) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await declineInvite(pendingInvite.coupleId, pendingInvite.inviteId);
      setPendingInvite(null);
    } catch (declineError) {
      setError(
        declineError instanceof Error
          ? declineError.message
          : 'Failed to decline invite',
      );
      throw declineError;
    } finally {
      setLoading(false);
    }
  }, [pendingInvite, setPendingInvite]);

  const isConnected = Boolean(partnerEmail);

  return {
    coupleId,
    partnerEmail,
    outgoingInviteEmail,
    pendingInvite,
    isConnected,
    loading,
    error,
    invitePartner: invitePartnerByEmail,
    disconnect,
    acceptPendingInvite,
    declinePendingInvite,
    refreshCoupleState,
  };
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function bootstrapCoupleForAuthUser(
  userId: string,
  email: string,
): Promise<void> {
  const {
    setCoupleId,
    setPendingInvite,
    setPartnerEmail,
  } = useAuthStore.getState();

  const resolvedCoupleId = await ensureCoupleForUser(userId, email);
  setCoupleId(resolvedCoupleId);

  const members = await getCoupleMembers(resolvedCoupleId);
  const partner = members.find((member) => member.userId !== userId);
  setPartnerEmail(partner?.email ?? null);

  const pending = await checkPendingInvite(email);
  if (!pending) {
    setPendingInvite(null);
    return;
  }

  const invitingMembers = await getCoupleMembers(pending.coupleId);
  const inviter = invitingMembers.find((member) => member.role === 'owner');
  setPendingInvite({
    inviteId: pending.inviteId,
    coupleId: pending.coupleId,
    inviterEmail: inviter?.email ?? '',
  });
}
