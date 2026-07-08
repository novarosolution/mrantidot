import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons, IconGradients } from '@/constants/appIcons';
import { colors, fonts, premium, shadows, spacing } from '@/constants/theme';

const ACTIONS = [
  { key: 'book', label: 'Book', icon: AppIcons.quick.book, route: '/(customer)/services' as const, grad: IconGradients.forest },
  { key: 'bookings', label: 'Bookings', icon: AppIcons.quick.bookings, route: '/(customer)/bookings' as const, grad: IconGradients.teal },
  { key: 'offers', label: 'Offers', icon: AppIcons.quick.offers, route: '/(customer)/offers' as const, grad: IconGradients.gold },
  { key: 'help', label: 'Support', icon: AppIcons.quick.support, route: '/(customer)/help' as const, grad: IconGradients.blue },
];

export function ProfileQuickActions() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionLabel}>Quick actions</Text>
      <View style={styles.row}>
        {ACTIONS.map((a) => (
          <Pressable
            key={a.key}
            style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
            onPress={() => router.push(a.route)}
          >
            <LinearGradient colors={['#D4A017', '#B6841C']} style={styles.goldEdge} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />
            <PremiumIcon icon={a.icon} variant="gradient" gradient={a.grad} size="xl" boxSize={50} />
            <Text style={styles.label}>{a.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  sectionLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: colors.muted,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    marginLeft: spacing.md + 2,
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: 10,
  },
  tile: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: premium.radiusCard,
    paddingVertical: spacing.sm + 4,
    paddingTop: spacing.sm + 6,
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.06)',
    overflow: 'hidden',
    gap: 9,
    ...shadows.card,
  },
  pressed: { opacity: 0.92, transform: [{ scale: 0.98 }] },
  goldEdge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  label: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.ink, letterSpacing: 0.1 },
});
