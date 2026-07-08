import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Clock } from 'lucide-react-native';
import { BOOKING_HOURS, BOOKING_MINUTES, formatTime12h } from '@/lib/dates';
import { colors, fonts, spacing } from '@/constants/theme';

export function BookTimePicker({
  hour,
  minute,
  onChange,
}: {
  hour: number;
  minute: number;
  onChange: (hour: number, minute: number) => void;
}) {
  const timeValue = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

  return (
    <View style={styles.wrap}>
      <View style={styles.selectedBar}>
        <View style={styles.selectedLeft}>
          <Clock size={16} color={colors.forest} strokeWidth={2.2} />
          <Text style={styles.selectedLabel}>Selected</Text>
        </View>
        <Text style={styles.selectedValue}>{formatTime12h(timeValue)}</Text>
      </View>

      <Text style={styles.fieldLabel}>Hour</Text>
      <View style={styles.grid}>
        {BOOKING_HOURS.map((h) => {
          const on = h === hour;
          return (
            <Pressable
              key={h}
              style={({ pressed }) => [
                styles.chip,
                styles.hourChip,
                on && styles.chipOn,
                pressed && styles.pressed,
              ]}
              onPress={() => onChange(h, minute)}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]}>
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
          return (
            <Pressable
              key={m}
              style={({ pressed }) => [
                styles.chip,
                styles.minuteChip,
                on && styles.chipOn,
                pressed && styles.pressed,
              ]}
              onPress={() => onChange(hour, m)}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]}>
                :{String(m).padStart(2, '0')}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.rangeHint}>Available 8:00 AM – 8:00 PM</Text>
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
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
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
  rangeHint: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
