import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { formatGregorianLocal } from '../../calculations/onah';
import { CHECK_TIMES, CLEAN_DAYS, checkKey } from '../../calculations/tahara';
import type { CheckKey, CheckResult, CheckTime, TaharaCycle } from '../../calculations/types';
import { colors, radius } from '../../constants/theme';
import { useOnahDateFormat } from '../../hooks/useOnahDateFormat';
import { useTahara } from '../../hooks/useTahara';
import { resolveZmanimLocation, useZmanimLocationStore } from '../../store/zmanimLocationStore';
import { showAlert } from '../../utils/alert';
import { textStartStyle } from '../../utils/rtl';
import { showToast } from '../../utils/toast';
import { formatTime, onahBounds } from '../../utils/zmanim';
import { Icon } from '../common/Icon';
import { MoonPhase } from '../common/MoonPhase';

const MIKVEH_NIGHT_IMAGE = require('../../../assets/images/mikveh-night-water.jpg');

function useSunsetToday(): string {
  const choice = useZmanimLocationStore((state) => state.choice);
  const place = resolveZmanimLocation(choice).place;
  const today = formatGregorianLocal(new Date());
  return formatTime(onahBounds({ dateGregorian: today, onah: 'day' }, place).end);
}

/**
 * Hefsek tahara and the seven clean days, at the top of the calendar.
 * Optional: hidden when turned off in settings or when there is nothing to show.
 */
export function TaharaCard() {
  const { t } = useTranslation();
  const { visible, state, recordHefsek, recordCheck, undoRestart } = useTahara();
  const [busy, setBusy] = useState(false);

  if (!visible) {
    return null;
  }

  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
    } catch {
      showToast(t('tahara.saveFailed'));
    } finally {
      setBusy(false);
    }
  }

  if (state.kind === 'waitHefsek' || state.kind === 'hefsekToday') {
    return (
      <HefsekCard
        state={state}
        busy={busy}
        onDone={(daysAgo) => void run(() => recordHefsek(daysAgo))}
        onUndo={(cycle) => void run(() => undoRestart(cycle))}
      />
    );
  }

  if (state.kind === 'counting' || state.kind === 'mikvehNight') {
    return (
      <CleanDaysCard
        cycle={state.cycle}
        today={state.kind === 'counting' ? state.day : CLEAN_DAYS + (state.isTonight ? 0 : 1)}
        mikvehNight={state.mikvehNight}
        mikvehTonight={state.kind === 'mikvehNight' && state.isTonight}
        mikvehPast={state.kind === 'mikvehNight' && !state.isTonight}
        busy={busy}
        onCheck={(key, result) => void run(() => recordCheck(key, result))}
      />
    );
  }

  return null;
}

function HefsekCard({
  state,
  busy,
  onDone,
  onUndo,
}: {
  state: Extract<ReturnType<typeof useTahara>['state'], { kind: 'waitHefsek' | 'hefsekToday' }>;
  busy: boolean;
  onDone: (daysAgo: 0 | 1) => void;
  onUndo: (cycle: TaharaCycle) => void;
}) {
  const { t } = useTranslation();
  const formatOnah = useOnahDateFormat();
  const sunset = useSunsetToday();

  if (state.kind === 'waitHefsek') {
    const date = formatOnah(state.earliest, 'day');
    return (
      <View style={styles.card}>
        <View style={styles.headRow}>
          <MoonPhase day={state.earliest.day} />
          <Text style={[styles.label, textStartStyle()]}>{t('tahara.waitTitle')}</Text>
        </View>
        <Text style={[styles.title, textStartStyle()]}>{date.hebrew}</Text>
        <Text style={[styles.body, textStartStyle()]}>
          {t('tahara.waitBody', { date: date.civil })}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.headRow}>
        <Icon name="sun" size={16} color={colors.textMuted} />
        <Text style={[styles.label, textStartStyle()]}>
          {state.afterRestart ? t('tahara.restartedTitle') : t('tahara.waitTitle')}
        </Text>
      </View>
      <Text style={[styles.title, textStartStyle()]}>{t('tahara.todayTitle')}</Text>
      <Text style={[styles.body, textStartStyle()]}>{t('tahara.todayBody', { time: sunset })}</Text>
      {state.afterRestart ? (
        <Text style={[styles.note, textStartStyle()]}>{t('tahara.restartedBody')}</Text>
      ) : null}
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={() => onDone(0)}
          style={({ pressed }) => [styles.primary, pressed && styles.primaryPressed]}
        >
          {busy ? (
            <ActivityIndicator color={colors.onAccent} />
          ) : (
            <Text style={styles.primaryText}>{t('tahara.hefsekDone')}</Text>
          )}
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={() => onDone(1)}
          style={({ pressed }) => [styles.secondary, pressed && styles.secondaryPressed]}
        >
          <Text style={styles.secondaryText}>{t('tahara.hefsekYesterday')}</Text>
        </Pressable>
      </View>
      {state.restartedCycle ? (
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={() => state.restartedCycle && onUndo(state.restartedCycle)}
          hitSlop={8}
        >
          <Text style={[styles.link, textStartStyle()]}>{t('tahara.undoRestart')}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function CleanDaysCard({
  cycle,
  today,
  mikvehNight,
  mikvehTonight,
  mikvehPast,
  busy,
  onCheck,
}: {
  cycle: TaharaCycle;
  /** 0 = hefsek day, 1–7 clean days, 8 = the day after mikveh night. */
  today: number;
  mikvehNight: TaharaCycle['hefsekDateHebrew'];
  mikvehTonight: boolean;
  mikvehPast: boolean;
  busy: boolean;
  onCheck: (key: CheckKey, result: CheckResult | null) => void;
}) {
  const { t } = useTranslation();
  const formatOnah = useOnahDateFormat();
  const [selectedDay, setSelectedDay] = useState(Math.min(Math.max(today, 1), CLEAN_DAYS));
  useEffect(() => {
    setSelectedDay(Math.min(Math.max(today, 1), CLEAN_DAYS));
  }, [today]);

  const night = formatOnah(mikvehNight, 'night');

  if (mikvehPast) {
    return (
      <View style={styles.card}>
        <View style={styles.headRow}>
          <MoonPhase day={mikvehNight.day} />
          <Text style={[styles.label, textStartStyle()]}>{t('tahara.mikvehLine')}</Text>
        </View>
        <Text style={[styles.title, textStartStyle()]}>{t('tahara.mikvehLastNight')}</Text>
      </View>
    );
  }

  function choose(time: CheckTime, result: CheckResult) {
    const key = checkKey(selectedDay, time);
    if (cycle.checks[key] === result) {
      onCheck(key, null);
      return;
    }
    if (result === 'notClean') {
      showAlert(t('tahara.notCleanConfirmTitle'), t('tahara.notCleanConfirmBody'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('tahara.notCleanConfirm'), style: 'destructive', onPress: () => onCheck(key, result) },
      ]);
      return;
    }
    onCheck(key, result);
  }

  return (
    <View style={[styles.card, mikvehTonight && styles.nightCard]}>
      {mikvehTonight ? (
        <>
          <View style={styles.nightImageWrap}>
            <Image
              source={MIKVEH_NIGHT_IMAGE}
              style={styles.nightImage}
              resizeMode="cover"
              accessible={false}
              accessibilityIgnoresInvertColors
            />
          </View>
          <View style={styles.headRow}>
            <MoonPhase day={mikvehNight.day} lit="#F3E7C9" dark="#34375A" />
            <Text style={[styles.label, styles.nightMuted, textStartStyle()]}>{night.hebrew}</Text>
          </View>
          <Text style={[styles.title, styles.nightText, textStartStyle()]}>
            {t('tahara.mikvehTonightTitle')}
          </Text>
          <Text style={[styles.body, styles.nightMuted, textStartStyle()]}>
            {t('tahara.mikvehTonightBody')}
          </Text>
        </>
      ) : (
        <>
          <View style={styles.headRow}>
            <Text style={[styles.label, textStartStyle()]}>{t('tahara.countingTitle')}</Text>
          </View>
          <Text style={[styles.title, textStartStyle()]}>
            {today === 0 ? t('tahara.startsTomorrow') : t('tahara.countingDay', { day: today })}
          </Text>
        </>
      )}

      <View style={styles.strip}>
        {Array.from({ length: CLEAN_DAYS }, (_, i) => i + 1).map((day) => {
          const reachable = day <= today;
          const selected = reachable && day === selectedDay;
          return (
            <Pressable
              key={day}
              disabled={!reachable}
              onPress={() => setSelectedDay(day)}
              accessibilityRole="button"
              accessibilityState={{ selected, disabled: !reachable }}
              accessibilityLabel={t('tahara.countingDay', { day })}
              style={[styles.stripDay, selected && (mikvehTonight ? styles.stripDaySelectedNight : styles.stripDaySelected)]}
            >
              <Text
                style={[
                  styles.stripNumber,
                  mikvehTonight && styles.nightMuted,
                  day === today && !mikvehTonight && styles.stripNumberToday,
                ]}
              >
                {t('tahara.dayShort', { day })}
              </Text>
              <View style={styles.dots}>
                {CHECK_TIMES.map((time) => (
                  <CheckDot
                    key={time}
                    result={cycle.checks[checkKey(day, time)]}
                    reachable={reachable}
                    onNight={mikvehTonight}
                  />
                ))}
              </View>
            </Pressable>
          );
        })}
      </View>

      {today >= 1 ? (
        <View style={styles.checks}>
          {CHECK_TIMES.map((time) => {
            const value = cycle.checks[checkKey(selectedDay, time)];
            return (
              <View key={time} style={styles.checkRow}>
                <View style={styles.checkLabelWrap}>
                  <Icon
                    name={time === 'morning' ? 'sun' : 'sunset'}
                    size={16}
                    color={mikvehTonight ? 'rgba(255,255,255,0.7)' : colors.textMuted}
                  />
                  <Text style={[styles.checkLabel, mikvehTonight && styles.nightText, textStartStyle()]}>
                    {t(`tahara.${time}`)}
                    {selectedDay !== today ? ` · ${t('tahara.countingDay', { day: selectedDay })}` : ''}
                  </Text>
                </View>
                <View style={[styles.segment, mikvehTonight && styles.segmentNight]}>
                  <Pressable
                    disabled={busy}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: value === 'clean' }}
                    onPress={() => choose(time, 'clean')}
                    style={[styles.segmentItem, value === 'clean' && styles.segmentClean]}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        mikvehTonight && styles.nightMuted,
                        value === 'clean' && styles.segmentTextOn,
                      ]}
                    >
                      {t('tahara.clean')}
                    </Text>
                  </Pressable>
                  <Pressable
                    disabled={busy}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: value === 'notClean' }}
                    onPress={() => choose(time, 'notClean')}
                    style={styles.segmentItem}
                  >
                    <Text style={[styles.segmentText, mikvehTonight && styles.nightMuted]}>
                      {t('tahara.notClean')}
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      ) : null}

      {!mikvehTonight ? (
        <View style={styles.footer}>
          <MoonPhase day={mikvehNight.day} />
          <View style={styles.footerTextWrap}>
            <Text style={[styles.footerLabel, textStartStyle()]}>
              {t('tahara.mikvehLine')} · {night.hebrew}
            </Text>
            <Text style={[styles.footerText, textStartStyle()]}>{night.civil}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function CheckDot({
  result,
  reachable,
  onNight,
}: {
  result: CheckResult | undefined;
  reachable: boolean;
  onNight: boolean;
}) {
  const filled = result === 'clean';
  return (
    <View
      style={[
        styles.dot,
        {
          borderColor: onNight
            ? 'rgba(255,255,255,0.45)'
            : reachable
              ? colors.accent
              : colors.hairlineStrong,
          backgroundColor: filled ? (onNight ? '#F3E7C9' : colors.accent) : 'transparent',
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 20,
    gap: 4,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairlineStrong,
  },
  nightCard: {
    backgroundColor: colors.nightSky,
    borderColor: colors.nightSky,
    overflow: 'hidden',
    paddingTop: 0,
  },
  // Full-bleed banner of a moonlit pool across the top of the mikveh-night card.
  nightImageWrap: {
    height: 192,
    marginHorizontal: -20,
    marginBottom: 16,
    overflow: 'hidden',
  },
  // Web sizes an image from its file unless width is set, so fill the wrapper explicitly.
  nightImage: { width: '100%', height: '100%' },
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  label: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
  title: { fontSize: 20, lineHeight: 28, color: colors.text, fontWeight: '600' },
  body: { fontSize: 15, lineHeight: 22, color: colors.textSecondary },
  note: { fontSize: 14, lineHeight: 20, color: colors.textSecondary, marginTop: 8 },
  nightText: { color: '#FFFFFF' },
  nightMuted: { color: 'rgba(255,255,255,0.72)' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 16 },
  primary: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.control,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryPressed: { backgroundColor: colors.accentPressed, transform: [{ scale: 0.98 }] },
  primaryText: { color: colors.onAccent, fontSize: 15, fontWeight: '600' },
  secondary: {
    minHeight: 44,
    borderRadius: radius.control,
    backgroundColor: colors.raised,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  secondaryPressed: { backgroundColor: colors.hairlineStrong },
  secondaryText: { color: colors.text, fontSize: 15, fontWeight: '500' },
  link: { fontSize: 14, color: colors.accent, fontWeight: '500', marginTop: 12 },
  strip: { flexDirection: 'row', gap: 4, marginTop: 16 },
  stripDay: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: radius.control,
  },
  stripDaySelected: { backgroundColor: colors.accentSoft },
  stripDaySelectedNight: { backgroundColor: 'rgba(255,255,255,0.10)' },
  stripNumber: {
    fontSize: 13,
    color: colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  stripNumberToday: { color: colors.accent, fontWeight: '600' },
  dots: { gap: 4, alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, borderWidth: 1.5 },
  checks: { gap: 8, marginTop: 12 },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  checkLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  checkLabel: { fontSize: 15, color: colors.text },
  segment: {
    flexDirection: 'row',
    padding: 2,
    borderRadius: radius.control,
    backgroundColor: colors.raised,
  },
  segmentNight: { backgroundColor: 'rgba(255,255,255,0.10)' },
  segmentItem: {
    minHeight: 36,
    minWidth: 64,
    paddingHorizontal: 12,
    borderRadius: radius.control - 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentClean: { backgroundColor: colors.accent },
  segmentText: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  segmentTextOn: { color: colors.onAccent },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairline,
  },
  footerTextWrap: { flexShrink: 1, gap: 2 },
  footerLabel: { fontSize: 15, color: colors.text, fontWeight: '500' },
  footerText: { fontSize: 13, color: colors.textMuted },
});
