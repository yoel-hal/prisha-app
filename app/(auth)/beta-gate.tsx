import { useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { textStartStyle } from '../../src/utils/rtl';
import { webScreenScrollStyles } from '../../src/utils/webScroll';

const TESTER_CODE = process.env.EXPO_PUBLIC_TESTER_CODE ?? '';

export default function BetaGateScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const webScroll = webScreenScrollStyles();
  const inputRef = useRef<TextInput>(null);
  const [code, setCode] = useState('');
  const [showError, setShowError] = useState(false);
  const shakeOffset = useSharedValue(0);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeOffset.value }],
  }));

  const triggerShake = useCallback(() => {
    shakeOffset.value = withSequence(
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(0, { duration: 50 }),
    );
  }, [shakeOffset]);

  const handleSubmit = useCallback(() => {
    const trimmed = code.trim();
    if (trimmed.length !== 6) {
      return;
    }

    if (trimmed === TESTER_CODE) {
      setShowError(false);
      router.replace('/(auth)/login');
      return;
    }

    setShowError(true);
    triggerShake();
    inputRef.current?.focus();
  }, [code, router, triggerShake]);

  const canSubmit = code.length === 6;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          style={webScroll.scroll}
        >
          <View className="min-h-full flex-grow justify-center px-6 py-8">
          <Animated.View style={shakeStyle} className="gap-8">
            <View className="items-center gap-6">
              <View className="items-center gap-2">
                <Text className="text-center text-2xl font-bold text-neutral-900">
                  {t('betaGate.title', { lng: 'he' })}
                </Text>
                <Text className="text-center text-base text-neutral-500">
                  {t('betaGate.subtitle', { lng: 'he' })}
                </Text>
              </View>

              <View className="items-center gap-2">
                <Text className="text-center text-2xl font-bold text-neutral-900">
                  {t('betaGate.title', { lng: 'en' })}
                </Text>
                <Text className="text-center text-base text-neutral-500">
                  {t('betaGate.subtitle', { lng: 'en' })}
                </Text>
              </View>
            </View>

            <View className="gap-4">
              <TextInput
                ref={inputRef}
                className="rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3.5 text-center text-2xl font-semibold tracking-[0.4em] text-neutral-900"
                value={code}
                onChangeText={(value) => {
                  const digits = value.replace(/\D/g, '').slice(0, 6);
                  setCode(digits);
                  if (showError) {
                    setShowError(false);
                  }
                }}
                placeholder={t('betaGate.codePlaceholder')}
                placeholderTextColor="#999"
                keyboardType="number-pad"
                inputMode="numeric"
                maxLength={6}
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                editable
                textAlign="center"
                accessibilityLabel={t('betaGate.codePlaceholder')}
              />

              {showError ? (
                <Text
                  className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-800"
                  style={textStartStyle()}
                >
                  {t('betaGate.error')}
                </Text>
              ) : null}

              <Pressable
                className={`min-h-[52px] items-center justify-center rounded-xl bg-neutral-900 py-4 ${
                  canSubmit ? '' : 'opacity-60'
                }`}
                onPress={handleSubmit}
                disabled={!canSubmit}
                accessibilityRole="button"
                accessibilityState={{ disabled: !canSubmit }}
              >
                <Text className="text-base font-semibold text-white">
                  {t('betaGate.submit')}
                </Text>
              </Pressable>
            </View>
          </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
