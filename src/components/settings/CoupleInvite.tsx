import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ensureCoupleInvite } from '../../firebase/firestore';
import { useAuthStore } from '../../store/authStore';
import { textStartStyle } from '../../utils/rtl';

interface CoupleInviteProps {
  coupleId: string;
}

export function CoupleInvite({ coupleId }: CoupleInviteProps) {
  const { t, i18n } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleShareInvite = useCallback(async () => {
    if (!user?.email) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const invite = await ensureCoupleInvite(coupleId, user.email);
      setInviteLink(invite.link);
      setExpiresAt(invite.expiresAt);
      await Share.share({ message: invite.link });
    } catch {
      setError(t('couple.inviteShareFailed'));
    } finally {
      setLoading(false);
    }
  }, [coupleId, t, user?.email]);

  const expiresLabel =
    expiresAt &&
    new Intl.DateTimeFormat(i18n.language, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(expiresAt);

  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={() => void handleShareInvite()}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{t('couple.invitePartner')}</Text>
        )}
      </Pressable>

      {inviteLink ? (
        <Text style={[styles.linkPreview, textStartStyle()]} selectable>
          {inviteLink}
        </Text>
      ) : null}

      {expiresLabel ? (
        <Text style={[styles.expires, textStartStyle()]}>
          {t('couple.inviteExpires', { date: expiresLabel })}
        </Text>
      ) : null}

      {error ? (
        <Text style={[styles.error, textStartStyle()]}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  button: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkPreview: {
    fontSize: 14,
    color: '#555',
  },
  expires: {
    fontSize: 13,
    color: '#888',
  },
  error: {
    fontSize: 14,
    color: '#C62828',
  },
});
