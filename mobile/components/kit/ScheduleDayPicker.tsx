import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { nextBookableDays } from '@/lib/dates';
import { colors, fonts, ui } from '@/constants/theme';

/** Day chips — "Today / Tomorrow" then weekday, with the date number (Urban-style date row). */
export function ScheduleDayPicker({
  selectedDate,
  onSelect,
  count = 7,
}: {
  selectedDate: string;
  onSelect: (date: string, index: number) => void;
  count?: number;
}) {
  const days = nextBookableDays(count);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      nestedScrollEnabled
    >
      {days.map((d, i) => {
        const on = selectedDate === d.date;
        const top = i === 0 ? 'Today' : i === 1 ? 'Tmrw' : d.weekday;
        return (
          <Pressable
            key={d.date}
            style={({ pressed }) => [styles.card, on && styles.cardOn, pressed && styles.pressed]}
            onPress={() => onSelect(d.date, i)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`${i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.weekday}, ${d.month} ${d.dayNum}`}
          >
            <Text style={[styles.week, on && styles.textOn]}>{top}</Text>
            <Text style={[styles.num, on && styles.textOn]}>{d.dayNum}</Text>
            <Text style={[styles.month, on && styles.textOn]}>{d.month}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingRight: 4 },
  card: {
    width: 62,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.border,
  },
  cardOn: { backgroundColor: ui.brandSoft, borderColor: ui.brand, borderWidth: 1.5 },
  pressed: { opacity: 0.75 },
  week: { fontFamily: fonts.bodySemi, fontSize: 11.5, color: ui.textSecondary },
  num: { marginTop: 2, fontFamily: fonts.displayExtra, fontSize: 20, lineHeight: 25, color: ui.text },
  month: { fontFamily: fonts.bodyMedium, fontSize: 11, color: ui.textTertiary },
  textOn: { color: ui.brand },
});
