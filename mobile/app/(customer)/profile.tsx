import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { CalendarCheck, CircleAlert, CreditCard, LogOut, MapPin } from 'lucide-react-native';
import { customerScrollProps, TAB_BAR_SCROLL_PAD } from '@/components/kit/GlassScreenKit';
import { CustomerProfileHero, type ProfileStat } from '@/components/kit/CustomerProfileHero';
import { HomeNextVisitCard } from '@/components/kit/HomeNextVisitCard';
import { ProfileMenuRow } from '@/components/kit/ProfileMenuRow';
import { ProfileMenuSection } from '@/components/kit/ProfileMenuSection';
import { ProfileSupportCard } from '@/components/kit/ProfileSupportCard';
import { ProfileTrustBanner } from '@/components/kit/ProfileTrustBanner';
import { AdminActionSheet } from '@/components/kit/AdminActionSheet';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { PressableScale } from '@/components/ui/PressableScale';
import { AppIcons } from '@/constants/appIcons';
import { fillCopy } from '@/constants/customerUiCopy';
import { bookingDetailPath, authRoutes, customerRoutes, appPush, appReplace } from '@/lib/routes';
import { getApiErrorMessage, screenLoadConfig } from '@/lib/api';
import { CACHE_TTL } from '@/lib/apiCache';
import { cachedGet } from '@/lib/cachedGet';
import { useAuth } from '@/context/AuthContext';
import { useAppContent } from '@/context/AppContentContext';
import { useLocation } from '@/context/LocationContext';
import { displayUserEmail, displayUserName, formatPhoneDisplay, hasDisplayName, isProfileIncomplete } from '@/lib/profile-display';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { localDateKey } from '@/lib/dates';
import { bookingVisitDate } from '@/lib/booking-helpers';
import { useStaleFocusRefresh } from '@/lib/useStaleFocusRefresh';
import { haptic, stagger } from '@/lib/motion';
import type { Booking } from '@/types/api';
import { colors, radii, spacing, typeScale, ui } from '@/constants/theme';

function pickUpcoming(bookings: Booking[]): Booking | null {
  const today = localDateKey();
  const active = bookings.filter((b) => !['completed', 'cancelled'].includes(b.status));
  if (active.length === 0) return null;
  const rank = (b: Booking) => {
    if (b.status === 'in_progress') return 0;
    if (b.status === 'awaiting_verification') return 1;
    const d = bookingVisitDate(b) ?? b.schedule?.date ?? '';
    return d && d < today ? 2 : 3;
  };
  return (
    [...active].sort((a, b) => {
      const diff = rank(a) - rank(b);
      if (diff !== 0) return diff;
      const da = bookingVisitDate(a) ?? a.schedule?.date ?? a.createdAt ?? '';
      const db = bookingVisitDate(b) ?? b.schedule?.date ?? b.createdAt ?? '';
      return da.localeCompare(db);
    })[0] ?? null
  );
}

type Counts = { bookings: Booking[]; saved: number; payments: number; unread: number };

/**
 * Profile — identity hero with live stats, the next visit, account + help menus, support and the brand
 * promise. Lists come through the shared GET cache (one request per list per minute at most, cleared
 * on any change), and the account itself refreshes once per focus.
 */
export default function ProfileScreen() {
  const { user, logout, refreshMe } = useAuth();
  const { content } = useAppContent();
  const copy = useCustomerUiCopy();
  const { displayLabel } = useLocation();
  const [counts, setCounts] = useState<Counts | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [signOutAsk, setSignOutAsk] = useState(false);

  const load = useCallback(
    async (force = false) => {
      const opts = { ...screenLoadConfig, force };
      const [bookingsRes, addrRes, payRes, notifRes] = await Promise.allSettled([
        cachedGet<{ bookings: Booking[] }>('/bookings', CACHE_TTL.bookingsList, opts),
        cachedGet<{ addresses: unknown[] }>('/addresses', CACHE_TTL.addresses, opts),
        cachedGet<{ paymentMethods: unknown[] }>('/payment-methods', CACHE_TTL.paymentMethods, opts),
        // Counts only (`limit=0`) — the profile just shows the unread badge.
        cachedGet<{ unreadCount: number }>('/notifications', CACHE_TTL.notifications, { ...opts, params: { limit: 0 } }),
      ]);
      if (bookingsRes.status === 'rejected' && addrRes.status === 'rejected') {
        throw bookingsRes.reason;
      }
      setError(null);
      setCounts({
        bookings: bookingsRes.status === 'fulfilled' ? bookingsRes.value.bookings : [],
        saved: addrRes.status === 'fulfilled' ? addrRes.value.addresses.length : 0,
        payments: payRes.status === 'fulfilled' ? payRes.value.paymentMethods.length : 0,
        unread: notifRes.status === 'fulfilled' ? notifRes.value.unreadCount : 0,
      });
    },
    [],
  );

  useEffect(() => {
    void load().catch((err) => setError(getApiErrorMessage(err, copy.systemErrorMessage)));
    // First paint only — copy edits must not refetch.
  }, [load]);

  // Coming back to the tab: account + lists, at most every 30 s (the GET cache answers in between).
  useStaleFocusRefresh(() => {
    void refreshMe({ silent: true });
    void load().catch(() => undefined);
  });

  const bookings = counts?.bookings ?? [];
  const upcoming = useMemo(() => pickUpcoming(bookings), [bookings]);
  const activeCount = useMemo(() => bookings.filter((b) => !['completed', 'cancelled'].includes(b.status)).length, [bookings]);

  async function onRefresh() {
    setRefreshing(true);
    try {
      await Promise.all([refreshMe({ silent: true }), load(true)]);
    } catch (err) {
      setError(getApiErrorMessage(err, copy.systemErrorMessage));
    } finally {
      setRefreshing(false);
    }
  }

  const named = hasDisplayName(user);
  const name = displayUserName(user, copy.profileNameFallback);
  const email = displayUserEmail(user?.email);
  const phone = formatPhoneDisplay(user?.phone);
  const city = displayLabel ?? user?.city ?? undefined;
  const incomplete = isProfileIncomplete(user);
  const brand = content.branding.name?.trim() || 'Mr Antidot';
  const loading = counts === null;

  const stats: ProfileStat[] = [
    {
      value: loading ? null : String(activeCount),
      label: copy.profileStatActiveLabel,
      icon: CalendarCheck,
      onPress: () => appPush(customerRoutes.bookings),
    },
    {
      value: loading ? null : String(counts.saved),
      label: copy.profileStatAddresses,
      icon: MapPin,
      onPress: () => appPush(customerRoutes.addresses),
    },
    {
      value: loading ? null : String(counts.payments),
      label: copy.profileStatPayments,
      icon: CreditCard,
      onPress: () => appPush(customerRoutes.paymentMethods),
    },
  ];

  const incompleteBadge = incomplete ? (
    <View style={styles.incompleteRow}>
      <View style={styles.incomplete}>
        <CircleAlert size={13} color={colors.error} strokeWidth={2.4} />
        <Text style={styles.incompleteText}>{copy.profileIncomplete}</Text>
      </View>
      <PressableScale
        style={styles.completeBtn}
        hitSlop={4}
        haptic="tap"
        onPress={() => appPush(customerRoutes.settings)}
        accessibilityRole="button"
      >
        <Text style={styles.completeText}>{copy.profileComplete}</Text>
      </PressableScale>
    </View>
  ) : null;

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.flex} edges={['top', 'left', 'right']}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ui.brand} />}
          {...customerScrollProps}
        >
          <CustomerProfileHero
            name={name}
            // No name yet → the hero shows a person icon instead of the fallback's first letter.
            initial={named ? (name[0] ?? '').toUpperCase() : ''}
            phone={phone || undefined}
            email={email || undefined}
            city={city}
            unread={counts?.unread ?? 0}
            stats={stats}
            badge={incompleteBadge}
            onEdit={() => appPush(customerRoutes.settings)}
          />

          {error ? <ListEmptyRetry message={error} onRetry={() => void load(true).catch(() => undefined)} /> : null}

          {upcoming ? (
            <FadeSlideIn delay={stagger(1)} style={styles.block}>
              <Text style={styles.blockTitle} accessibilityRole="header">
                {copy.profileNextVisitTitle}
              </Text>
              <HomeNextVisitCard booking={upcoming} onPress={() => appPush(bookingDetailPath(user?.role, upcoming.id))} />
            </FadeSlideIn>
          ) : null}

          <FadeSlideIn delay={stagger(2)}>
            <ProfileMenuSection title={copy.profileSectionAccount}>
              <ProfileMenuRow
                icon={AppIcons.profile.bookings}
                label={copy.profileMenuBookings}
                description={copy.profileMenuBookingsSub}
                badge={activeCount}
                showBorder
                onPress={() => appPush(customerRoutes.bookings)}
              />
              <ProfileMenuRow
                icon={AppIcons.profile.addresses}
                label={copy.profileMenuAddresses}
                description={copy.profileMenuAddressesSub}
                showBorder
                onPress={() => appPush(customerRoutes.addresses)}
              />
              <ProfileMenuRow
                icon={AppIcons.profile.payments}
                label={copy.profileMenuPayments}
                description={copy.profileMenuPaymentsSub}
                showBorder
                onPress={() => appPush(customerRoutes.paymentMethods)}
              />
              <ProfileMenuRow
                icon={AppIcons.profile.notifications}
                label={copy.profileMenuNotifications}
                description={copy.profileMenuNotificationsSub}
                badge={counts?.unread ?? 0}
                showBorder
                onPress={() => appPush(customerRoutes.notifications)}
              />
              <ProfileMenuRow
                icon={AppIcons.profile.offers}
                label={copy.profileMenuOffers}
                description={copy.profileMenuOffersSub}
                showBorder
                onPress={() => appPush(customerRoutes.offers)}
              />
              <ProfileMenuRow
                icon={AppIcons.profile.settings}
                label={copy.profileMenuSettings}
                description={copy.profileMenuSettingsSub}
                onPress={() => appPush(customerRoutes.settings)}
              />
            </ProfileMenuSection>
          </FadeSlideIn>

          <FadeSlideIn delay={stagger(3)}>
            <ProfileSupportCard phone={content.support.phone} whatsapp={content.support.whatsapp} hours={content.support.hours} />
          </FadeSlideIn>

          <FadeSlideIn delay={stagger(4)}>
            <ProfileMenuSection title={copy.profileSectionInfo}>
              <ProfileMenuRow
                icon={AppIcons.profile.help}
                label={copy.profileMenuHelp}
                description={copy.profileMenuHelpSub}
                showBorder
                onPress={() => appPush(customerRoutes.help)}
              />
              <ProfileMenuRow
                icon={AppIcons.profile.faq}
                label={copy.profileMenuFaq}
                description={copy.profileMenuFaqSub}
                showBorder
                onPress={() => appPush(customerRoutes.faq)}
              />
              <ProfileMenuRow
                icon={AppIcons.profile.about}
                label={`${copy.profileMenuAbout} ${brand}`}
                description={copy.profileMenuAboutSub}
                showBorder
                onPress={() => appPush(customerRoutes.about)}
              />
              <ProfileMenuRow
                icon={AppIcons.profile.terms}
                label={copy.profileMenuTerms}
                description={copy.profileMenuTermsSub}
                showBorder
                onPress={() => appPush(customerRoutes.terms)}
              />
              <ProfileMenuRow
                icon={AppIcons.profile.privacy}
                label={copy.profileMenuPrivacy}
                description={copy.profileMenuPrivacySub}
                onPress={() => appPush(customerRoutes.privacy)}
              />
            </ProfileMenuSection>
          </FadeSlideIn>

          <FadeSlideIn delay={stagger(5)}>
            <ProfileTrustBanner guaranteeText={content.trust.guaranteeText} badges={content.trust.badges} />
          </FadeSlideIn>

          <View style={styles.footer}>
            <PressableScale
              style={styles.logout}
              onPress={() => {
                haptic('warning');
                setSignOutAsk(true);
              }}
              accessibilityRole="button"
            >
              <LogOut size={17} color={colors.error} strokeWidth={2.2} />
              <Text style={styles.logoutText}>{copy.profileSignOut}</Text>
            </PressableScale>
            <Text style={styles.version}>
              {fillCopy(copy.profileVersion, { brand, version: Constants.expoConfig?.version ?? '1.0.0' })}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      <AdminActionSheet
        visible={signOutAsk}
        title={copy.profileSignOutTitle}
        message={copy.profileSignOutMessage}
        onClose={() => setSignOutAsk(false)}
        options={[
          {
            key: 'signout',
            label: copy.profileSignOut,
            destructive: true,
            onPress: async () => {
              await logout();
              appReplace(authRoutes.login);
            },
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: ui.canvas },
  flex: { flex: 1 },
  content: { paddingBottom: TAB_BAR_SCROLL_PAD + 24 },
  incompleteRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  incomplete: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    height: 28,
    borderRadius: radii.pill,
    backgroundColor: colors.errorBg,
  },
  incompleteText: { ...typeScale.micro, fontSize: 12, color: colors.error },
  completeBtn: {
    paddingHorizontal: 16,
    minHeight: 40,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: ui.text,
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  completeText: { ...typeScale.captionStrong, color: ui.text },
  block: { marginHorizontal: spacing.md, marginBottom: spacing.md },
  blockTitle: { ...typeScale.section, fontSize: 17, lineHeight: 23, marginBottom: 12, color: ui.text },
  footer: { paddingHorizontal: spacing.md, paddingTop: spacing.xs },
  logout: {
    height: 48,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: 'rgba(179,63,40,0.22)',
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutText: { ...typeScale.button, fontSize: 14.5, color: colors.error },
  version: { ...typeScale.caption, fontSize: 12, marginTop: 14, textAlign: 'center', color: ui.textTertiary },
});
