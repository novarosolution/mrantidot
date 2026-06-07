import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, premium, shadows, spacing } from '@/constants/theme';

export function ProfileStatTile({
  value,
  label,
  onPress,
  accent = colors.forest,
}: {
  value: string;
  label: string;
  onPress?: () => void;
  accent?: string;
}) {
  const inner = (
    <>
      <LinearGradient
        colors={[`${accent}18`, '#FFFFFF']}
        style={styles.bg}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <View style={[styles.accentDot, { backgroundColor: accent }]} />
      <Text style={[styles.value, { color: accent }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </>
  );

  if (onPress) {
    return (
      <Pressable style={({ pressed }) => [styles.tile, pressed && styles.pressed]} onPress={onPress}>
        {inner}
      </Pressable>
    );
  }

  return <View style={styles.tile}>{inner}</View>;
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    borderRadius: premium.radiusCard,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.06)',
    ...shadows.card,
  },
  pressed: { opacity: 0.92, transform: [{ scale: 0.98 }] },
  bg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  accentDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  value: {
    fontFamily: fonts.displayExtra,
    fontSize: 22,
    letterSpacing: -0.3,
  },
  label: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.muted,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
