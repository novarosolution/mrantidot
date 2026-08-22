import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons, IconGradients } from '@/constants/appIcons';
import { colors, fonts, premium, spacing, surfaces } from '@/constants/theme';
import { customerRoutes, appPush } from '@/lib/routes';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { useAppContent } from '@/context/AppContentContext';

export function ProfileQuickActions() {
  const ui = useCustomerUiCopy();
  const { homeConfig } = useAppContent();
  const ql = homeConfig.quickLabels;

  const actions = [
    {
      key: 'book',
      label: ql?.book?.trim() || ui.profileQuickBook,
      icon: AppIcons.quick.book,
      route: customerRoutes.services,
      grad: IconGradients.forest,
    },
    {
      key: 'bookings',
      label: ql?.bookings?.trim() || ui.profileQuickBookings,
      icon: AppIcons.quick.bookings,
      route: customerRoutes.bookings,
      grad: IconGradients.teal,
    },
    {
      key: 'offers',
      label: ql?.offers?.trim() || ui.profileQuickOffers,
      icon: AppIcons.quick.offers,
      route: customerRoutes.offers,
      grad: IconGradients.gold,
    },
    {
      key: 'help',
      label: ql?.help?.trim() || ui.profileQuickSupport,
      icon: AppIcons.quick.support,
      route: customerRoutes.help,
      grad: IconGradients.teal,
    },
  ];

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {actions.map((a) => (
          <Pressable
            key={a.key}
            style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
            onPress={() => appPush(a.route)}
          >
            <LinearGradient
              colors={[colors.limeBright, colors.green]}
              style={styles.goldEdge}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />
            <PremiumIcon icon={a.icon} variant="gradient" gradient={a.grad} size="xl" boxSize={50} />
            <Text style={styles.label} numberOfLines={1}>
              {a.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
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
