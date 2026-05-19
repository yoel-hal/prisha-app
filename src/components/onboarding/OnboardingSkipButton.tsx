import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type OnboardingSkipButtonProps = {
  onSkip: () => void;
};

function OnboardingSkipButton({ onSkip }: OnboardingSkipButtonProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <Pressable
      style={[styles.skip, { top: insets.top + 8 }]}
      onPress={onSkip}
      hitSlop={12}
    >
      <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  skip: {
    position: 'absolute',
    end: 20,
    zIndex: 10,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  skipText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
});

export default OnboardingSkipButton;
