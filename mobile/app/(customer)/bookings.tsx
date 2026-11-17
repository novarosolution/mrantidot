import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
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
import { Spinner } from '@/components/ui/Spinner';
import { api, getApiErrorMessage, safeAsync, screenLoadConfig } from '@/lib/api';
import { CACHE_TTL } from '@/lib/apiCache';
import { bookingDetailPath, customerRoutes, appPush } from '@/lib/routes';
import { bookingHasTechnician, isRequestedTimePast, nextActiveBooking } from '@/lib/booking-helpers';
import { useBookingCopy } from '@/lib/schedule-copy';
import { useAuth } from '@/context/AuthContext';
import type { Booking, BookingCopyConfig } from '@/types/api';
import { CUSTOMER_LIST_PERF } from '@/lib/listConfig';
import { colors, fonts, spacing, ui } from '@/constants/theme';
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

function customerActionHint(booking: Booking, copy: BookingCopyConfig): string | undefined {
  if (isRequestedTimePast(booking)) return copy.listPendingPastHint;
  if (booking.status === 'awaiting_verification') return 'Share your completion code';
  if (booking.status === 'confirmed' && bookingHasTechnician(booking)) return 'Expert assigned · share start code on arrival';
  return undefined;
}

function sectionLabel(filter: FilterKey): string {
  if (filter === 'completed') return 'Past visits';
  if (filter === 'cancelled') return 'Cancelled visits';
  return 'Upcoming visits';
}

export default function MyBookingsScreen() {
  const { user } = useAuth();
  const bookingCopy = useBookingCopy();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<FilterKey>('active');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

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
        setLoadError(getApiErrorMessage(err, 'Could not load bookings'));
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
    ? 'Loading your visits…'
    : total === 0
      ? 'No visits yet — book your first service'
      : `${counts.active} active · ${total} total`;

  async function onRefresh() {
    setRefreshing(true);
    try {
      await load();
    } catch (err) {
      setLoadError(getApiErrorMessage(err, 'Could not refresh bookings'));
    } finally {
      setRefreshing(false);
    }
  }

  const hero = (
    <View style={styles.header}>
      <PremiumAurora tone="light" base={false} topFade />
      <View style={styles.heroLeft}>
        <Text style={styles.kicker}>YOUR VISITS</Text>
        <Text style={styles.heroTitle}>{bookingCopy.listScreenTitle}</Text>
        <Text style={styles.heroSub}>{subtitle}</Text>
      </View>
      <View style={styles.heroActions}>
        <Pressable
          style={({ pressed }) => [styles.guideBtn, pressed && styles.pressedSm]}
          onPress={() => appPush(customerRoutes.bookGuide)}
          accessibilityRole="button"
          accessibilityLabel="How to book a service"
        >
          <CircleHelp size={18} color={ui.brand} strokeWidth={2.2} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.bookBtn, pressed && styles.pressedSm]}
          onPress={() => appPush(customerRoutes.services)}
          accessibilityRole="button"
          accessibilityLabel="Book a service"
        >
          <Plus size={18} color={colors.white} strokeWidth={2.6} />
          <Text style={styles.bookBtnText}>Book</Text>
        </Pressable>
      </View>
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
          <BookingsNextHighlight
            booking={nextActive}
            onPress={() => appPush(bookingDetailPath(user?.role, nextActive.id))}
          />
        ) : null}
        {listData.length > 0 || (filter === 'active' && nextActive) ? (
          <View style={styles.sectionPad}>
            <Text style={styles.sectionTitle}>{sectionLabel(filter)}</Text>
            <Text style={styles.sectionCount}>
              {filter === 'active' && nextActive ? listData.length + 1 : listData.length}{' '}
              {(filter === 'active' && nextActive ? listData.length + 1 : listData.length) === 1
                ? 'booking'
                : 'bookings'}
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
            <View style={styles.loadingBody}>
              <Spinner />
            </View>
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
            renderItem={({ item }) => (
              <View style={styles.cardPad}>
                <BookingListCard
                  booking={item}
                  hint={customerActionHint(item, bookingCopy)}
                  hintTone={isRequestedTimePast(item) ? 'warning' : 'status'}
                  onPress={() => appPush(bookingDetailPath(user?.role, item.id))}
                />
              </View>
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
  flex: { flex: 1, backgroundColor: ui.surfaceMuted },
  listContent: { paddingBottom: TAB_BAR_SCROLL_PAD + 12, flexGrow: 1 },
  listEmptyGrow: { flexGrow: 1 },
  loadingBody: { flex: 1, justifyContent: 'center', paddingTop: 24 },
  pressedSm: { transform: [{ scale: 0.94 }], opacity: 0.92 },

  headerBlock: { marginBottom: 2 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: spacing.md,
    paddingTop: 10,
    paddingBottom: 18,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: ui.hairline,
    marginBottom: 14,
    overflow: 'hidden',
  },
  heroLeft: { flex: 1, minWidth: 0 },
  kicker: {
    fontFamily: fonts.bodyBold,
    fontSize: 10.5,
    letterSpacing: 1.1,
    color: ui.brand,
    marginBottom: 4,
  },
  heroTitle: {
    fontFamily: fonts.displayExtra,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.6,
    color: ui.text,
  },
  heroSub: {
    marginTop: 4,
    fontFamily: fonts.body,
    fontSize: 13.5,
    lineHeight: 19,
    color: ui.textSecondary,
  },
  heroActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
  },
  guideBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
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
    height: 42,
    paddingLeft: 14,
    paddingRight: 16,
    borderRadius: 14,
    backgroundColor: ui.brand,
    shadowColor: colors.forest,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  bookBtnText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.white },

  sectionPad: {
    paddingHorizontal: spacing.md,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 10,
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 17,
    letterSpacing: -0.3,
    color: ui.text,
  },
  sectionCount: {
    fontFamily: fonts.bodySemi,
    fontSize: 12.5,
    color: ui.textTertiary,
  },
  cardPad: { paddingHorizontal: spacing.md },
});
