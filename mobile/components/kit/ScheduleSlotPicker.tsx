import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BOOKING_SLOT_GROUPS, formatSlotLabel } from '@/lib/dates';
import { colors, fonts, premium, spacing } from '@/constants/theme';

export function ScheduleSlotPicker({
  selectedSlot,
  onSelect,
}: {
  selectedSlot: string;
  onSelect: (slot: string) => void;
}) {
  return (
    <>
      {BOOKING_SLOT_GROUPS.map((group) => (
        <View key={group.title} style={styles.group}>
          <Text style={styles.groupTitle}>{group.title}</Text>
          <View style={styles.grid}>
            {group.slots.map((s) => {
              const on = selectedSlot === s;
              return (
                <Pressable key={s} style={[styles.slot, on && styles.slotOn]} onPress={() => onSelect(s)}>
                  <Text style={[styles.slotText, on && styles.slotTextOn]}>{formatSlotLabel(s)}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  group: { marginTop: spacing.md },
  groupTitle: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.muted, marginBottom: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  slot: {
    flexGrow: 1,
    minWidth: '46%',
    paddingVertical: 15,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...premium.shadowSoft,
  },
  slotOn: { backgroundColor: colors.secondarySoft, borderColor: colors.secondaryDark, borderWidth: 2 },
  slotText: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: colors.ink },
  slotTextOn: { color: colors.secondaryInk },
});
