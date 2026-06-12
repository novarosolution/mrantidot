import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { CreditCard, FileText, Info, LogOut, Settings } from 'lucide-react-native';
import { AppIcons } from '@/constants/appIcons';
import { ProfileHeroCard } from '@/components/kit/ProfileHeroCard';
import { ProfileHighlights } from '@/components/kit/ProfileHighlights';
import { ProfileMenuRow } from '@/components/kit/ProfileMenuRow';
import { ProfileMenuSection } from '@/components/kit/ProfileMenuSection';
import { ProfileQuickActions } from '@/components/kit/ProfileQuickActions';
import { ProfileSupportCard } from '@/components/kit/ProfileSupportCard';
import { ProfileUpcomingCard } from '@/components/kit/ProfileUpcomingCard';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { PremiumScreen } from '@/components/ui/PremiumScreen';
import { Spinner } from '@/components/ui/Spinner';
import { bookingDetailPath } from '@/lib/routes';
import { api, screenLoadConfig } from '@/lib/api';
import { useScreenLoad } from '@/lib/useScreenLoad';
import { useAuth } from '@/context/AuthContext';
import { useAppContent } from '@/context/AppContentContext';
import { useLocation } from '@/context/LocationContext';
import { displayUserEmail, displayUserName } from '@/lib/profile-display';
import type { Booking } from '@/types/api';
import { colors, fonts, premium, spacing } from '@/constants/theme';

const ACCOUNT_MENU = [
  {
    icon: AppIcons.profile.bookings,
    label: 'My Bookings',
    href: '/(customer)/bookings' as const,
    tint: colors.forest,
    iconBg: '#E8F5EC',
  },
  {
    icon: AppIcons.profile.addresses,
    label: 'Saved Addresses',
    href: '/(customer)/addresses' as const,
    tint: colors.secondaryDark,
    iconBg: colors.secondarySoft,
  },
  {
    icon: CreditCard,
    label: 'Payment Methods',
    href: '/(customer)/payment-methods' as const,
    tint: colors.blue,
    iconBg: colors.blueBg,
  },
  {
    icon: AppIcons.profile.offers,
    label: 'Offers & Referrals',
    href: '/(customer)/offers' as const,
    tint: colors.amberInk,
    iconBg: colors.amberBg,
  },
  {
    icon: AppIcons.profile.notifications,
    label: 'Notifications',
    href: '/(customer)/notifications' as const,
    tint: colors.forest,
    iconBg: '#E8F5EC',
    badgeKey: 'unread' as const,
  },
  {
    icon: Settings,
    label: 'Settings',
    href: '/(customer)/settings' as const,
    tint: colors.ink,
    iconBg: colors.greyBg,
  },
];

const SUPPORT_MENU = [
  { icon: AppIcons.profile.help, label: 'Help & Support', href: '/(customer)/help' as const, tint: colors.secondaryDark, iconBg: colors.secondarySoft },
  { icon: AppIcons.profile.faq, label: 'FAQs', href: '/(customer)/faq' as const, tint: colors.forest, iconBg: '#E8F5EC' },
  { icon: Info, label: 'About', href: '/(customer)/about' as const, tint: colors.forest, iconBg: '#E8F5EC' },
  { icon: FileText, label: 'Terms of Service', href: '/(customer)/terms' as const, tint: colors.muted, iconBg: colors.greyBg },
  { icon: AppIcons.profile.privacy, label: 'Privacy Policy', href: '/(customer)/privacy' as const, tint: colors.muted, iconBg: colors.greyBg },
];

function formatMemberSince(iso?: string): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  return `Member since ${d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}`;
}

function pickUpcoming(bookings: Booking[]): Booking | null {
  const active = bookings.filter((b) => !['completed', 'cancelled'].includes(b.status));
  if (active.length === 0) return null;
  return [...active].sort((a, b) => {
    const da = a.schedule?.date ?? a.createdAt ?? '';
    const db = b.schedule?.date ?? b.createdAt ?? '';
    return da.localeCompare(db);
  })[0] ?? null;
}

export default function ProfileScreen() {
  const { user, logout, refreshMe } = useAuth();
  const { content } = useAppContent();
  const { displayLabel } = useLocation();
  const { loading, error, runLoad, reload } = useScreenLoad();
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [paymentCount, setPaymentCount] = useState(0);
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    await refreshMe();
    const [bookingsRes, addrRes, payRes, notifRes] = await Promise.all([
      api.get<{ bookings: Booking[] }>('/bookings', screenLoadConfig),
      api.get<{ addresses: unknown[] }>('/addresses', screenLoadConfig),
      api.get<{ paymentMethods: unknown[] }>('/payment-methods', screenLoadConfig),
      api.get<{ unreadCount: number }>('/notifications', screenLoadConfig),
    ]);
    setBookings(bookingsRes.data.bookings);
    setSavedCount(addrRes.data.addresses.length);
    setPaymentCount(payRes.data.paymentMethods.length);
    setUnread(notifRes.data.unreadCount);
  }, [refreshMe]);

  useEffect(() => {
    void runLoad(load, 'Could not load profile');
  }, [load, runLoad]);

  useFocusEffect(
    useCallback(() => {
      void refreshMe({ silent: true });
    }, [refreshMe]),
  );

  const upcoming = useMemo(() => pickUpcoming(bookings), [bookings]);
  const activeCount = useMemo(
    () => bookings.filter((b) => !['completed', 'cancelled'].includes(b.status)).length,
    [bookings],
  );
  const completedCount = useMemo(() => bookings.filter((b) => b.status === 'completed').length, [bookings]);

  const statItems = useMemo(
    () => [
      {
        value: String(activeCount),
        label: 'Active',
        accent: colors.forest,
        softBg: '#E8F5EC',
        onPress: () => router.push('/(customer)/bookings'),
      },
      {
        value: String(completedCount),
        label: 'Done',
        accent: colors.secondaryDark,
        softBg: colors.secondarySoft,
        onPress: () => router.push('/(customer)/bookings'),
      },
      {
        value: String(savedCount),
        label: 'Saved',
        accent: colors.blue,
        softBg: colors.blueBg,
        onPress: () => router.push('/(customer)/addresses'),
      },
      {
        value: String(paymentCount),
        label: 'Payments',
        accent: colors.amberInk,
        softBg: colors.amberBg,
        onPress: () => router.push('/(customer)/payment-methods'),
      },
    ],
    [activeCount, completedCount, savedCount, paymentCount],
  );

  async function onRefresh() {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  async function shareInvite() {
    const msg = `Book trusted pest control with ${content.branding.name}. ${content.branding.tagline}`;
    await Share.share({ message: msg, title: `Invite to ${content.branding.name}` });
  }

  const displayName = displayUserName(user);
  const displayEmail = displayUserEmail(user?.email);
  const displayPhone = user?.phone?.trim() || undefined;

  return (
    <PremiumScreen edges={['left', 'right']}>
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.green} />}
      >
        <ProfileHeroCard
          name={displayName}
          phone={displayPhone}
          email={displayEmail}
          city={displayLabel ?? user?.city}
          memberSince={formatMemberSince(user?.createdAt)}
          unread={unread}
        />

        {error ? <ListEmptyRetry message={error} onRetry={() => void reload(load, error)} /> : null}

        {loading ? (
          <View style={styles.statsLoading}>
            <Spinner />
          </View>
        ) : (
          <ProfileHighlights
            stats={statItems}
            brandName={content.branding.name}
            onShare={() => void shareInvite()}
          />
        )}

        <ProfileQuickActions />

        {upcoming ? (
          <ProfileUpcomingCard
            booking={upcoming}
            onPress={() => router.push(bookingDetailPath(user?.role, upcoming.id) as never)}
          />
        ) : null}

        <ProfileMenuSection title="Account">
          {ACCOUNT_MENU.map((m, i) => (
            <ProfileMenuRow
              key={m.label}
              icon={m.icon}
              label={m.label}
              tint={m.tint}
              iconBg={m.iconBg}
              badge={'badgeKey' in m && m.badgeKey === 'unread' ? unread : undefined}
              showBorder={i < ACCOUNT_MENU.length - 1}
              onPress={() => router.push(m.href)}
            />
          ))}
        </ProfileMenuSection>

        <ProfileSupportCard
          phone={content.support.phone}
          whatsapp={content.support.whatsapp}
          hours={content.support.hours}
        />

        <ProfileMenuSection title="Help & legal">
          {SUPPORT_MENU.map((m, i) => (
            <ProfileMenuRow
              key={m.label}
              icon={m.icon}
              label={m.label}
              tint={m.tint}
              iconBg={m.iconBg}
              showBorder={i < SUPPORT_MENU.length - 1}
              onPress={() => router.push(m.href)}
            />
          ))}
        </ProfileMenuSection>

        <Pressable
          style={({ pressed }) => [styles.logout, pressed && styles.logoutPressed]}
          onPress={async () => {
            await logout();
            router.replace('/(auth)/login');
          }}
        >
          <LogOut size={18} color={colors.error} strokeWidth={2} />
          <Text style={styles.logoutText}>Sign out</Text>
        </Pressable>

        <Text style={styles.footer}>{content.branding.name}</Text>
      </ScrollView>
    </PremiumScreen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingBottom: spacing.xxl },
  statsLoading: {
    marginHorizontal: spacing.md,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  logout: {
    marginHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: spacing.md,
    borderRadius: premium.radiusCard,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: 'rgba(192,73,46,0.25)',
  },
  logoutPressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
  logoutText: { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.error },
  footer: {
    textAlign: 'center',
    marginTop: spacing.lg,
    fontFamily: fonts.display,
    fontSize: 13,
    color: colors.forest,
  },
});
