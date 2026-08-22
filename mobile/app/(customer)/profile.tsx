import { useFocusEffect } from 'expo-router';
import type { LucideIcon } from 'lucide-react-native';
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
import {
  GlassBackdrop,
  GlassPanel,
  TAB_BAR_SCROLL_PAD,
  customerScrollProps,
} from '@/components/kit/GlassScreenKit';
import { CustomerProfileHero } from '@/components/kit/CustomerProfileHero';
import { ProfileUpcomingCard } from '@/components/kit/ProfileUpcomingCard';
import { ProfileQuickActions } from '@/components/kit/ProfileQuickActions';
import { ProfileTrustBanner } from '@/components/kit/ProfileTrustBanner';
import { ProfileSupportCard } from '@/components/kit/ProfileSupportCard';
import { ProfileMenuSection } from '@/components/kit/ProfileMenuSection';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons, IconGradients } from '@/constants/appIcons';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { bookingDetailPath, authRoutes, customerRoutes, appPush, appReplace } from '@/lib/routes';
import { api, screenLoadConfig } from '@/lib/api';
import { useScreenLoad } from '@/lib/useScreenLoad';
import { useAuth } from '@/context/AuthContext';
import { useAppContent } from '@/context/AppContentContext';
import { useLocation } from '@/context/LocationContext';
import { displayUserEmail, displayUserName } from '@/lib/profile-display';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { localDateKey } from '@/lib/dates';
import { bookingVisitDate } from '@/lib/booking-helpers';
import type { Booking } from '@/types/api';
import { colors, fonts, surfaces } from '@/constants/theme';

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

function upcomingEyebrow(booking: Booking): string {
  const today = localDateKey();
  const visit = bookingVisitDate(booking) ?? booking.schedule?.date ?? '';
  if (booking.status === 'in_progress') return 'In progress';
  if (booking.status === 'awaiting_verification') return 'Needs review';
  if (visit && visit < today) return 'Overdue';
  if (visit === today) return 'Today';
  return 'Upcoming';
}

function MenuRow({
  icon: Icon,
  label,
  trailing,
  showBorder,
  onPress,
  tone = 'forest',
}: {
  icon: LucideIcon;
  label: string;
  trailing?: string;
  showBorder: boolean;
  onPress: () => void;
  tone?: 'forest' | 'teal' | 'gold' | 'mint';
}) {
  const grad =
    tone === 'teal'
      ? IconGradients.teal
      : tone === 'gold'
        ? IconGradients.gold
        : tone === 'mint'
          ? IconGradients.lime
          : IconGradients.forest;

  return (
    <Pressable
      style={({ pressed }) => [styles.menuRow, showBorder && styles.menuBorder, pressed && styles.pressed]}
      onPress={onPress}
    >
      <PremiumIcon icon={Icon} variant="premium" size={18} gradient={grad} boxSize={42} />
      <Text style={styles.menuLabel} numberOfLines={1}>
        {label}
      </Text>
      {trailing ? (
        <View style={styles.trailPill}>
          <Text style={styles.menuTrail}>{trailing}</Text>
        </View>
      ) : null}
      <PremiumIcon icon={AppIcons.ui.chevronRight} variant="chevron" size={14} color={colors.forest} />
    </Pressable>
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
  const displayPhone = user?.phone?.trim() || undefined;
  const initial = (displayName || 'U').trim().charAt(0).toUpperCase();
  const city = displayLabel ?? user?.city;

  const stats = [
    {
      value: String(activeCount),
      label: ui.profileStatActive,
      icon: AppIcons.profile.bookings,
      onPress: () => appPush(customerRoutes.bookings),
    },
    {
      value: String(completedCount),
      label: ui.profileStatDone,
      icon: AppIcons.toast.success,
      onPress: () => appPush(customerRoutes.bookings),
    },
    {
      value: String(savedCount),
      label: ui.profileStatSaved,
      icon: AppIcons.profile.addresses,
      onPress: () => appPush(customerRoutes.addresses),
    },
  ];

  const primaryRows: {
    icon: LucideIcon;
    label: string;
    trailing?: string;
    tone: 'forest' | 'teal' | 'gold' | 'mint';
    onPress: () => void;
  }[] = [
    {
      icon: AppIcons.profile.addresses,
      label: ui.profileMenuAddresses,
      trailing: savedCount > 0 ? String(savedCount) : undefined,
      tone: 'forest',
      onPress: () => appPush(customerRoutes.addresses),
    },
    {
      icon: AppIcons.profile.payments,
      label: ui.profileMenuPayments,
      trailing: paymentCount > 0 ? String(paymentCount) : undefined,
      tone: 'teal',
      onPress: () => appPush(customerRoutes.paymentMethods),
    },
    {
      icon: AppIcons.profile.notifications,
      label: ui.profileMenuNotifications,
      trailing: unread > 0 ? String(unread) : undefined,
      tone: 'gold',
      onPress: () => appPush(customerRoutes.notifications),
    },
    {
      icon: AppIcons.profile.settings,
      label: ui.profileMenuSettings,
      tone: 'mint',
      onPress: () => appPush(customerRoutes.settings),
    },
  ];

  const moreRows = [
    {
      icon: AppIcons.profile.help,
      label: ui.profileMenuHelp,
      tone: 'forest' as const,
      onPress: () => appPush(customerRoutes.help),
    },
    {
      icon: AppIcons.profile.faq,
      label: ui.profileMenuFaq,
      tone: 'teal' as const,
      onPress: () => appPush(customerRoutes.faq),
    },
    {
      icon: AppIcons.profile.about,
      label: ui.profileMenuAbout,
      tone: 'gold' as const,
      onPress: () => appPush(customerRoutes.about),
    },
    {
      icon: AppIcons.profile.terms,
      label: ui.profileMenuTerms,
      tone: 'mint' as const,
      onPress: () => appPush(customerRoutes.terms),
    },
    {
      icon: AppIcons.profile.privacy,
      label: ui.profileMenuPrivacy,
      tone: 'forest' as const,
      onPress: () => appPush(customerRoutes.privacy),
    },
  ];

  const supportPhone = content.support.phone?.trim();
  const supportWa = content.support.whatsapp?.trim() || supportPhone;
  const guarantee = content.trust.guaranteeText?.trim();
  const trustBadges = content.trust.badges;

  return (
    <View style={styles.root}>
      <GlassBackdrop />
      <SafeAreaView style={styles.safe} edges={['left', 'right']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.forest} />
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
              <ProfileUpcomingCard
                booking={upcoming}
                eyebrow={upcomingEyebrow(upcoming)}
                onPress={() => appPush(bookingDetailPath(user?.role, upcoming.id))}
              />
            </View>
          ) : null}

          <ProfileQuickActions />

          {guarantee ? (
            <ProfileTrustBanner guaranteeText={guarantee} badges={trustBadges} />
          ) : null}

          <ProfileMenuSection title="Account">
            {primaryRows.map((r, i) => (
              <MenuRow key={r.label} {...r} showBorder={i > 0} />
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
              <MenuRow key={r.label} {...r} showBorder={i > 0} />
            ))}
          </ProfileMenuSection>

          <Pressable style={({ pressed }) => [styles.logoutPress, pressed && styles.pressed]} onPress={confirmSignOut}>
            <GlassPanel style={styles.logout} padded={false} tone="light">
              <View style={styles.logoutInner}>
                <PremiumIcon
                  icon={AppIcons.profile.logout}
                  variant="soft"
                  size="md"
                  color={colors.error}
                  bg={colors.errorBg}
                  bgTo="#F8D4CC"
                  boxSize={36}
                />
                <Text style={styles.logoutText}>{ui.profileSignOut}</Text>
              </View>
            </GlassPanel>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: surfaces.glassScreenBase, overflow: 'hidden' },
  safe: { flex: 1, backgroundColor: 'transparent' },
  scroll: { flex: 1 },
  content: { paddingBottom: TAB_BAR_SCROLL_PAD + 28 },
  loading: { height: 40, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  block: { paddingHorizontal: 20, marginTop: 18 },

  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 58,
  },
  menuBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(10,100,35,0.1)',
  },
  menuLabel: {
    flex: 1,
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    letterSpacing: -0.2,
    color: colors.ink,
  },
  trailPill: {
    minWidth: 24,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: colors.soft,
    alignItems: 'center',
  },
  menuTrail: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: colors.forest,
  },

  logoutPress: { marginTop: 26, marginHorizontal: 20 },
  logout: { borderRadius: 18 },
  logoutInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
  },
  logoutText: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.error,
  },
});
