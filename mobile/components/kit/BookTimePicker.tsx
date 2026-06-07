import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Clock size={22} color={colors.forest} strokeWidth={2.2} />
        </View>
        <View style={styles.heroText}>
          <Text style={styles.heroLabel}>Selected time</Text>
          <Text style={styles.heroValue}>{formatTime12h(timeValue)}</Text>
        </View>
      </View>

      <Text style={styles.fieldLabel}>Hour</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {BOOKING_HOURS.map((h) => {
          const on = h === hour;
          return (
            <Pressable
              key={h}
              style={({ pressed }) => [styles.chip, on && styles.chipOn, pressed && styles.pressed]}
              onPress={() => onChange(h, minute)}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{formatTime12h(`${h}:00`).replace(':00', '')}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={[styles.fieldLabel, styles.fieldLabelGap]}>Minutes</Text>
      <View style={styles.row}>
        {BOOKING_MINUTES.map((m) => {
          const on = m === minute;
          return (
            <Pressable
              key={m}
              style={({ pressed }) => [styles.chip, styles.chipWide, on && styles.chipOn, pressed && styles.pressed]}
              onPress={() => onChange(hour, m)}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]}>:{String(m).padStart(2, '0')}</Text>
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
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: spacing.md,
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: { flex: 1 },
  heroLabel: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  heroValue: {
    fontFamily: fonts.displayExtra,
    fontSize: 26,
    color: colors.forest,
    marginTop: 2,
    letterSpacing: -0.3,
  },
  fieldLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  fieldLabelGap: { marginTop: spacing.md },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: {
    minWidth: 52,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.bg,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  chipWide: { minWidth: 72 },
  chipOn: {
    backgroundColor: colors.soft,
    borderColor: colors.forest,
  },
  pressed: { opacity: 0.88 },
  chipText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ink },
  chipTextOn: { color: colors.forest },
  rangeHint: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
