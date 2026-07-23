import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useBookingCopy } from '@/lib/schedule-copy';
import { fonts, spacing, surfaces } from '@/constants/theme';

type FilterKey = 'active' | 'completed' | 'cancelled';

const DEEP = '#0A6423';
const BORDER = '#E2F0D8';

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
    <View style={styles.wrap}>
      <LinearGradient
        colors={['#8FD03C', '#27A747', '#0A6423']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.topBar}
      />
      <View style={styles.row}>
        {TILES.map((tile, index) => {
          const on = selected === tile.key;
          return (
            <Pressable
              key={tile.key}
              onPress={() => onSelect(tile.key)}
              style={({ pressed }) => [
                styles.cell,
                index > 0 && styles.cellBorder,
                pressed && styles.pressed,
              ]}
            >
              <View style={[styles.valueBox, on && styles.valueBoxOn]}>
                <Text style={[styles.value, on && styles.valueOn]}>{values[tile.key]}</Text>
              </View>
              <Text style={[styles.label, on && styles.labelOn]}>{tile.label}</Text>
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
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: surfaces.glass,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: '#043813',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 6,
  },
  topBar: { height: 4, width: '100%' },
  row: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 2,
  },
  cellBorder: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: '#EEF5E6',
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.97 }] },
  valueBox: {
    minWidth: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    marginBottom: 5,
    backgroundColor: '#EEF8E6',
    borderWidth: 1,
    borderColor: '#D8EDC8',
  },
  valueBoxOn: {
    backgroundColor: DEEP,
    borderColor: DEEP,
  },
  value: {
    fontFamily: fonts.displayExtra,
    fontSize: 18,
    color: DEEP,
  },
  valueOn: { color: '#FFFFFF' },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 0.3,
    color: '#7A9A7E',
  },
  labelOn: { color: DEEP },
});
