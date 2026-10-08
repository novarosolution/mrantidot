import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, fonts, spacing, ui } from '@/constants/theme';

export function Chip({
  label,
  selected,
  onPress,
  compact,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  /** Flat home-filter style — consistent pills, no heavy shadow. */
  compact?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        compact ? styles.compactChip : styles.chip,
        selected ? styles.selected : styles.default,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.text, selected && styles.textSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    marginRight: spacing.sm,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  compactChip: {
    marginRight: spacing.sm,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    minHeight: 36,
    justifyContent: 'center',
  },
  selected: { backgroundColor: ui.brand, borderWidth: 1, borderColor: ui.brand },
  default: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  text: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: ui.brand,
  },
  textSelected: { color: colors.white },
});
