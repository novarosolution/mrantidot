import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons, IconGradients } from '@/constants/appIcons';
import { colors, fonts, premium, spacing, surfaces } from '@/constants/theme';
import { customerRoutes, appPush } from '@/lib/routes';

const ACTIONS = [
  { key: 'book', label: 'Book', icon: AppIcons.quick.book, route: customerRoutes.services, grad: IconGradients.forest },
  { key: 'bookings', label: 'Bookings', icon: AppIcons.quick.bookings, route: customerRoutes.bookings, grad: IconGradients.teal },
  { key: 'offers', label: 'Offers', icon: AppIcons.quick.offers, route: customerRoutes.offers, grad: IconGradients.gold },
  { key: 'help', label: 'Support', icon: AppIcons.quick.support, route: customerRoutes.help, grad: IconGradients.teal },
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
            onPress={() => appPush(a.route)}
          >
            <LinearGradient colors={['#8FD03C', '#27A747']} style={styles.goldEdge} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />
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
    backgroundColor: surfaces.glass,
    borderRadius: premium.radiusCard,
    paddingVertical: spacing.sm + 4,
    paddingTop: spacing.sm + 6,
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
    overflow: 'hidden',
    gap: 9,
    ...premium.shadowSoft,
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
