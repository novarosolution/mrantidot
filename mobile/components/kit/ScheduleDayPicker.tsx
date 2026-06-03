import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { nextBookableDays } from '@/lib/dates';
import { colors, fonts, premium, spacing } from '@/constants/theme';

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
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {days.map((d, i) => {
        const on = selectedDate === d.date;
        const isToday = i === 0;
        return (
          <Pressable
            key={d.date}
            style={[styles.card, on && styles.cardOn]}
            onPress={() => onSelect(d.date, i)}
          >
            <Text style={[styles.week, on && styles.textOn]}>{d.weekday}</Text>
            <Text style={[styles.num, on && styles.textOn]}>{d.dayNum}</Text>
            <Text style={[styles.month, on && styles.monthOn]}>{d.month}</Text>
            {isToday ? (
              <View style={[styles.todayTag, on && styles.todayTagOn]}>
                <Text style={[styles.todayText, on && styles.todayTextOn]}>Today</Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 10, paddingBottom: spacing.sm },
  card: {
    width: 72,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginRight: 2,
    ...premium.shadowSoft,
  },
  cardOn: {
    backgroundColor: colors.forest,
    borderColor: colors.lime,
    borderWidth: 2,
    transform: [{ scale: 1.02 }],
  },
  week: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.muted, textTransform: 'uppercase' },
  num: { fontFamily: fonts.displayExtra, fontSize: 22, color: colors.ink, marginTop: 4 },
  month: { fontFamily: fonts.body, fontSize: 10, color: colors.muted, marginTop: 2 },
  monthOn: { color: colors.lime },
  textOn: { color: colors.white },
  todayTag: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: colors.soft,
  },
  todayTagOn: { backgroundColor: 'rgba(255,255,255,0.2)' },
  todayText: { fontFamily: fonts.bodySemi, fontSize: 9, color: colors.green },
  todayTextOn: { color: colors.lime },
});
