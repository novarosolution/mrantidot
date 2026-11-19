import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import type { LucideIcon } from 'lucide-react-native';
import { Bell, ChevronRight, CircleAlert, LogOut } from 'lucide-react-native';
import { customerScrollProps, TAB_BAR_SCROLL_PAD } from '@/components/kit/GlassScreenKit';
import { HomeNextVisitCard } from '@/components/kit/HomeNextVisitCard';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { FocusStatusBar } from '@/components/ui/FocusStatusBar';
import { AppIcons } from '@/constants/appIcons';
import { bookingDetailPath, authRoutes, customerRoutes, appPush, appReplace } from '@/lib/routes';
import { api, screenLoadConfig } from '@/lib/api';
import { useScreenLoad } from '@/lib/useScreenLoad';
import { useAuth } from '@/context/AuthContext';
import { useAppContent } from '@/context/AppContentContext';
import { useLocation } from '@/context/LocationContext';
import { displayUserEmail, displayUserName, isProfileIncomplete } from '@/lib/profile-display';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { localDateKey } from '@/lib/dates';
import { bookingVisitDate } from '@/lib/booking-helpers';
import { useStaleFocusRefresh } from '@/lib/useStaleFocusRefresh';
import type { Booking } from '@/types/api';
import { colors, fonts, spacing, ui } from '@/constants/theme';

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

/** Square shortcut tile — the reference's "My bookings / Help & support" row. */
function QuickTile({ icon: Icon, label, sub, onPress }: { icon: LucideIcon; label: string; sub?: string; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={sub ? `${label}, ${sub}` : label}
    >
      <Icon size={26} color={ui.brand} strokeWidth={1.9} />
      <View>
        <Text style={styles.tileLabel} numberOfLines={2}>
          {label}
        </Text>
        {sub ? <Text style={styles.tileSub}>{sub}</Text> : null}
      </View>
    </Pressable>
  );
}

/** Plain list row: icon, label, optional count, chevron. */
function MenuRow({ icon: Icon, label, count, onPress }: { icon: LucideIcon; label: string; count?: number; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.menuRow, pressed && styles.pressed]} onPress={onPress} accessibilityRole="button">
      <Icon size={20} color={ui.text} strokeWidth={1.9} />
      <Text style={styles.menuLabel}>{label}</Text>
      {count ? (
        <View style={styles.count}>
          <Text style={styles.countText}>{count}</Text>
        </View>
      ) : null}
      <ChevronRight size={18} color={ui.textTertiary} strokeWidth={2} />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { user, logout, refreshMe } = useAuth();
  const { content } = useAppContent();
  const copy = useCustomerUiCopy();
  const { displayLabel } = useLocation();
  const { error, runLoad, reload } = useScreenLoad();
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
  const activeCount = useMemo(() => bookings.filter((b) => !['completed', 'cancelled'].includes(b.status)).length, [bookings]);

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
        text: copy.profileSignOut,
        style: 'destructive',
        onPress: async () => {
          await logout();
          appReplace(authRoutes.login);
        },
      },
    ]);
  }

  const name = displayUserName(user);
  const email = displayUserEmail(user?.email);
  const rawPhone = user?.phone?.trim();
  // 10-digit Indian mobile → "+91 98765 43210"; anything else is shown as entered.
  const phone = rawPhone ? (/^\d{10}$/.test(rawPhone) ? `+91 ${rawPhone.slice(0, 5)} ${rawPhone.slice(5)}` : rawPhone) : undefined;
  const city = displayLabel ?? user?.city;
  const incomplete = isProfileIncomplete(user);
  const brand = content.branding.name?.trim() || 'Mr Antidot';

  return (
    <View style={styles.root}>
      <FocusStatusBar style="dark" />
      <SafeAreaView style={styles.flex} edges={['top', 'left', 'right']}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ui.brand} />}
          {...customerScrollProps}
        >
          <View style={styles.topRow}>
            {incomplete ? (
              <View style={styles.incomplete}>
                <CircleAlert size={13} color={colors.error} strokeWidth={2.4} />
                <Text style={styles.incompleteText}>Incomplete profile</Text>
              </View>
            ) : (
              <View />
            )}
            <View style={styles.topActions}>
              {incomplete ? (
                <Pressable style={styles.completeBtn} onPress={() => appPush(customerRoutes.settings)} accessibilityRole="button">
                  <Text style={styles.completeText}>Complete</Text>
                </Pressable>
              ) : null}
              <Pressable
                style={({ pressed }) => [styles.bell, pressed && styles.pressed]}
                onPress={() => appPush(customerRoutes.notifications)}
                accessibilityRole="button"
                accessibilityLabel={unread > 0 ? `${unread} unread notifications` : 'Notifications'}
              >
                <Bell size={20} color={ui.text} strokeWidth={2} />
                {unread > 0 ? <View style={styles.bellDot} /> : null}
              </Pressable>
            </View>
          </View>

          <Pressable onPress={() => appPush(customerRoutes.settings)} accessibilityRole="button" accessibilityLabel="Edit profile">
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.meta}>{[phone, email].filter(Boolean).join('  ·  ')}</Text>
            {city ? <Text style={styles.city}>{city}</Text> : null}
          </Pressable>

          {error ? <ListEmptyRetry message={error} onRetry={() => void reload(load, error)} /> : null}

          <View style={styles.tiles}>
            <QuickTile
              icon={AppIcons.profile.bookings}
              label={copy.profileMenuBookings}
              sub={activeCount > 0 ? `${activeCount} active` : undefined}
              onPress={() => appPush(customerRoutes.bookings)}
            />
            <QuickTile icon={AppIcons.profile.offers} label="Offers" onPress={() => appPush(customerRoutes.offers)} />
            <QuickTile icon={AppIcons.profile.help} label={copy.profileMenuHelp} onPress={() => appPush(customerRoutes.help)} />
          </View>

          {upcoming ? (
            <View style={styles.block}>
              <Text style={styles.blockTitle}>{copy.profileNextVisitTitle}</Text>
              <HomeNextVisitCard booking={upcoming} onPress={() => appPush(bookingDetailPath(user?.role, upcoming.id))} />
            </View>
          ) : null}

          <View style={styles.menu}>
            <MenuRow icon={AppIcons.profile.addresses} label={copy.profileMenuAddresses} count={savedCount} onPress={() => appPush(customerRoutes.addresses)} />
            <MenuRow icon={AppIcons.profile.payments} label={copy.profileMenuPayments} count={paymentCount} onPress={() => appPush(customerRoutes.paymentMethods)} />
            <MenuRow icon={AppIcons.profile.notifications} label={copy.profileMenuNotifications} count={unread} onPress={() => appPush(customerRoutes.notifications)} />
            <MenuRow icon={AppIcons.profile.settings} label={copy.profileMenuSettings} onPress={() => appPush(customerRoutes.settings)} />
            <View style={styles.menuGap} />
            <MenuRow icon={AppIcons.profile.faq} label={copy.profileMenuFaq} onPress={() => appPush(customerRoutes.faq)} />
            <MenuRow icon={AppIcons.profile.about} label={`${copy.profileMenuAbout} ${brand}`} onPress={() => appPush(customerRoutes.about)} />
            <MenuRow icon={AppIcons.profile.terms} label={copy.profileMenuTerms} onPress={() => appPush(customerRoutes.terms)} />
            <MenuRow icon={AppIcons.profile.privacy} label={copy.profileMenuPrivacy} onPress={() => appPush(customerRoutes.privacy)} />
          </View>

          <Pressable
            style={({ pressed }) => [styles.logout, pressed && styles.logoutPressed]}
            onPress={confirmSignOut}
            accessibilityRole="button"
          >
            <LogOut size={17} color={colors.error} strokeWidth={2.2} />
            <Text style={styles.logoutText}>{copy.profileSignOut}</Text>
          </Pressable>
          <Text style={styles.version}>
            {brand} · v{Constants.expoConfig?.version ?? '1.0.0'}
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  flex: { flex: 1 },
  pressed: { opacity: 0.7 },
  content: { paddingHorizontal: spacing.md, paddingTop: 8, paddingBottom: TAB_BAR_SCROLL_PAD + 24 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  incomplete: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.errorBg,
  },
  incompleteText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.error },
  completeBtn: {
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: ui.text,
    justifyContent: 'center',
  },
  completeText: { fontFamily: fonts.bodySemi, fontSize: 13.5, color: ui.text },
  bell: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: ui.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.error,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  name: { marginTop: 10, fontFamily: fonts.displaySemi, fontSize: 28, letterSpacing: -0.7, color: ui.text },
  meta: { marginTop: 4, fontFamily: fonts.bodyMedium, fontSize: 14, color: ui.textSecondary },
  city: { marginTop: 2, fontFamily: fonts.body, fontSize: 13, color: ui.textTertiary },
  tiles: { flexDirection: 'row', gap: 10, marginTop: 22 },
  tile: {
    flex: 1,
    minHeight: 104,
    padding: 12,
    gap: 10,
    justifyContent: 'space-between',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: colors.white,
    ...ui.shadow,
  },
  tileLabel: { fontFamily: fonts.bodySemi, fontSize: 13.5, lineHeight: 18, color: ui.text },
  tileSub: { marginTop: 2, fontFamily: fonts.body, fontSize: 12, color: ui.brand },
  block: { marginTop: 24 },
  blockTitle: { marginBottom: 12, fontFamily: fonts.displaySemi, fontSize: 18, letterSpacing: -0.3, color: ui.text },
  menu: { marginTop: 18 },
  menuGap: { height: 10, marginVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: ui.border },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  menuLabel: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 15.5, color: ui.text },
  count: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: ui.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: { fontFamily: fonts.bodyBold, fontSize: 12, color: ui.brand },
  logout: {
    marginTop: 22,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ui.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutPressed: { backgroundColor: colors.errorBg },
  logoutText: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.error },
  version: { marginTop: 14, textAlign: 'center', fontFamily: fonts.bodyMedium, fontSize: 12, color: ui.textTertiary },
});
