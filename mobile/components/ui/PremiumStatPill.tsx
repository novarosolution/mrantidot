import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, gradients, premium, shadows, spacing } from '@/constants/theme';

export function PremiumStatPill({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.pill}>
      <LinearGradient colors={[...gradients.avatarRing]} style={styles.accent} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flex: 1,
    backgroundColor: premium.surfaceElevated,
    borderRadius: premium.radiusCard,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    overflow: 'hidden',
    ...shadows.floating,
  },
  accent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  value: { fontFamily: fonts.displayExtra, fontSize: 22, color: colors.forest },
  label: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 4 },
});
