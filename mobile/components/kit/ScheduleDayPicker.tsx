import { ScrollView, StyleSheet, Text } from 'react-native';
import { PressableScale } from '@/components/ui/PressableScale';
import { bookingPickerDays, nextBookableDays } from '@/lib/dates';
import { useBusinessSettings } from '@/lib/businessSettings';
import { colors, radii, typeScale, ui } from '@/constants/theme';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { haptic } from '@/lib/motion';

/**
 * Day chips — "Today / Tmrw" then weekday, with the date number (Urban-style date row).
 * Without `count` it shows the admin's `booking.pickerDays` days that still have an open window;
 * pass `count` for a plain run of days (staff tools).
 */
export function ScheduleDayPicker({
  selectedDate,
  onSelect,
  count,
}: {
  selectedDate: string;
  onSelect: (date: string, index: number) => void;
  count?: number;
}) {
  const settings = useBusinessSettings();
  const copy = useCustomerUiCopy();
  const days = count ? nextBookableDays(count) : bookingPickerDays(settings);
  const todayKey = nextBookableDays(2);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row} nestedScrollEnabled>
      {days.map((d, i) => {
        const on = selectedDate === d.date;
        const isToday = d.date === todayKey[0]?.date;
        const isTomorrow = d.date === todayKey[1]?.date;
        const top = isToday ? copy.dayToday : isTomorrow ? copy.dayTomorrowShort : d.weekday;
        return (
          <PressableScale
            key={d.date}
            style={[styles.card, on && styles.cardOn]}
            onPress={() => {
              if (!on) haptic('select');
              onSelect(d.date, i);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`${isToday ? copy.dayToday : isTomorrow ? copy.dayTomorrow : d.weekday}, ${d.month} ${d.dayNum}`}
          >
            <Text style={[styles.week, on && styles.textOn]}>{top}</Text>
            <Text style={[styles.num, on && styles.textOn]}>{d.dayNum}</Text>
            <Text style={[styles.month, on && styles.textOn]}>{d.month}</Text>
          </PressableScale>
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
    borderRadius: radii.control,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.border,
  },
  cardOn: { backgroundColor: ui.brandSoft, borderColor: ui.brand, borderWidth: 1.5 },
  week: { ...typeScale.micro, fontSize: 11.5, color: ui.textSecondary },
  num: { ...typeScale.title, fontSize: 20, lineHeight: 25, marginTop: 2, color: ui.text },
  month: { ...typeScale.micro, fontFamily: typeScale.caption.fontFamily, color: ui.textTertiary },
  textOn: { color: ui.brand },
});
