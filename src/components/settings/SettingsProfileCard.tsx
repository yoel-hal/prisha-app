import { Icon } from '@/components/common/Icon';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuthStore } from '../../store/authStore';
import {
  getDisplayFullName,
  getProfileInitials,
} from '../../utils/profileDisplay';
import { textStartStyle } from '../../utils/rtl';

type SettingsProfileCardProps = {
  onPress?: () => void;
  showEditIcon?: boolean;
};

export function SettingsProfileCard({
  onPress,
  showEditIcon = false,
}: SettingsProfileCardProps) {
  const user = useAuthStore((state) => state.user);
  const firstName = useAuthStore((state) => state.firstName);
  const lastName = useAuthStore((state) => state.lastName);

  const email = user?.email ?? '';
  const fullName = getDisplayFullName(firstName, lastName);
  const showName = fullName.length > 0;
  const initials = getProfileInitials(firstName, lastName, email);

  if (!email) {
    return null;
  }

  const avatar = (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{initials}</Text>
    </View>
  );

  return (
    <View style={styles.card}>
      {onPress ? (
        <Pressable
          style={styles.avatarPressable}
          onPress={onPress}
          accessibilityRole="button"
        >
          {avatar}
          {showEditIcon ? (
            <View style={styles.avatarEditBadge}>
              <Icon name="edit-2" size={12} color="#fff" />
            </View>
          ) : null}
        </Pressable>
      ) : (
        <View style={styles.avatarPressable}>{avatar}</View>
      )}
      <View style={styles.info}>
        {showName ? (
          <Text style={[styles.name, textStartStyle()]}>{fullName}</Text>
        ) : null}
        <Text
          style={[
            showName ? styles.emailMuted : styles.emailPrimary,
            textStartStyle(),
          ]}
        >
          {email}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  avatarPressable: {
    position: 'relative',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#A8485F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  avatarEditBadge: {
    position: 'absolute',
    end: -2,
    bottom: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#A8485F',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2A2226',
  },
  emailPrimary: {
    fontSize: 15,
    color: '#2A2226',
  },
  emailMuted: {
    fontSize: 14,
    color: '#5F5459',
  },
});
