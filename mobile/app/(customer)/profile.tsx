import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TAB_BAR_SCROLL_PAD, customerScrollProps } from '@/components/kit/GlassScreenKit';
import { CustomerProfileHero } from '@/components/kit/CustomerProfileHero';
import { HomeNextVisitCard } from '@/components/kit/HomeNextVisitCard';
import { HOME_HEADER_TOP } from '@/components/kit/HomeTopBar';
import { ProfileTrustBanner } from '@/components/kit/ProfileTrustBanner';
import { ProfileSupportCard } from '@/components/kit/ProfileSupportCard';
import { ProfileMenuSection } from '@/components/kit/ProfileMenuSection';
import { ProfileMenuRow } from '@/components/kit/ProfileMenuRow';
import { AppIcons } from '@/constants/appIcons';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { bookingDetailPath, authRoutes, customerRoutes, appPush, appReplace } from '@/lib/routes';
import { api, screenLoadConfig } from '@/lib/api';
import { useScreenLoad } from '@/lib/useScreenLoad';
import Constants from 'expo-constants';
import { BadgeCheck, CalendarCheck, LogOut, MapPinHouse } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { useAppContent } from '@/context/AppContentContext';
import { useLocation } from '@/context/LocationContext';
import { displayUserEmail, displayUserName } from '@/lib/profile-display';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { localDateKey } from '@/lib/dates';
import { bookingVisitDate } from '@/lib/booking-helpers';
import type { Booking } from '@/types/api';
import { colors, fonts, ui as themeUi } from '@/constants/theme';
import { useStaleFocusRefresh } from '@/lib/useStaleFocusRefresh';

function pickUpcoming(bookings: Booking[]): Booking | null {
  const today = localDateKey();
  const active = bookings.filter((b) => !['completed', 'cancelled'].includes(b.status));
  if (active.length === 0) return null;

  const rank = (b: Booking) => {
    if (b.status === 'in_progress') return 0;
    if (b.status === 'awaiting_verification') return 1;
    const d = bookingVisitDate(b) ?? b.schedule?.date ?? '';
    if (d && d < today) return 2;
    return 3;
  };

  return (
    [...active].sort((a, b) => {
      const ra = rank(a);
      const rb = rank(b);
      if (ra !== rb) return ra - rb;
      const da = bookingVisitDate(a) ?? a.schedule?.date ?? a.createdAt ?? '';
      const db = bookingVisitDate(b) ?? b.schedule?.date ?? b.createdAt ?? '';
      return da.localeCompare(db);
    })[0] ?? null
  );
}

export default function ProfileScreen() {
  const { user, logout, refreshMe } = useAuth();
  const { content } = useAppContent();
  const ui = useCustomerUiCopy();
  const { displayLabel } = useLocation();
  const { loading, error, runLoad, reload } = useScreenLoad();
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [paymentCount, setPaymentCount] = useState(0);
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    await refreshMe();
    const [bookingsRes, addrRes, payRes, notifRes] = await Promise.allSettled([
      api.get<{ bookings: Booking[] }>('/bookings', screenLoadConfig),
      api.get<{ addresses: unknown[] }>('/addresses', screenLoadConfig),
      api.get<{ paymentMethods: unknown[] }>('/payment-methods', screenLoadConfig),
      api.get<{ unreadCount: number }>('/notifications', screenLoadConfig),
    ]);
    if (bookingsRes.status === 'fulfilled') setBookings(bookingsRes.value.data.bookings);
    if (addrRes.status === 'fulfilled') setSavedCount(addrRes.value.data.addresses.length);
    if (payRes.status === 'fulfilled') setPaymentCount(payRes.value.data.paymentMethods.length);
    if (notifRes.status === 'fulfilled') setUnread(notifRes.value.data.unreadCount);
  }, [refreshMe]);

  useEffect(() => {
    void runLoad(load, 'Could not load profile');
  }, [load, runLoad]);

  useStaleFocusRefresh(() => load().catch(() => undefined), 3_000);

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

  async function onRefresh() {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  function confirmSignOut() {
    Alert.alert('Sign out?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: ui.profileSignOut,
        style: 'destructive',
        onPress: async () => {
          await logout();
          appReplace(authRoutes.login);
        },
      },
    ]);
  }

  const displayName = displayUserName(user);
  const displayEmail = displayUserEmail(user?.email);
  const rawPhone = user?.phone?.trim();
  // 10-digit Indian mobile → "98765 43210"; anything else is shown as entered.
  const displayPhone = rawPhone
    ? /^\d{10}$/.test(rawPhone)
      ? `${rawPhone.slice(0, 5)} ${rawPhone.slice(5)}`
      : rawPhone
    : undefined;
  const initial = (displayName || 'U').trim().charAt(0).toUpperCase();
  const city = displayLabel ?? user?.city;

  /** CMS stat labels default to SHOUTY one-word caps — use clearer words unless customised. */
  const statLabel = (cms: string, defaultCaps: string, nicer: string) =>
    !cms?.trim() || cms.trim() === defaultCaps ? nicer : cms.trim();

  const stats = [
    {
      value: String(activeCount),
      label: statLabel(ui.profileStatActive, 'ACTIVE', 'Active'),
      icon: CalendarCheck,
      onPress: () => appPush(customerRoutes.bookings),
    },
    {
      value: String(completedCount),
      label: statLabel(ui.profileStatDone, 'DONE', 'Completed'),
      icon: BadgeCheck,
      onPress: () => appPush(customerRoutes.bookings),
    },
    {
      value: String(savedCount),
      label: statLabel(ui.profileStatSaved, 'SAVED', 'Addresses'),
      icon: MapPinHouse,
      onPress: () => appPush(customerRoutes.addresses),
    },
  ];

  const primaryRows = [
    {
      icon: AppIcons.profile.addresses,
      label: ui.profileMenuAddresses,
      badge: savedCount > 0 ? savedCount : undefined,
      onPress: () => appPush(customerRoutes.addresses),
    },
    {
      icon: AppIcons.profile.payments,
      label: ui.profileMenuPayments,
      badge: paymentCount > 0 ? paymentCount : undefined,
      onPress: () => appPush(customerRoutes.paymentMethods),
    },
    {
      icon: AppIcons.profile.notifications,
      label: ui.profileMenuNotifications,
      badge: unread > 0 ? unread : undefined,
      onPress: () => appPush(customerRoutes.notifications),
    },
    {
      icon: AppIcons.profile.settings,
      label: ui.profileMenuSettings,
      onPress: () => appPush(customerRoutes.settings),
    },
  ];

  const moreRows = [
    {
      icon: AppIcons.profile.help,
      label: ui.profileMenuHelp,
      onPress: () => appPush(customerRoutes.help),
    },
    {
      icon: AppIcons.profile.faq,
      label: ui.profileMenuFaq,
      onPress: () => appPush(customerRoutes.faq),
    },
    {
      icon: AppIcons.profile.about,
      label: ui.profileMenuAbout,
      onPress: () => appPush(customerRoutes.about),
    },
    {
      icon: AppIcons.profile.terms,
      label: ui.profileMenuTerms,
      onPress: () => appPush(customerRoutes.terms),
    },
    {
      icon: AppIcons.profile.privacy,
      label: ui.profileMenuPrivacy,
      onPress: () => appPush(customerRoutes.privacy),
    },
  ];

  const supportPhone = content.support.phone?.trim();
  const supportWa = content.support.whatsapp?.trim() || supportPhone;
  const guarantee = content.trust.guaranteeText?.trim();
  const trustBadges = content.trust.badges;

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={themeUi.brand} />
          }
          {...customerScrollProps}
        >
          <CustomerProfileHero
            name={displayName}
            initial={initial}
            city={city}
            phone={displayPhone}
            email={displayEmail}
            unread={unread}
            stats={loading ? undefined : stats}
            onEdit={() => appPush(customerRoutes.settings)}
          />

          {error ? <ListEmptyRetry message={error} onRetry={() => void reload(load, error)} /> : null}
          {loading ? (
            <View style={styles.loading}>
              <Spinner />
            </View>
          ) : null}

          {upcoming ? (
            <View style={styles.block}>
              <Text style={styles.blockTitle}>{ui.profileNextVisitTitle}</Text>
              <HomeNextVisitCard
                booking={upcoming}
                onPress={() => appPush(bookingDetailPath(user?.role, upcoming.id))}
              />
            </View>
          ) : null}

          <View style={styles.block}>
            <ProfileMenuSection title="Account">
              {primaryRows.map((r, i) => (
                <ProfileMenuRow key={r.label} {...r} showBorder={i < primaryRows.length - 1} />
              ))}
            </ProfileMenuSection>

            {(supportPhone || supportWa) && (
              <ProfileSupportCard
                phone={supportPhone}
                whatsapp={supportWa}
                hours={content.support.hours?.trim()}
              />
            )}

            <ProfileMenuSection title="More">
              {moreRows.map((r, i) => (
                <ProfileMenuRow key={r.label} {...r} showBorder={i < moreRows.length - 1} />
              ))}
            </ProfileMenuSection>
          </View>

          {guarantee ? (
            <View style={styles.trust}>
              <ProfileTrustBanner guaranteeText={guarantee} badges={trustBadges} />
            </View>
          ) : null}

          <Pressable
            style={({ pressed }) => [styles.logout, pressed && styles.logoutPressed]}
            onPress={confirmSignOut}
            accessibilityRole="button"
          >
            <LogOut size={18} color={colors.error} strokeWidth={2.2} />
            <Text style={styles.logoutText}>{ui.profileSignOut}</Text>
          </Pressable>
          <Text style={styles.version}>
            {content.branding.name?.trim() || 'Mr Antidot'} · v{Constants.expoConfig?.version ?? '1.0.0'}
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  /** Status-bar strip matches the top of the header gradient. */
  root: { flex: 1, backgroundColor: HOME_HEADER_TOP, overflow: 'hidden' },
  safe: { flex: 1, backgroundColor: 'transparent' },
  scroll: { flex: 1 },
  content: { paddingBottom: TAB_BAR_SCROLL_PAD + 28, backgroundColor: themeUi.surfaceMuted, flexGrow: 1 },
  loading: { height: 48, alignItems: 'center', justifyContent: 'center' },
  /** White section on the grey canvas — same rhythm as home. */
  block: { backgroundColor: colors.white, paddingTop: 18, paddingBottom: 6, marginTop: 8 },
  blockTitle: {
    marginHorizontal: 16,
    marginBottom: 12,
    fontFamily: fonts.displayExtra,
    fontSize: 17,
    letterSpacing: -0.3,
    color: themeUi.text,
  },
  trust: { marginTop: 20 },
  logout: {
    marginTop: 20,
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: themeUi.border,
  },
  logoutPressed: { backgroundColor: colors.errorBg },
  logoutText: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.error,
  },
  version: {
    marginTop: 14,
    textAlign: 'center',
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: themeUi.textTertiary,
  },
});
