import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useBookingCopy } from '@/lib/schedule-copy';
import { colors, fonts, spacing, ui } from '@/constants/theme';

type FilterKey = 'active' | 'completed' | 'cancelled';

/** Premium segmented filter — full-width capsule with count badges. */
export function BookingsSummaryBar({
  active,
  completed,
  cancelled,
  selected,
  onSelect,
}: {
  active: number;
  completed: number;
  cancelled: number;
  selected: FilterKey;
  onSelect: (filter: FilterKey) => void;
}) {
  const copy = useBookingCopy();
  const TILES: { key: FilterKey; label: string }[] = [
    { key: 'active', label: copy.listFilterActive },
    { key: 'completed', label: copy.listFilterCompleted },
    { key: 'cancelled', label: copy.listFilterCancelled },
  ];
  const values: Record<FilterKey, number> = { active, completed, cancelled };

  return (
    <View style={styles.shell} accessibilityRole="tablist">
      {TILES.map((tile) => {
        const on = selected === tile.key;
        return (
          <Pressable
            key={tile.key}
            onPress={() => onSelect(tile.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`${tile.label}, ${values[tile.key]}`}
            style={({ pressed }) => [styles.seg, on && styles.segOn, pressed && styles.pressed]}
          >
            <Text style={[styles.label, on && styles.labelOn]} numberOfLines={1}>
              {tile.label}
            </Text>
            <View style={[styles.count, on && styles.countOn]}>
              <Text style={[styles.countText, on && styles.countTextOn]}>{values[tile.key]}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: 4,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    ...ui.shadow,
  },
  seg: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: 12,
    paddingHorizontal: 6,
  },
  segOn: { backgroundColor: ui.brand },
  pressed: { opacity: 0.88 },
  label: {
    fontFamily: fonts.bodySemi,
    fontSize: 12.5,
    color: ui.textSecondary,
  },
  labelOn: { color: colors.white },
  count: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ui.surfaceMuted,
  },
  countOn: { backgroundColor: 'rgba(255,255,255,0.22)' },
  countText: { fontFamily: fonts.bodyBold, fontSize: 11, color: ui.text },
  countTextOn: { color: colors.white },
});
