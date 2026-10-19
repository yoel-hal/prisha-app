import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import type { VesetResult, VesetType } from '../../calculations/types';
import { useOnahDateFormat } from '../../hooks/useOnahDateFormat';
import { textStartStyle } from '../../utils/rtl';

/** Results of one veset (same type and source period), in onah order. */
export function groupVesetimByType(vesetim: VesetResult[]): { type: VesetType; results: VesetResult[] }[] {
  const order: VesetType[] = ['onahBeinonit', 'haflaga', 'yomHaChodesh'];
  return order
    .map((type) => ({ type, results: vesetim.filter((v) => v.type === type) }))
    .filter((group) => group.results.length > 0);
}

type Props = {
  /** All onot of one veset, already in order. */
  results: VesetResult[];
  /** Grey out onot before today. */
  today?: string;
  compact?: boolean;
};

/**
 * The onot of one veset in a single block: each row shows יום / ליל clearly, the
 * Hebrew date, the civil date and times, and why it is forbidden when there is more
 * than one onah (עיקר הדין, אור זרוע, כרתי ופלתי, חוות דעת).
 */
export function VesetOnotRows({ results, today, compact }: Props) {
  const { t } = useTranslation();
  const formatOnah = useOnahDateFormat();
  const showReasons = results.length > 1 || results.some((r) => !r.reasons.includes('main'));

  return (
    <View style={styles.rows}>
      {results.map((veset) => {
        const text = formatOnah(veset.dateHebrew, veset.onah);
        const muted = today !== undefined && veset.dateGregorian < today;
        const isNight = veset.onah === 'night';
        return (
          <View key={veset.id} style={[styles.row, muted && styles.muted]}>
            <View style={[styles.onahPill, isNight ? styles.nightPill : styles.dayPill]}>
              <Text style={[styles.onahPillText, isNight ? styles.nightText : styles.dayText]}>
                {text.onahWord}
              </Text>
            </View>
            <View style={styles.texts}>
              <View style={styles.titleLine}>
                <Text style={[styles.date, textStartStyle()]}>{text.date}</Text>
                {showReasons
                  ? veset.reasons.map((reason) => (
                      <View
                        key={reason}
                        style={[styles.reason, reason === 'main' && styles.reasonMain]}
                      >
                        <Text style={[styles.reasonText, reason === 'main' && styles.reasonMainText]}>
                          {t(`veset.reason.${reason}`)}
                        </Text>
                      </View>
                    ))
                  : null}
              </View>
              <Text style={[styles.civil, textStartStyle()]}>{text.civil}</Text>
              {!compact && text.hours ? (
                <Text style={[styles.hours, textStartStyle()]}>{text.hours}</Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  rows: { gap: 10 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  muted: { opacity: 0.5 },
  onahPill: {
    minWidth: 44,
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  nightPill: { backgroundColor: '#1e293b', borderColor: '#1e293b' },
  dayPill: { backgroundColor: '#fef9c3', borderColor: '#facc15' },
  onahPillText: { fontSize: 14, fontWeight: '700' },
  nightText: { color: '#fff' },
  dayText: { color: '#713f12' },
  texts: { flex: 1, gap: 2 },
  titleLine: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  date: { fontSize: 16, fontWeight: '600' },
  reason: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#f3f4f6',
  },
  reasonMain: { backgroundColor: '#e0e7ff' },
  reasonText: { fontSize: 12, color: '#4b5563', fontWeight: '600' },
  reasonMainText: { color: '#3730a3' },
  civil: { fontSize: 14, color: '#555' },
  hours: { fontSize: 13, color: '#777' },
});
