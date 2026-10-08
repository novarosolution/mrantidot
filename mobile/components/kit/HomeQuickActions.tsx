import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppIconImages } from '@/constants/appImageIcons';
import { colors, fonts, ui } from '@/constants/theme';
import { customerRoutes, appPush } from '@/lib/routes';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { useAppContent } from '@/context/AppContentContext';

/** Home shortcut row — generated mint-tile icons (Book / Bookings / Offers / Help). */
export function HomeQuickActions({ background }: { background?: string } = {}) {
  const copy = useCustomerUiCopy();
  const { homeConfig } = useAppContent();
  const ql = homeConfig.quickLabels;

  const actions = [
    {
      key: 'book',
      label: ql?.book?.trim() || copy.profileQuickBook,
      image: AppIconImages.quick.book,
      route: customerRoutes.services,
    },
    {
      key: 'bookings',
      label: ql?.bookings?.trim() || copy.profileQuickBookings,
      image: AppIconImages.quick.bookings,
      route: customerRoutes.bookings,
    },
    {
      key: 'offers',
      label: ql?.offers?.trim() || copy.profileQuickOffers,
      image: AppIconImages.quick.offers,
      route: customerRoutes.offers,
    },
    {
      key: 'help',
      label: ql?.help?.trim() || copy.profileQuickSupport,
      image: AppIconImages.quick.support,
      route: customerRoutes.help,
    },
  ] as const;

  return (
    <View style={[styles.row, background ? { backgroundColor: background } : null]}>
      {actions.map((a) => (
        <Pressable
          key={a.key}
          style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
          onPress={() => appPush(a.route)}
          accessibilityRole="button"
          accessibilityLabel={a.label}
        >
          <Image source={a.image} style={styles.icon} resizeMode="cover" />
          <Text style={styles.label} numberOfLines={1}>
            {a.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    paddingTop: 2,
    paddingBottom: 18,
    backgroundColor: colors.white,
  },
  tile: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 18,
    paddingTop: 10,
    paddingBottom: 9,
    paddingHorizontal: 4,
    gap: 6,
    ...ui.shadow,
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  icon: { width: 42, height: 42, borderRadius: 13 },
  label: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: ui.text,
  },
});
