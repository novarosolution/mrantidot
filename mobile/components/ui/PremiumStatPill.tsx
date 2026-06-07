import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, premium, shadows, spacing } from '@/constants/theme';

export function PremiumStatPill({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.pill}>
      <LinearGradient
        colors={['#E8F5EC', '#FFFFFF']}
        style={styles.bg}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
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
  bg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  value: {
    fontFamily: fonts.displayExtra,
    fontSize: 24,
    color: colors.forest,
    letterSpacing: -0.4,
  },
  label: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.muted,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
