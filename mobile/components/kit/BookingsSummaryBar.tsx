import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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
  selected?: FilterKey;
  onSelect?: (filter: FilterKey) => void;
}) {
  const total = active + completed + cancelled;

  const tiles: { key: FilterKey | 'total'; value: number; label: string; color: string; selectable: boolean }[] = [
    { key: 'active', value: active, label: 'Active', color: colors.forest, selectable: true },
    { key: 'completed', value: completed, label: 'Done', color: colors.secondaryDark, selectable: true },
    { key: 'cancelled', value: cancelled, label: 'Cancelled', color: colors.muted, selectable: true },
    { key: 'total', value: total, label: 'Total', color: colors.ink, selectable: false },
  ];

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={['#14532D', '#1E8E4E']}
        style={styles.accent}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      />
      <View style={styles.row}>
        {tiles.map((tile) => {
          const isSelected = tile.selectable && selected === tile.key;
          const inner = (
            <>
              <Text style={[styles.value, { color: tile.color }]}>{tile.value}</Text>
              <Text style={[styles.label, isSelected && styles.labelSelected]}>{tile.label}</Text>
            </>
          );

          if (tile.selectable && onSelect) {
            return (
              <Pressable
                key={tile.key}
                onPress={() => onSelect(tile.key as FilterKey)}
                style={({ pressed }) => [
                  styles.tile,
                  tile.key === 'total' && styles.totalTile,
                  isSelected && styles.tileSelected,
                  pressed && styles.tilePressed,
                ]}
              >
                {inner}
              </Pressable>
            );
          }

          return (
            <View key={tile.key} style={[styles.tile, tile.key === 'total' && styles.totalTile]}>
              {inner}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: premium.radiusCard,
    overflow: 'hidden',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.06)',
    ...shadows.card,
  },
  accent: { height: 3 },
  row: {
    flexDirection: 'row',
    gap: 8,
    padding: spacing.sm,
  },
  tile: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: premium.radiusCard - 6,
    backgroundColor: colors.white,
  },
  totalTile: {
    backgroundColor: colors.soft,
  },
  tileSelected: {
    backgroundColor: 'rgba(30,142,78,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(30,142,78,0.2)',
  },
  tilePressed: { opacity: 0.85 },
  value: {
    fontFamily: fonts.displayExtra,
    fontSize: 20,
    letterSpacing: -0.3,
  },
  label: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.muted,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  labelSelected: {
    fontFamily: fonts.bodySemi,
    color: colors.forest,
  },
});
