import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CloudSun, Sun } from 'lucide-react-native';
import { BOOKING_SLOT_GROUPS, formatSlotLabel } from '@/lib/dates';
import { colors, fonts, spacing } from '@/constants/theme';

const GROUP_ICONS: Record<string, typeof Sun> = {
  Morning: Sun,
  Afternoon: CloudSun,
};

export function ScheduleSlotPicker({
  selectedSlot,
  onSelect,
}: {
  selectedSlot: string;
  onSelect: (slot: string) => void;
}) {
  return (
    <View style={styles.wrap}>
      {BOOKING_SLOT_GROUPS.map((group, gi) => {
        const Icon = GROUP_ICONS[group.title] ?? Sun;
        return (
          <View key={group.title} style={[styles.group, gi > 0 && styles.groupGap]}>
            <View style={styles.groupHead}>
              <View style={styles.groupIcon}>
                <Icon size={15} color={colors.forest} strokeWidth={2.2} />
              </View>
              <Text style={styles.groupTitle}>{group.title}</Text>
            </View>
            <View style={styles.row}>
              {group.slots.map((s) => {
                const on = selectedSlot === s;
                return (
                  <Pressable
                    key={s}
                    style={({ pressed }) => [styles.chip, on && styles.chipOn, pressed && styles.pressed]}
                    onPress={() => onSelect(s)}
                  >
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>{formatSlotLabel(s)}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 0 },
  group: {},
  groupGap: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  groupHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.sm,
  },
  groupIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.ink,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flex: 1,
    minWidth: '47%',
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: colors.bg,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  chipOn: {
    backgroundColor: colors.soft,
    borderColor: colors.forest,
  },
  pressed: { opacity: 0.88 },
  chipText: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.ink,
    textAlign: 'center',
  },
  chipTextOn: { color: colors.forest },
});
