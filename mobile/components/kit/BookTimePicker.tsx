import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Clock } from 'lucide-react-native';
import { BOOKING_HOURS, BOOKING_MINUTES, formatTime12h } from '@/lib/dates';
import { colors, fonts, premium, spacing } from '@/constants/theme';

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
          <Clock size={20} color={colors.secondaryDark} />
        </View>
        <View>
          <Text style={styles.heroLabel}>Preferred time</Text>
          <Text style={styles.heroValue}>{formatTime12h(timeValue)}</Text>
        </View>
      </View>
      <View style={styles.columns}>
        <View style={styles.col}>
          <Text style={styles.colLabel}>Hour</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            {BOOKING_HOURS.map((h) => {
              const on = h === hour;
              return (
                <Pressable
                  key={h}
                  style={[styles.chip, on && styles.chipOn]}
                  onPress={() => onChange(h, minute)}
                >
                  <Text style={[styles.chipText, on && styles.chipTextOn]}>{h}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
        <View style={styles.col}>
          <Text style={styles.colLabel}>Minute</Text>
          <View style={styles.row}>
            {BOOKING_MINUTES.map((m) => {
              const on = m === minute;
              return (
                <Pressable
                  key={m}
                  style={[styles.chip, styles.chipWide, on && styles.chipOn]}
                  onPress={() => onChange(hour, m)}
                >
                  <Text style={[styles.chipText, on && styles.chipTextOn]}>{String(m).padStart(2, '0')}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
      <Text style={styles.rangeHint}>Available between 8:00 AM and 8:00 PM</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: premium.radiusCard,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    ...premium.shadowSoft,
  },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.secondarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLabel: { fontFamily: fonts.body, fontSize: 11.5, color: colors.muted },
  heroValue: { fontFamily: fonts.displayExtra, fontSize: 22, color: colors.forest, marginTop: 2 },
  columns: { gap: spacing.md },
  col: { gap: spacing.sm },
  colLabel: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.muted },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: {
    minWidth: 44,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.soft,
    alignItems: 'center',
  },
  chipWide: { minWidth: 64 },
  chipOn: { backgroundColor: colors.secondarySoft, borderColor: colors.secondaryDark },
  chipText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ink },
  chipTextOn: { color: colors.secondaryInk },
  rangeHint: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
