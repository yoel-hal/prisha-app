import { Icon } from '@/components/common/Icon';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { textStartStyle } from '../../utils/rtl';

const PIN_LENGTH = 4;
const KEYPAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'blank', '0', 'backspace'] as const;

type PinKeypadProps = {
  title: string;
  subtitle?: string;
  error?: string | null;
  onComplete: (pin: string) => void;
};

export function PinKeypad({ title, subtitle, error, onComplete }: PinKeypadProps) {
  const [digits, setDigits] = useState('');
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (digits.length !== PIN_LENGTH) {
      return;
    }

    const pin = digits;
    setDigits('');
    onCompleteRef.current(pin);
  }, [digits]);

  const handleDelete = useCallback(() => {
    setDigits((current) => current.slice(0, -1));
  }, []);

  const handleDigit = useCallback((digit: string) => {
    setDigits((current) => {
      if (current.length >= PIN_LENGTH) {
        return current;
      }
      return current + digit;
    });
  }, []);

  const handleKeyPress = useCallback((key: (typeof KEYPAD_KEYS)[number]) => {
    if (key === 'blank') {
      return;
    }

    if (key === 'backspace') {
      handleDelete();
      return;
    }

    handleDigit(key);
  }, [handleDelete, handleDigit]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleDigit(e.key);
        return;
      }
      if (e.key === 'Backspace') {
        e.preventDefault();
        handleDelete();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigit, handleDelete]);

  return (
    <View style={styles.container}>
      <Text style={[styles.title, textStartStyle()]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, textStartStyle()]}>{subtitle}</Text>
      ) : null}

      <View style={styles.dotsRow}>
        {Array.from({ length: PIN_LENGTH }, (_, index) => (
          <View
            key={index}
            style={[styles.dot, index < digits.length && styles.dotFilled]}
          />
        ))}
      </View>

      {error ? (
        <Text style={[styles.error, textStartStyle()]}>{error}</Text>
      ) : null}

      <View style={styles.keypad}>
        {KEYPAD_KEYS.map((key) => {
          if (key === 'blank') {
            return <View key="blank" style={styles.keyBlank} />;
          }

          if (key === 'backspace') {
            return (
              <Pressable
                key="backspace"
                style={styles.key}
                onPress={() => handleKeyPress('backspace')}
                accessibilityRole="button"
                accessibilityLabel="Backspace"
              >
                <Icon name="delete" size={22} color="#1a1a1a" />
              </Pressable>
            );
          }

          return (
            <Pressable
              key={key}
              style={styles.key}
              onPress={() => handleKeyPress(key)}
              accessibilityRole="button"
              accessibilityLabel={key}
            >
              <Text style={styles.keyText}>{key}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 16,
    width: '100%',
    maxWidth: 320,
    alignSelf: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 16,
    marginVertical: 8,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#999',
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: '#1a1a1a',
    borderColor: '#1a1a1a',
  },
  error: {
    fontSize: 14,
    color: '#C62828',
    textAlign: 'center',
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    maxWidth: 280,
    justifyContent: 'center',
    gap: 12,
  },
  key: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyBlank: {
    width: 72,
    height: 72,
  },
  keyText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1a1a1a',
  },
});
