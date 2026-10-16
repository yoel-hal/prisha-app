import type { SupportMessage } from '@/types/supportThread';
import { textStartStyle } from '@/utils/rtl';
import type { Timestamp } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';

type ThreadViewProps = {
  messages: SupportMessage[];
  userEmail: string;
};

function formatSentAt(timestamp: Timestamp, locale: string): string {
  return timestamp.toDate().toLocaleString(locale === 'he' ? 'he-IL' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function ThreadView({ messages, userEmail }: ThreadViewProps) {
  const { i18n } = useTranslation();

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="gap-3 px-4 py-4"
    >
      {messages.map((message) => {
        const isAdmin = message.sentBy === 'admin';

        return (
          <View
            key={message.id}
            className={`max-w-[85%] ${isAdmin ? 'self-end' : 'self-start'}`}
          >
            {!isAdmin ? (
              <Text className="mb-1 text-xs text-neutral-500" style={textStartStyle()}>
                {userEmail}
              </Text>
            ) : null}
            <View
              className={`rounded-2xl px-4 py-3 ${
                isAdmin ? 'bg-blue-600' : 'bg-neutral-200'
              }`}
            >
              <Text
                className={`text-sm leading-5 ${
                  isAdmin ? 'text-white' : 'text-neutral-900'
                }`}
                style={textStartStyle()}
              >
                {message.body}
              </Text>
            </View>
            <Text
              className={`mt-1 text-xs text-neutral-500 ${
                isAdmin ? 'text-end' : 'text-start'
              }`}
            >
              {formatSentAt(message.sentAt, i18n.language)}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}
