import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Calendar, CreditCard, Gift, HelpCircle, Info, LogOut, MapPin, Settings, Shield, Bell, FileText } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { PremiumStatPill } from '@/components/ui/PremiumStatPill';
import { CustomerPageHeader } from '@/components/kit/CustomerPageHeader';
import { ProfileMenuRow } from '@/components/kit/ProfileMenuRow';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { PremiumScreen } from '@/components/ui/PremiumScreen';
import { api, screenLoadConfig } from '@/lib/api';
import { useScreenLoad } from '@/lib/useScreenLoad';
import { useAuth } from '@/context/AuthContext';
import { colors, design, fonts, gradients, spacing } from '@/constants/theme';

const MENU = [
  { icon: Calendar, label: 'My Bookings', href: '/(customer)/bookings' as const },
  { icon: MapPin, label: 'Saved Addresses', href: '/(customer)/addresses' as const },
  { icon: CreditCard, label: 'Payment Methods', href: '/(customer)/payment-methods' as const },
  { icon: Gift, label: 'Offers & Referrals', href: '/(customer)/offers' as const },
  { icon: Bell, label: 'Notifications', href: '/(customer)/notifications' as const },
  { icon: Settings, label: 'Settings', href: '/(customer)/settings' as const },
];

const SUPPORT_MENU = [
  { icon: HelpCircle, label: 'Help & Support', href: '/(customer)/help' as const },
  { icon: Info, label: 'About', href: '/(customer)/about' as const },
  { icon: FileText, label: 'Terms of Service', href: '/(customer)/terms' as const },
  { icon: Shield, label: 'Privacy Policy', href: '/(customer)/privacy' as const },
];

export default function ProfileScreen() {
  const { user, logout, refreshMe } = useAuth();
  const { loading, error, runLoad, reload } = useScreenLoad();
  const [bookingCount, setBookingCount] = useState(0);
  const [savedCount, setSavedCount] = useState(0);

  const load = useCallback(async () => {
    await refreshMe();
    const [bookingsRes, addrRes] = await Promise.all([
      api.get<{ bookings: unknown[] }>('/bookings', screenLoadConfig),
      api.get<{ addresses: unknown[] }>('/addresses', screenLoadConfig),
    ]);
    setBookingCount(bookingsRes.data.bookings.length);
    setSavedCount(addrRes.data.addresses.length);
  }, [refreshMe]);

  useEffect(() => {
    void runLoad(load, 'Could not load profile stats');
  }, [load, runLoad]);

  const displayName = user?.name?.trim() || 'Your account';
  const contact = user?.phone?.trim() || user?.email || 'Add phone in settings';

  return (
    <PremiumScreen edges={['left', 'right']}>
      <ScrollView style={styles.root} contentContainerStyle={styles.content}>
        <CustomerPageHeader variant="premium" title="Profile" showBack={false}>
          <View style={styles.userRow}>
            <LinearGradient colors={[...gradients.avatarRing]} style={styles.avatarRing}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{displayName[0]?.toUpperCase() ?? 'U'}</Text>
              </View>
            </LinearGradient>
            <View>
              <Text style={styles.name}>{displayName}</Text>
              <Text style={styles.phone}>{contact}</Text>
            </View>
          </View>
        </CustomerPageHeader>

        {error ? (
          <ListEmptyRetry message={error} onRetry={() => void reload(load, error)} />
        ) : null}

        <View style={styles.stats}>
          {loading
            ? [0, 1, 2].map((i) => <View key={i} style={styles.statSkeleton} />)
            : [
                { v: String(bookingCount), l: 'Bookings' },
                { v: String(savedCount), l: 'Saved' },
                ...(user?.rating && user.rating > 0 ? [{ v: `★${user.rating}`, l: 'Rating' as const }] : []),
              ].map((s) => <PremiumStatPill key={s.l} value={s.v} label={s.l} />)}
        </View>

        <Card variant="premium" style={styles.menu}>
          {MENU.map((m, i) => (
            <ProfileMenuRow
              key={m.label}
              icon={m.icon}
              label={m.label}
              showBorder={i < MENU.length - 1}
              onPress={() => router.push(m.href)}
            />
          ))}
        </Card>

        <Text style={styles.groupLabel}>Help & legal</Text>
        <Card variant="premium" style={styles.menu}>
          {SUPPORT_MENU.map((m, i) => (
            <ProfileMenuRow
              key={m.label}
              icon={m.icon}
              label={m.label}
              showBorder={i < SUPPORT_MENU.length - 1}
              onPress={() => router.push(m.href)}
            />
          ))}
        </Card>

        <Card variant="premium" style={styles.logout} onPress={async () => { await logout(); router.replace('/(auth)/login'); }}>
          <LogOut size={19} color={colors.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </Card>
      </ScrollView>
    </PremiumScreen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingBottom: spacing.xl },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  avatarRing: {
    width: 58,
    height: 58,
    borderRadius: 18,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.displayExtra, fontSize: 20, color: colors.white },
  name: { fontFamily: fonts.displayExtra, fontSize: 18, color: colors.white },
  phone: { fontFamily: fonts.body, fontSize: 13, color: colors.lime, marginTop: 3 },
  stats: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  statSkeleton: { flex: 1, height: 64, borderRadius: 16, backgroundColor: colors.border },
  menu: { marginHorizontal: spacing.md, marginBottom: spacing.md, paddingVertical: spacing.xs },
  groupLabel: {
    ...design.sectionTitle,
    fontSize: 14,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  logout: {
    marginHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: spacing.md,
  },
  logoutText: { fontFamily: fonts.display, fontSize: 15, color: colors.error },
});
