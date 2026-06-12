import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppIcons } from '@/constants/appIcons';
import { colors, fonts, spacing } from '@/constants/theme';

const ACTIONS = [
  {
    key: 'book',
    label: 'Book',
    icon: AppIcons.quick.book,
    route: '/(customer)/services' as const,
    tint: colors.forest,
    bg: '#E8F5EC',
  },
  {
    key: 'bookings',
    label: 'Bookings',
    icon: AppIcons.quick.bookings,
    route: '/(customer)/bookings' as const,
    tint: colors.blue,
    bg: colors.blueBg,
  },
  {
    key: 'offers',
    label: 'Offers',
    icon: AppIcons.quick.offers,
    route: '/(customer)/offers' as const,
    tint: colors.amberInk,
    bg: colors.amberBg,
  },
  {
    key: 'help',
    label: 'Help',
    icon: AppIcons.quick.support,
    route: '/(customer)/help' as const,
    tint: colors.secondaryDark,
    bg: colors.secondarySoft,
  },
];

export function HomeQuickActions() {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {ACTIONS.map((a) => {
          const Icon = a.icon;
          return (
            <Pressable
              key={a.key}
              style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
              onPress={() => router.push(a.route)}
            >
              <View style={[styles.iconBox, { backgroundColor: a.bg }]}>
                <Icon size={20} color={a.tint} strokeWidth={2.2} />
              </View>
              <Text style={styles.label}>{a.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  row: { flexDirection: 'row', gap: 8 },
  tile: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.06)',
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  label: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: colors.ink,
    textAlign: 'center',
  },
});
