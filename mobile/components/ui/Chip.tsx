import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, fonts, shadows, spacing } from '@/constants/theme';

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
      <Pressable onPress={onPress} style={styles.chipWrap}>
        <LinearGradient colors={[colors.secondarySoft, colors.white]} style={styles.chipSelected}>
          <Text style={styles.textSelected}>{label}</Text>
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress} style={[styles.chip, styles.default]}>
      <Text style={styles.textDefault}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chipWrap: { marginRight: spacing.sm },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    marginRight: spacing.sm,
  },
  chipSelected: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.secondaryDark,
    ...shadows.card,
  },
  default: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  textSelected: { fontSize: 12, fontFamily: fonts.bodySemi, color: colors.secondaryInk },
  textDefault: { fontSize: 12, fontFamily: fonts.bodySemi, color: colors.ink },
});
