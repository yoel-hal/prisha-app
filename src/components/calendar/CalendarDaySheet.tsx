import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { VesetType } from '../../calculations/types';
import type { SupportedLanguage } from '../../i18n';
import type { CalendarDayEvent } from '../../utils/calendarMarkers';
import { formatHebrewDate } from '../../utils/hebrewDateFormat';
import { textStartStyle } from '../../utils/rtl';
const SHEET_HEIGHT = Dimensions.get('window').height * 0.45;

export interface CalendarDaySheetProps {
  visible: boolean;
  onClose: () => void;
  selectedEvent: CalendarDayEvent | null;
  events?: CalendarDayEvent[];
}

function vesetTranslationKey(type: VesetType): string {
  return `veset.${type}`;
}

export function CalendarDaySheet({
  visible,
  onClose,
  selectedEvent,
  events,
}: CalendarDaySheetProps) {
  const { t, i18n } = useTranslation();
  const language = i18n.language as SupportedLanguage;
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [modalVisible, setModalVisible] = useState(false);

  const displayEvents = events ?? (selectedEvent ? [selectedEvent] : []);

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      slideAnim.setValue(SHEET_HEIGHT);
      fadeAnim.setValue(0);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 20,
          stiffness: 200,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    if (!modalVisible) {
      return;
    }

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: SHEET_HEIGHT,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setModalVisible(false);
      }
    });
  }, [visible, modalVisible, slideAnim, fadeAnim]);

  function handleClose() {
    onClose();
  }

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.modalRoot}>
        <Pressable style={styles.backdropPressable} onPress={handleClose}>
          <Animated.View
            style={[styles.backdrop, { opacity: fadeAnim }]}
          />
        </Pressable>

        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(insets.bottom, 16),
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.handle} />

          <View style={styles.content}>
            {displayEvents.map((event, index) => (
              <View key={`${event.kind}-${index}`} style={styles.eventBlock}>
                <Text style={[styles.title, textStartStyle()]}>
                  {event.vesetType
                    ? t(vesetTranslationKey(event.vesetType))
                    : t('period.saved')}
                </Text>
                <Text style={[styles.row, textStartStyle()]}>
                  {formatHebrewDate(event.dateHebrew, language)}
                </Text>
                <Text style={[styles.row, textStartStyle()]}>
                  {t(event.onah === 'day' ? 'period.day' : 'period.night')}
                </Text>
              </View>
            ))}

            {displayEvents.length > 0 ? (
              <View style={styles.actions}>
                <Pressable style={styles.actionButton}>
                  <Text style={styles.actionText}>
                    {t('calendar.addToCalendar')}
                  </Text>
                </Pressable>
                <Pressable style={styles.actionButton}>
                  <Text style={styles.actionText}>
                    {t('calendar.setReminder')}
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropPressable: {
    ...StyleSheet.absoluteFillObject,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopStartRadius: 16,
    borderTopEndRadius: 16,
    minHeight: SHEET_HEIGHT,
    maxHeight: '70%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ddd',
    marginTop: 10,
    marginBottom: 8,
  },
  content: {
    paddingHorizontal: 20,
    gap: 16,
  },
  eventBlock: {
    gap: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  row: {
    fontSize: 16,
    color: '#444',
  },
  actions: {
    gap: 10,
    marginTop: 8,
  },
  actionButton: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
