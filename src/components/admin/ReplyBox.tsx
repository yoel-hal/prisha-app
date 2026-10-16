import { db, functions } from '@/firebase/config';
import type { SupportThreadStatus } from '@/types/supportThread';
import { textStartStyle } from '@/utils/rtl';
import { doc, updateDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

type ReplyBoxProps = {
  threadId: string;
  status: SupportThreadStatus;
  onStatusChange?: (status: SupportThreadStatus) => void;
};

export function ReplyBox({ threadId, status, onStatusChange }: ReplyBoxProps) {
  const { t } = useTranslation();
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = useCallback(async () => {
    const trimmed = body.trim();
    if (!trimmed || sending) {
      return;
    }

    setSending(true);
    setError(null);

    try {
      const callable = httpsCallable<
        { threadId: string; body: string },
        { success: boolean }
      >(functions, 'sendSupportReply');
      await callable({ threadId, body: trimmed });
      setBody('');
    } catch (sendError) {
      const message =
        sendError instanceof Error ? sendError.message : 'Failed to send reply';
      setError(message);
    } finally {
      setSending(false);
    }
  }, [body, sending, threadId]);

  const handleStatusChange = useCallback(
    async (nextStatus: SupportThreadStatus) => {
      if (updatingStatus || nextStatus === status) {
        return;
      }

      setUpdatingStatus(true);
      setError(null);

      try {
        await updateDoc(doc(db, 'supportThreads', threadId), {
          status: nextStatus,
        });
        onStatusChange?.(nextStatus);
      } catch (statusError) {
        const message =
          statusError instanceof Error
            ? statusError.message
            : 'Failed to update status';
        setError(message);
      } finally {
        setUpdatingStatus(false);
      }
    },
    [onStatusChange, status, threadId, updatingStatus],
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="border-t border-neutral-200 bg-white"
    >
      <View className="gap-3 px-4 py-3">
        <View className="flex-row flex-wrap gap-2">
          {status !== 'resolved' ? (
            <Pressable
              className="rounded-lg border border-neutral-300 px-3 py-2"
              onPress={() => void handleStatusChange('resolved')}
              disabled={updatingStatus || sending}
              accessibilityRole="button"
            >
              <Text className="text-sm font-medium text-neutral-700">
                {t('admin.inbox.markResolved')}
              </Text>
            </Pressable>
          ) : (
            <Pressable
              className="rounded-lg border border-neutral-300 px-3 py-2"
              onPress={() => void handleStatusChange('open')}
              disabled={updatingStatus || sending}
              accessibilityRole="button"
            >
              <Text className="text-sm font-medium text-neutral-700">
                {t('admin.inbox.reopen')}
              </Text>
            </Pressable>
          )}
        </View>

        <Text className="text-sm font-medium text-neutral-700" style={textStartStyle()}>
          {t('admin.inbox.reply')}
        </Text>

        <TextInput
          className="min-h-[96px] rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-base text-neutral-900"
          value={body}
          onChangeText={setBody}
          placeholder={t('admin.inbox.reply')}
          placeholderTextColor="#999"
          multiline
          textAlignVertical="top"
          editable={!sending}
          style={textStartStyle()}
        />

        {error ? (
          <Text
            className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800"
            style={textStartStyle()}
          >
            {error}
          </Text>
        ) : null}

        <Pressable
          className={`min-h-[48px] items-center justify-center rounded-xl bg-neutral-900 py-3 ${
            body.trim().length > 0 && !sending ? '' : 'opacity-60'
          }`}
          onPress={() => void handleSend()}
          disabled={body.trim().length === 0 || sending}
          accessibilityRole="button"
        >
          {sending ? (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator size="small" color="#fff" />
              <Text className="text-base font-semibold text-white">
                {t('admin.inbox.sending')}
              </Text>
            </View>
          ) : (
            <Text className="text-base font-semibold text-white">
              {t('admin.inbox.send')}
            </Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
