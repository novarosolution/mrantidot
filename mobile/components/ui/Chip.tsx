import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, fonts, spacing } from '@/constants/theme';

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
  if (compact) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.compactChip,
          selected ? styles.compactSelected : styles.compactDefault,
          pressed && styles.pressed,
        ]}
      >
        <Text style={[styles.compactText, selected && styles.compactTextSelected]}>{label}</Text>
      </Pressable>
    );
  }

  if (selected) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.chip, pressed && styles.pressed]}>
        <LinearGradient
          colors={['#2A9D5C', '#1E8E4E', '#14532D']}
          style={styles.selectedGrad}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.textSelected}>{label}</Text>
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.chip, styles.default, pressed && styles.pressed]}
    >
      <Text style={styles.textDefault}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    marginRight: spacing.sm,
    borderRadius: 999,
    overflow: 'hidden',
  },
  selectedGrad: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  default: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.white,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  textSelected: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.white,
  },
  textDefault: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.forest,
  },
  compactChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    minHeight: 36,
    justifyContent: 'center',
  },
  compactSelected: {
    backgroundColor: colors.forest,
  },
  compactDefault: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.1)',
  },
  compactText: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.forest,
  },
  compactTextSelected: {
    color: colors.white,
  },
});
