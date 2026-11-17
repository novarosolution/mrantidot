import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { BOOKING_HOURS, BOOKING_MINUTES, formatTime12h, isTimeStarted } from '@/lib/dates';
import { colors, fonts, spacing, surfaces } from '@/constants/theme';

const hhmm = (h: number, m: number) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

export function BookTimePicker({
  hour,
  minute,
  onChange,
  date,
}: {
  hour: number;
  minute: number;
  onChange: (hour: number, minute: number) => void;
  /** When set, times that have already passed on this day are disabled. */
  date?: string;
}) {
  const timeValue = hhmm(hour, minute);
  const started = (h: number, m: number) => (date ? isTimeStarted(date, hhmm(h, m)) : false);
  // An hour is gone once its last half-hour has started.
  const hourGone = (h: number) => started(h, BOOKING_MINUTES[BOOKING_MINUTES.length - 1]);
  const anyGone = date ? BOOKING_HOURS.some(hourGone) : false;

  return (
    <View style={styles.wrap}>
      <View style={styles.selectedBar}>
        <View style={styles.selectedLeft}>
          <PremiumIcon icon={AppIcons.ui.clock} variant="plain" size={16} color={colors.forest} strokeWidth={2.2} />
          <Text style={styles.selectedLabel}>Selected</Text>
        </View>
        <Text style={styles.selectedValue}>{formatTime12h(timeValue)}</Text>
      </View>

      <Text style={styles.fieldLabel}>Hour</Text>
      <View style={styles.grid}>
        {BOOKING_HOURS.map((h) => {
          const on = h === hour;
          const gone = hourGone(h);
          return (
            <Pressable
              key={h}
              disabled={gone}
              accessibilityState={{ selected: on, disabled: gone }}
              style={({ pressed }) => [
                styles.chip,
                styles.hourChip,
                on && styles.chipOn,
                gone && styles.chipPast,
                pressed && styles.pressed,
              ]}
              // Jump to the first open half-hour when the current minute is already gone in the new hour.
              onPress={() => onChange(h, started(h, minute) ? BOOKING_MINUTES.find((m) => !started(h, m)) ?? minute : minute)}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn, gone && styles.chipTextPast]}>
                {formatTime12h(`${h}:00`).replace(':00', '')}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.fieldLabel, styles.fieldLabelGap]}>Minutes</Text>
      <View style={styles.minuteRow}>
        {BOOKING_MINUTES.map((m) => {
          const on = m === minute;
          const gone = started(hour, m);
          return (
            <Pressable
              key={m}
              disabled={gone}
              accessibilityState={{ selected: on, disabled: gone }}
              style={({ pressed }) => [
                styles.chip,
                styles.minuteChip,
                on && styles.chipOn,
                gone && styles.chipPast,
                pressed && styles.pressed,
              ]}
              onPress={() => onChange(hour, m)}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn, gone && styles.chipTextPast]}>
                :{String(m).padStart(2, '0')}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.rangeHint}>
        {anyGone ? 'Times that have already passed today are greyed out' : 'Available 24/7 — any time'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 0 },
  selectedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: 'rgba(30,142,78,0.14)',
  },
  selectedLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  selectedLabel: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.muted },
  selectedValue: {
    fontFamily: fonts.displayExtra,
    fontSize: 18,
    color: colors.forest,
    letterSpacing: -0.2,
  },
  fieldLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: colors.muted,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  fieldLabelGap: { marginTop: spacing.sm },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  minuteRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: surfaces.glassInput,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: surfaces.glassBorderStrong,
  },
  hourChip: {
    width: '23%',
    minWidth: 62,
  },
  minuteChip: {
    flex: 1,
    maxWidth: '48%',
  },
  chipOn: {
    backgroundColor: colors.soft,
    borderColor: colors.forest,
  },
  pressed: { opacity: 0.88 },
  chipText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.ink },
  chipTextOn: { color: colors.forest },
  chipPast: { backgroundColor: '#F7F9F7', borderColor: '#F7F9F7' },
  chipTextPast: { color: '#B8BEBA', textDecorationLine: 'line-through' },
  rangeHint: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
