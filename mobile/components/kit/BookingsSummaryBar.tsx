import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useBookingCopy } from '@/lib/schedule-copy';
import { colors, fonts, premium, shadows, spacing } from '@/constants/theme';

type FilterKey = 'active' | 'completed' | 'cancelled';

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
  const TILES: { key: FilterKey; label: string; color: string; softBg: string }[] = [
    { key: 'active', label: copy.listFilterActive, color: colors.forest, softBg: '#E8F5EC' },
    { key: 'completed', label: copy.listFilterCompleted, color: colors.secondaryDark, softBg: colors.secondarySoft },
    { key: 'cancelled', label: copy.listFilterCancelled, color: colors.muted, softBg: colors.greyBg },
  ];
  const values: Record<FilterKey, number> = { active, completed, cancelled };

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={['#FFFFFF', '#F6FAF7']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <LinearGradient colors={['#D4A017', '#B6841C']} style={styles.goldBar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
      <View style={styles.row}>
        {TILES.map((tile, index) => {
          const isSelected = selected === tile.key;
          return (
            <Pressable
              key={tile.key}
              onPress={() => onSelect(tile.key)}
              style={({ pressed }) => [
                styles.cell,
                index < TILES.length - 1 && styles.cellBorder,
                pressed && styles.pressed,
              ]}
            >
              <View style={[styles.valueRing, { backgroundColor: isSelected ? tile.softBg : 'transparent' }]}>
                <Text style={[styles.value, { color: tile.color }]}>{values[tile.key]}</Text>
              </View>
              <Text style={[styles.label, isSelected && styles.labelSelected]}>{tile.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: premium.radiusCard,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.07)',
    ...shadows.card,
  },
  goldBar: { height: 3, width: '100%' },
  row: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  cellBorder: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: 'rgba(20,83,45,0.1)',
  },
  pressed: { opacity: 0.88 },
  valueRing: {
    minWidth: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  value: {
    fontFamily: fonts.displayExtra,
    fontSize: 20,
    letterSpacing: -0.3,
  },
  label: {
    fontFamily: fonts.body,
    fontSize: 9,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  labelSelected: {
    fontFamily: fonts.bodySemi,
    color: colors.forest,
  },
});
