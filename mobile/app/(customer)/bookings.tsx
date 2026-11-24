import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CircleHelp, Plus } from 'lucide-react-native';
import { BookingListCard } from '@/components/kit/BookingListCard';
import { BookingsEmpty } from '@/components/kit/BookingsEmpty';
import { BookingsNextHighlight } from '@/components/kit/BookingsNextHighlight';
import { BookingsSummaryBar } from '@/components/kit/BookingsSummaryBar';
import { PremiumAurora } from '@/components/kit/PremiumAurora';
import { TAB_BAR_SCROLL_PAD, customerScrollProps } from '@/components/kit/GlassScreenKit';
import { FocusStatusBar } from '@/components/ui/FocusStatusBar';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { PressableScale } from '@/components/ui/PressableScale';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { BookingsSkeleton } from '@/components/kit/ScreenSkeletons';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { fillCopy } from '@/constants/customerUiCopy';
import { stagger } from '@/lib/motion';
import { api, getApiErrorMessage, safeAsync, screenLoadConfig } from '@/lib/api';
import { CACHE_TTL } from '@/lib/apiCache';
import { bookingDetailPath, customerRoutes, appPush } from '@/lib/routes';
import { bookingHasTechnician, isRequestedTimePast, nextActiveBooking } from '@/lib/booking-helpers';
import { useBookingCopy } from '@/lib/schedule-copy';
import { useAuth } from '@/context/AuthContext';
import type { Booking, BookingCopyConfig, CustomerUiCopy } from '@/types/api';
import { CUSTOMER_LIST_PERF } from '@/lib/listConfig';
import { colors, fonts, radii, spacing, typeScale, ui } from '@/constants/theme';
import { useStaleFocusRefresh } from '@/lib/useStaleFocusRefresh';

type FilterKey = 'active' | 'completed' | 'cancelled';

function sortBookings(list: Booking[], filter: FilterKey): Booking[] {
  return [...list].sort((a, b) => {
    const da = a.schedule?.date ?? a.createdAt ?? '';
    const db = b.schedule?.date ?? b.createdAt ?? '';
    if (filter === 'active') return da.localeCompare(db);
    return db.localeCompare(da);
  });
}

function customerActionHint(booking: Booking, copy: BookingCopyConfig, labels: CustomerUiCopy): string | undefined {
  if (isRequestedTimePast(booking)) return copy.listPendingPastHint;
  if (booking.status === 'awaiting_verification') return labels.bookingsHintCode;
  if (booking.status === 'confirmed' && bookingHasTechnician(booking)) return labels.bookingsHintAssigned;
  return undefined;
}

function sectionLabel(filter: FilterKey, labels: CustomerUiCopy): string {
  if (filter === 'completed') return labels.bookingsPastTitle;
  if (filter === 'cancelled') return labels.bookingsCancelledTitle;
  return labels.bookingsUpcomingTitle;
}

export default function MyBookingsScreen() {
  const { user } = useAuth();
  const bookingCopy = useBookingCopy();
  const labels = useCustomerUiCopy();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<FilterKey>('active');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const role = user?.role;
  /** One stable handler for every card, so memoised rows don't re-render on each list update. */
  const openBooking = useCallback((b: Booking) => appPush(bookingDetailPath(role, b.id)), [role]);

  const load = useCallback(async () => {
    setLoadError(null);
    const { data } = await api.get<{ bookings: Booking[] }>('/bookings', {
      ...screenLoadConfig,
      cacheTtlMs: CACHE_TTL.bookingsList,
    });
    setBookings(data.bookings);
  }, []);

  useEffect(() => {
    safeAsync(async () => {
      try {
        await load();
      } catch (err) {
        setLoadError(getApiErrorMessage(err, labels.bookingsLoadFailed));
      }
    }, () => setLoading(false));
  }, [load]);

  useStaleFocusRefresh(() => load().catch(() => undefined), 3_000);

  const counts = useMemo(
    () => ({
      active: bookings.filter((b) => !['completed', 'cancelled'].includes(b.status)).length,
      completed: bookings.filter((b) => b.status === 'completed').length,
      cancelled: bookings.filter((b) => b.status === 'cancelled').length,
    }),
    [bookings],
  );

  const filtered = useMemo(() => {
    const list = bookings.filter((b) => {
      if (filter === 'completed') return b.status === 'completed';
      if (filter === 'cancelled') return b.status === 'cancelled';
      return !['completed', 'cancelled'].includes(b.status);
    });
    return sortBookings(list, filter);
  }, [bookings, filter]);

  const nextActive = useMemo(() => nextActiveBooking(bookings), [bookings]);

  const listData = useMemo(() => {
    if (filter === 'active' && nextActive) {
      return filtered.filter((b) => b.id !== nextActive.id);
    }
    return filtered;
  }, [filtered, filter, nextActive]);

  const total = counts.active + counts.completed + counts.cancelled;
  const subtitle = loading
    ? labels.bookingsLoadingSub
    : total === 0
      ? labels.bookingsEmptySub
      : fillCopy(labels.bookingsCountSub, { active: counts.active, total });

  async function onRefresh() {
    setRefreshing(true);
    try {
      await load();
    } catch (err) {
      setLoadError(getApiErrorMessage(err, labels.homeRefreshFailed));
    } finally {
      setRefreshing(false);
    }
  }

  const hero = (
    <View style={styles.header}>
      <PremiumAurora tone="light" base={false} topFade />
      <View style={styles.headerTop}>
      <View style={styles.heroLeft}>
        <View style={styles.kickerRow}>
          <View style={styles.kickerDot} />
          <Text style={styles.kicker}>{labels.bookingsKicker}</Text>
        </View>
        <Text style={styles.heroTitle} accessibilityRole="header">
          {bookingCopy.listScreenTitle}
        </Text>
      </View>
      <View style={styles.heroActions}>
        <PressableScale
          scaleTo={0.92}
          style={styles.guideBtn}
          onPress={() => appPush(customerRoutes.bookGuide)}
          accessibilityRole="button"
          accessibilityLabel={labels.helpGuideTitle}
        >
          <CircleHelp size={18} color={ui.brand} strokeWidth={2.2} />
        </PressableScale>
        <PressableScale
          scaleTo={0.94}
          haptic="tap"
          style={styles.bookBtn}
          onPress={() => appPush(customerRoutes.services)}
          accessibilityRole="button"
          accessibilityLabel={labels.bookingsBookButton}
        >
          <Plus size={18} color={colors.white} strokeWidth={2.6} />
          <Text style={styles.bookBtnText}>{labels.bookingsBookButton}</Text>
        </PressableScale>
      </View>
      </View>
      <Text style={styles.heroSub}>{subtitle}</Text>
    </View>
  );

  const listHeader =
    bookings.length > 0 ? (
      <View style={styles.headerBlock}>
        {hero}
        <BookingsSummaryBar
          active={counts.active}
          completed={counts.completed}
          cancelled={counts.cancelled}
          selected={filter}
          onSelect={setFilter}
        />
        {filter === 'active' && nextActive ? (
          <FadeSlideIn key={nextActive.id} delay={stagger(0)} slideFrom={14}>
            <BookingsNextHighlight
              booking={nextActive}
              onPress={() => appPush(bookingDetailPath(user?.role, nextActive.id))}
            />
          </FadeSlideIn>
        ) : null}
        {/* Only a heading when there are rows under it — the pinned "next visit" card is its own block. */}
        {listData.length > 0 ? (
          <View style={styles.sectionPad}>
            <Text style={styles.sectionTitle}>{sectionLabel(filter, labels)}</Text>
            <Text style={styles.sectionCount}>
              {listData.length === 1 ? labels.bookingsCountOne : fillCopy(labels.bookingsCountMany, { count: listData.length })}
            </Text>
          </View>
        ) : null}
      </View>
    ) : (
      <View>{hero}</View>
    );

  return (
    <View style={styles.root}>
      <FocusStatusBar style="dark" />
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        {loading ? (
          <View style={styles.flex}>
            {hero}
            <BookingsSkeleton />
          </View>
        ) : loadError && bookings.length === 0 ? (
          <View style={styles.flex}>
            {hero}
            <View style={styles.loadingBody}>
              <ListEmptyRetry
                message={loadError}
                onRetry={() => safeAsync(load, undefined, (msg) => setLoadError(msg))}
              />
            </View>
          </View>
        ) : (
          <FlatList
            style={styles.flex}
            data={listData}
            keyExtractor={(b) => b.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ui.brand} />
            }
            contentContainerStyle={[
              styles.listContent,
              listData.length === 0 && !(filter === 'active' && nextActive) && styles.listEmptyGrow,
            ]}
            ListHeaderComponent={listHeader}
            ListEmptyComponent={
              bookings.length === 0 || (listData.length === 0 && !(filter === 'active' && nextActive)) ? (
                <BookingsEmpty filter={filter} />
              ) : null
            }
            {...CUSTOMER_LIST_PERF}
            {...customerScrollProps}
            renderItem={({ item, index }) => (
              <FadeSlideIn delay={stagger(index + 1)} slideFrom={14} disabled={index > 6} style={styles.cardPad}>
                <BookingListCard
                  booking={item}
                  hint={customerActionHint(item, bookingCopy, labels)}
                  hintTone={isRequestedTimePast(item) ? 'warning' : 'status'}
                  onPress={openBooking}
                />
              </FadeSlideIn>
            )}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  // White root so the status-bar strip matches the white header; the feed below sits on the muted canvas.
  root: { flex: 1, backgroundColor: colors.white },
  safe: { flex: 1, backgroundColor: 'transparent' },
  flex: { flex: 1, backgroundColor: ui.canvas },
  listContent: { paddingBottom: TAB_BAR_SCROLL_PAD + 12, flexGrow: 1 },
  listEmptyGrow: { flexGrow: 1 },
  loadingBody: { flex: 1, justifyContent: 'center', paddingTop: 24 },

  headerBlock: { marginBottom: 2 },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: ui.hairline,
    marginBottom: 14,
    overflow: 'hidden',
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroLeft: { flex: 1, minWidth: 0 },
  kickerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  kickerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: ui.brandBright },
  kicker: {
    fontFamily: fonts.bodyBold,
    fontSize: 10.5,
    letterSpacing: 1.1,
    color: ui.brand,
  },
  heroTitle: { ...typeScale.display, fontSize: 24, lineHeight: 30, color: ui.text },
  heroSub: { ...typeScale.caption, marginTop: 8, lineHeight: 18, color: ui.textSecondary },
  heroActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  guideBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ui.brandSoft,
    borderWidth: 1,
    borderColor: ui.hairline,
  },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 40,
    paddingLeft: 12,
    paddingRight: 15,
    borderRadius: radii.pill,
    backgroundColor: ui.brand,
    shadowColor: colors.forest,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  bookBtnText: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: colors.white },

  sectionPad: {
    paddingHorizontal: spacing.md,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 10,
  },
  sectionTitle: { ...typeScale.section, fontSize: 17, lineHeight: 23, color: ui.text },
  sectionCount: {
    fontFamily: fonts.bodySemi,
    fontSize: 12.5,
    color: ui.textTertiary,
  },
  cardPad: { paddingHorizontal: spacing.md },
});
