import { useCallback, useRef, useState } from 'react';
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
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { textStartStyle } from '@/utils/rtl';

const PIN_LENGTH = 6;

type PinModalProps = {
  onVerify: (pin: string) => Promise<boolean>;
};

export function PinModal({ onVerify }: PinModalProps) {
  const { t } = useTranslation();
  const inputRef = useRef<TextInput>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
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

  const handleSubmit = useCallback(
    async (value: string) => {
      if (value.length !== PIN_LENGTH || submitting) {
        return;
      }

      setSubmitting(true);
      setError(null);

      try {
        const success = await onVerify(value);
        if (!success) {
          setError(t('admin.pinIncorrect'));
          setPin('');
          triggerShake();
          inputRef.current?.focus();
        }
      } finally {
        setSubmitting(false);
      }
    },
    [onVerify, submitting, t, triggerShake],
  );

  const handleChangeText = useCallback(
    (value: string) => {
      const digits = value.replace(/\D/g, '').slice(0, PIN_LENGTH);
      setPin(digits);
      if (error) {
        setError(null);
      }

      if (digits.length === PIN_LENGTH) {
        void handleSubmit(digits);
      }
    },
    [error, handleSubmit],
  );

  return (
    <View className="absolute inset-0 z-50 bg-white" pointerEvents="auto">
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View className="flex-1 items-center justify-center px-6">
            <Animated.View style={shakeStyle} className="w-full max-w-sm gap-6">
              <View className="gap-2">
                <Text
                  className="text-center text-xl font-bold text-neutral-900"
                  style={textStartStyle()}
                >
                  {t('admin.enterPin')}
                </Text>
              </View>

              <TextInput
                ref={inputRef}
                className="rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-3.5 text-center text-2xl font-semibold tracking-[0.4em] text-neutral-900"
                value={pin}
                onChangeText={handleChangeText}
                placeholder="••••••"
                placeholderTextColor="#999"
                keyboardType="number-pad"
                inputMode="numeric"
                maxLength={PIN_LENGTH}
                autoComplete="off"
                textContentType="password"
                returnKeyType="done"
                onSubmitEditing={() => void handleSubmit(pin)}
                editable={!submitting}
                textAlign="center"
                secureTextEntry
                accessibilityLabel={t('admin.enterPin')}
              />

              {error ? (
                <Text
                  className="rounded-lg bg-red-50 px-3 py-2.5 text-center text-sm text-red-800"
                  style={textStartStyle()}
                >
                  {error}
                </Text>
              ) : null}

              {submitting ? (
                <ActivityIndicator size="small" color="#1a1a1a" />
              ) : (
                <Pressable
                  className={`min-h-[52px] items-center justify-center rounded-xl bg-neutral-900 py-4 ${
                    pin.length === PIN_LENGTH ? '' : 'opacity-60'
                  }`}
                  onPress={() => void handleSubmit(pin)}
                  disabled={pin.length !== PIN_LENGTH || submitting}
                  accessibilityRole="button"
                  accessibilityState={{
                    disabled: pin.length !== PIN_LENGTH || submitting,
                  }}
                >
                  <Text className="text-base font-semibold text-white">
                    {t('admin.verify')}
                  </Text>
                </Pressable>
              )}
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
