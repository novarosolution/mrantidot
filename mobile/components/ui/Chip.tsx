import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, fonts, premium, spacing } from '@/constants/theme';

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  if (selected) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.chip, pressed && styles.pressed]}>
        <LinearGradient
          colors={['#33C76A', '#1E8E4E', '#14532D']}
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
    ...premium.shadowSoft,
  },
  default: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.white,
    borderRadius: 999,
    ...premium.shadowSoft,
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
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
});
