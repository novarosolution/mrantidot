import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BOOKING_SLOT_GROUPS, formatSlotShort12h, isSlotStarted } from '@/lib/dates';
import { colors, fonts, ui } from '@/constants/theme';

/** Daytime first — night slots are the least common choice. */
const DISPLAY_ORDER = ['Morning', 'Afternoon', 'Evening', 'Night'];
const GROUPS = [...BOOKING_SLOT_GROUPS].sort(
  (a, b) => DISPLAY_ORDER.indexOf(a.title) - DISPLAY_ORDER.indexOf(b.title),
);

/**
 * Time-slot grid — Urban-style outlined chips in 12-hour time, grouped by part of day.
 * Pass `date` to grey out slots that have already started today.
 */
export function ScheduleSlotPicker({
  selectedSlot,
  onSelect,
  date,
}: {
  selectedSlot: string;
  onSelect: (slot: string) => void;
  /** YYYY-MM-DD of the visit — enables past-slot blocking. */
  date?: string;
}) {
  const groups = date ? GROUPS.filter((g) => g.slots.some((s) => !isSlotStarted(date, s))) : GROUPS;
  return (
    <View style={styles.wrap}>
      {groups.length < GROUPS.length ? (
        <Text style={styles.passedNote}>Earlier slots today have passed — showing what’s still open.</Text>
      ) : null}
      {groups.map((group) => (
        <View key={group.title}>
          <Text style={styles.groupTitle}>{group.title}</Text>
          <View style={styles.row}>
            {group.slots.map((s) => {
              const past = date ? isSlotStarted(date, s) : false;
              const on = selectedSlot === s && !past;
              return (
                <Pressable
                  key={s}
                  disabled={past}
                  style={({ pressed }) => [
                    styles.chip,
                    on && styles.chipOn,
                    past && styles.chipPast,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => onSelect(s)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on, disabled: past }}
                  accessibilityLabel={`${group.title}, ${formatSlotShort12h(s)}${past ? ', unavailable' : ''}`}
                >
                  <Text
                    style={[styles.chipText, on && styles.chipTextOn, past && styles.chipTextPast]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.85}
                  >
                    {formatSlotShort12h(s)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

/** First slot on `date` that hasn't started yet (display order), or null if the day is over. */
export function firstOpenSlot(date: string): string | null {
  for (const g of GROUPS) {
    for (const s of g.slots) if (!isSlotStarted(date, s)) return s;
  }
  return null;
}

const styles = StyleSheet.create({
  wrap: { gap: 18 },
  passedNote: { fontFamily: fonts.body, fontSize: 12.5, color: ui.textSecondary, marginBottom: -6 },
  groupTitle: {
    marginBottom: 10,
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: ui.textSecondary,
  },
  row: { flexDirection: 'row', gap: 8 },
  chip: {
    flex: 1,
    height: 46,
    paddingHorizontal: 6,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.border,
  },
  chipOn: { backgroundColor: ui.brandSoft, borderColor: ui.brand, borderWidth: 1.5 },
  chipPast: { backgroundColor: ui.surfaceMuted, borderColor: ui.surfaceMuted },
  pressed: { opacity: 0.75 },
  chipText: { fontFamily: fonts.bodySemi, fontSize: 13, color: ui.text },
  chipTextOn: { fontFamily: fonts.bodyBold, color: ui.brand },
  chipTextPast: { color: ui.textTertiary, textDecorationLine: 'line-through' },
});
