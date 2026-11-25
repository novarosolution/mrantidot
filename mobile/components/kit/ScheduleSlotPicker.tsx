import { StyleSheet, Text, View } from 'react-native';
import { PressableScale } from '@/components/ui/PressableScale';
import { bookingSlotGroups, formatSlotShort12h, isSlotBookable, isSlotStarted } from '@/lib/dates';
import { getBusinessSettings, useBusinessSettings } from '@/lib/businessSettings';
import { slotGroupTitle } from '@/lib/settingsLabels';
import { colors, radii, typeScale, ui } from '@/constants/theme';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { haptic } from '@/lib/motion';

/**
 * Time-slot grid — outlined chips in 12-hour time, grouped by part of day, built from the admin's
 * active booking windows (Business settings). Pass `date` to grey out slots that can't be taken:
 * `rules="bookable"` (customer flows) also applies the lead time and horizon the server enforces;
 * the default `"started"` only blocks windows that have already begun (staff tools).
 */
export function ScheduleSlotPicker({
  selectedSlot,
  onSelect,
  date,
  rules = 'started',
}: {
  selectedSlot: string;
  onSelect: (slot: string) => void;
  /** YYYY-MM-DD of the visit — enables past-slot blocking. */
  date?: string;
  rules?: 'bookable' | 'started';
}) {
  const settings = useBusinessSettings();
  const copy = useCustomerUiCopy();
  const all = bookingSlotGroups(settings);
  const closed = (s: string) =>
    date ? (rules === 'bookable' ? !isSlotBookable(date, s, settings) : isSlotStarted(date, s)) : false;
  const groups = date ? all.filter((g) => g.slots.some((s) => !closed(s))) : all;

  if (groups.length === 0) {
    return <Text style={styles.passedNote}>{copy.slotNoneOpen}</Text>;
  }

  return (
    <View style={styles.wrap}>
      {groups.length < all.length ? <Text style={styles.passedNote}>{copy.slotPassedNote}</Text> : null}
      {groups.map((group) => {
        const title = slotGroupTitle(group.group, {
          webSlotNight: copy.webSlotNight,
          webSlotMorning: copy.webSlotMorning,
          webSlotAfternoon: copy.webSlotAfternoon,
          webSlotEvening: copy.webSlotEvening,
        });
        return (
          <View key={group.group}>
            <Text style={styles.groupTitle}>{title}</Text>
            <View style={styles.row}>
              {group.slots.map((s) => {
                const past = closed(s);
                const on = selectedSlot === s && !past;
                return (
                  <PressableScale
                    key={s}
                    disabled={past}
                    containerStyle={styles.chipWrap}
                    style={[styles.chip, on && styles.chipOn, past && styles.chipPast]}
                    onPress={() => {
                      if (!on) haptic('select');
                      onSelect(s);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on, disabled: past }}
                    accessibilityLabel={`${title}, ${formatSlotShort12h(s)}${past ? `, ${copy.slotUnavailableA11y}` : ''}`}
                  >
                    <Text
                      style={[styles.chipText, on && styles.chipTextOn, past && styles.chipTextPast]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.85}
                    >
                      {formatSlotShort12h(s)}
                    </Text>
                  </PressableScale>
                );
              })}
              {/* Keep chips the same width when a group has fewer than three windows. */}
              {Array.from({ length: Math.max(0, 3 - group.slots.length) }, (_, i) => (
                <View key={`pad-${i}`} style={styles.chipWrap} />
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
}

/**
 * First window on `date` that is still open (display order), or null if the day is over.
 * `rules="bookable"` applies the customer lead time / horizon too.
 */
export function firstOpenSlot(date: string, rules: 'bookable' | 'started' = 'started'): string | null {
  const settings = getBusinessSettings();
  for (const g of bookingSlotGroups(settings)) {
    for (const s of g.slots) {
      const open = rules === 'bookable' ? isSlotBookable(date, s, settings) : !isSlotStarted(date, s);
      if (open) return s;
    }
  }
  return null;
}

const styles = StyleSheet.create({
  wrap: { gap: 18 },
  passedNote: { ...typeScale.caption, fontSize: 12.5, color: ui.textSecondary, marginBottom: -6 },
  groupTitle: { ...typeScale.captionStrong, marginBottom: 10, color: ui.textSecondary },
  row: { flexDirection: 'row', gap: 8 },
  chipWrap: { flex: 1 },
  chip: {
    height: 48,
    paddingHorizontal: 6,
    borderRadius: radii.control,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.border,
  },
  chipOn: { backgroundColor: ui.brandSoft, borderColor: ui.brand, borderWidth: 1.5 },
  chipPast: { backgroundColor: ui.surfaceMuted, borderColor: ui.surfaceMuted },
  chipText: { ...typeScale.captionStrong, color: ui.text },
  chipTextOn: { fontFamily: typeScale.button.fontFamily, color: ui.brand },
  chipTextPast: { color: ui.textTertiary, textDecorationLine: 'line-through' },
});
