import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppIcons, IconGradients } from '@/constants/appIcons';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { GlassPanel } from '@/components/kit/GlassScreenKit';
import { colors, fonts } from '@/constants/theme';
import { useAppContent } from '@/context/AppContentContext';
import { customerRoutes, appPush } from '@/lib/routes';
import { homeShadow } from '@/components/kit/homeUi';

const ACTION_META = [
  {
    key: 'book' as const,
    icon: AppIcons.quick.book,
    route: customerRoutes.services,
    grad: IconGradients.forest,
  },
  {
    key: 'bookings' as const,
    icon: AppIcons.quick.bookings,
    route: customerRoutes.bookings,
    grad: IconGradients.teal,
  },
  {
    key: 'offers' as const,
    icon: AppIcons.quick.offers,
    route: customerRoutes.offers,
    grad: IconGradients.gold,
  },
  {
    key: 'help' as const,
    icon: AppIcons.quick.support,
    route: customerRoutes.help,
    grad: ['#3A9688', '#2A756A', '#1D5C52'] as const,
  },
];

export function HomeQuickActions() {
  const { homeConfig } = useAppContent();
  const labels = homeConfig.quickLabels;

  return (
    <View style={styles.wrap}>
      {ACTION_META.map((a) => {
        const label = labels?.[a.key] ?? a.key;
        return (
          <Pressable
            key={a.key}
            style={({ pressed }) => [styles.press, pressed && styles.pressed]}
            onPress={() => appPush(a.route)}
          >
            <GlassPanel style={styles.tile} padded={false} tone="light" intensity={50}>
              <View style={styles.inner}>
                <PremiumIcon icon={a.icon} variant="premium" size={22} gradient={a.grad} boxSize={52} />
                <Text style={styles.label} numberOfLines={1}>
                  {label}
                </Text>
              </View>
            </GlassPanel>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  press: { flex: 1 },
  tile: {
    borderRadius: 22,
    ...homeShadow.tile,
  },
  inner: {
    alignItems: 'center',
    gap: 10,
    paddingTop: 14,
    paddingBottom: 12,
    paddingHorizontal: 4,
  },
  pressed: { transform: [{ scale: 0.95 }] },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 11.5,
    letterSpacing: -0.2,
    color: colors.ink,
  },
});
