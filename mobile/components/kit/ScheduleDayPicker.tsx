import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { nextBookableDays } from '@/lib/dates';
import { colors, fonts, premium, spacing, surfaces } from '@/constants/theme';

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
        const isToday = i === 0;
        return (
          <Pressable
            key={d.date}
            style={({ pressed }) => [styles.card, on && styles.cardOn, pressed && styles.pressed]}
            onPress={() => onSelect(d.date, i)}
          >
            <Text style={[styles.week, on && styles.textOn]}>{d.weekday}</Text>
            <Text style={[styles.num, on && styles.textOn]}>{d.dayNum}</Text>
            <Text style={[styles.month, on && styles.monthOn]}>{d.month}</Text>
            {isToday ? (
              <View style={[styles.todayDot, on && styles.todayDotOn]} />
            ) : (
              <View style={styles.todaySpacer} />
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 8,
    paddingVertical: 2,
    paddingRight: 4,
  },
  card: {
    width: 62,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: surfaces.glass,
    borderWidth: 1.5,
    borderColor: surfaces.glassBorderStrong,
  },
  cardOn: {
    backgroundColor: colors.soft,
    borderColor: colors.forest,
    ...premium.shadowSoft,
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  week: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  num: {
    fontFamily: fonts.displayExtra,
    fontSize: 20,
    color: colors.ink,
    marginTop: 2,
  },
  month: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.muted,
    marginTop: 2,
  },
  monthOn: { color: colors.forest },
  textOn: { color: colors.forest },
  todayDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#8FD03C',
    marginTop: 6,
  },
  todayDotOn: { backgroundColor: colors.forest },
  todaySpacer: { height: 5, marginTop: 6 },
});
