import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcons } from '@/constants/appIcons';
import { colors, fonts, premium, shadows, spacing } from '@/constants/theme';

const ACTIONS = [
  { key: 'book', label: 'Book', icon: AppIcons.quick.book, route: '/(customer)/services' as const, tint: colors.forest },
  { key: 'bookings', label: 'Bookings', icon: AppIcons.quick.bookings, route: '/(customer)/bookings' as const, tint: colors.secondaryDark },
  { key: 'offers', label: 'Offers', icon: AppIcons.quick.offers, route: '/(customer)/offers' as const, tint: colors.amberInk },
  { key: 'help', label: 'Support', icon: AppIcons.quick.support, route: '/(customer)/help' as const, tint: colors.blue },
];

export function ProfileQuickActions() {
  return (
    <View style={styles.row}>
      {ACTIONS.map((a) => {
        const Icon = a.icon;
        return (
          <Pressable
            key={a.key}
            style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
            onPress={() => router.push(a.route)}
          >
            <LinearGradient colors={['#FFFFFF', '#F7FAF6']} style={styles.iconBox} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Icon size={22} color={a.tint} strokeWidth={2} />
            </LinearGradient>
            <Text style={styles.label}>{a.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    gap: 10,
  },
  tile: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: premium.radiusCard,
    paddingVertical: spacing.sm + 2,
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.06)',
    ...shadows.card,
  },
  pressed: { opacity: 0.92, transform: [{ scale: 0.98 }] },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  label: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.ink },
});
