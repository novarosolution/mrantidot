import { LinearGradient } from 'expo-linear-gradient';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookingListCard } from '@/components/kit/BookingListCard';
import { BookingsEmpty } from '@/components/kit/BookingsEmpty';
import { BookingsNextHighlight } from '@/components/kit/BookingsNextHighlight';
import { BookingsSummaryBar } from '@/components/kit/BookingsSummaryBar';
import { GlassBackdrop, TAB_BAR_SCROLL_PAD, customerScrollProps } from '@/components/kit/GlassScreenKit';
import { HeroDarkSlice } from '@/components/kit/HeroDarkSlice';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { api, getApiErrorMessage, safeAsync, screenLoadConfig } from '@/lib/api';
import { CACHE_TTL } from '@/lib/apiCache';
import { bookingDetailPath, customerRoutes, appPush } from '@/lib/routes';
import { useBookingCopy } from '@/lib/schedule-copy';
import { useAuth } from '@/context/AuthContext';
import type { Booking } from '@/types/api';
import { CUSTOMER_LIST_PERF } from '@/lib/listConfig';
import { colors, fonts, headerTopPad, spacing, surfaces } from '@/constants/theme';

type FilterKey = 'active' | 'completed' | 'cancelled';

function sortBookings(list: Booking[], filter: FilterKey): Booking[] {
  return [...list].sort((a, b) => {
    const da = a.schedule?.date ?? a.createdAt ?? '';
    const db = b.schedule?.date ?? b.createdAt ?? '';
    if (filter === 'active') return da.localeCompare(db);
    return db.localeCompare(da);
  });
}

export default function MyBookingsScreen() {
  const insets = useSafeAreaInsets();
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

  const nextActive = useMemo(() => {
    const active = bookings.filter((b) => !['completed', 'cancelled'].includes(b.status));
    if (active.length === 0) return null;
    return sortBookings(active, 'active')[0] ?? null;
  }, [bookings]);

  const listData = useMemo(() => {
    if (filter === 'active' && nextActive) {
      return filtered.filter((b) => b.id !== nextActive.id);
    }
    return filtered;
  }, [filtered, filter, nextActive]);

  const total = counts.active + counts.completed + counts.cancelled;
  const subtitle = loading ? 'Loading your visits…' : `${counts.active} active · ${total} total`;

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
    <HeroDarkSlice
      style={styles.hero}
      contentStyle={{ paddingTop: headerTopPad(insets.top), paddingHorizontal: 20, paddingBottom: 36 }}
      sliceHeight={24}
    >
      <View style={styles.heroRow}>
        <View style={styles.heroLeft}>
          <View style={styles.eyebrowRow}>
            <LinearGradient
              colors={['#8FD03C', '#68D03C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.eyebrowBar}
            />
            <Text style={styles.eyebrow}>YOUR VISITS</Text>
          </View>
          <Text style={styles.heroTitle}>{bookingCopy.listScreenTitle}</Text>
          <Text style={styles.heroSub}>{subtitle}</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.bookBtn, pressed && styles.pressedSm]}
          onPress={() => appPush(customerRoutes.services)}
          accessibilityLabel="Book a service"
        >
          <PremiumIcon icon={AppIcons.ui.plus} variant="plain" size={20} color="#043813" strokeWidth={2.5} />
        </Pressable>
      </View>
    </HeroDarkSlice>
  );

  const listHeader =
    bookings.length > 0 ? (
      <View style={styles.headerBlock}>
        {hero}
        <View style={styles.summaryWrap}>
          <BookingsSummaryBar
            active={counts.active}
            completed={counts.completed}
            cancelled={counts.cancelled}
            selected={filter}
            onSelect={setFilter}
          />
        </View>
        {filter === 'active' && nextActive ? (
          <BookingsNextHighlight
            booking={nextActive}
            onPress={() => appPush(bookingDetailPath(user?.role, nextActive.id))}
          />
        ) : (
          <View style={styles.sectionPad}>
            <View style={styles.kickerRow}>
              <LinearGradient
                colors={['#8FD03C', '#27A747']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.eyebrowBar}
              />
              <Text style={styles.kickerText}>
                {filter === 'completed' ? 'COMPLETED' : filter === 'cancelled' ? 'CANCELLED' : 'ALL ACTIVE'}
              </Text>
            </View>
          </View>
        )}
      </View>
    ) : (
      <View>{hero}</View>
    );

  return (
    <View style={styles.root}>
      <GlassBackdrop />
      <SafeAreaView style={styles.safe} edges={['left', 'right']}>
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
          data={listData}
          keyExtractor={(b) => b.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.green} />
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
  root: { flex: 1, backgroundColor: surfaces.glassScreenBase },
  safe: { flex: 1, backgroundColor: 'transparent' },
  flex: { flex: 1 },
  listContent: { paddingBottom: TAB_BAR_SCROLL_PAD + 8, flexGrow: 1 },
  listEmptyGrow: { flexGrow: 1 },
  loadingBody: { flex: 1, justifyContent: 'center', paddingTop: 24 },
  pressedSm: { transform: [{ scale: 0.94 }], opacity: 0.92 },

  hero: {
    overflow: 'hidden',
  },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroLeft: { flex: 1, paddingRight: 12 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyebrowBar: { width: 16, height: 3, borderRadius: 2 },
  eyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 2.2,
    color: 'rgba(255,255,255,0.8)',
  },
  heroTitle: {
    marginTop: 8,
    fontFamily: fonts.displayExtra,
    fontSize: 30,
    lineHeight: 33,
    letterSpacing: -0.6,
    color: '#FFFFFF',
  },
  heroSub: {
    marginTop: 6,
    fontFamily: fonts.body,
    fontSize: 13,
    color: 'rgba(255,255,255,0.68)',
  },
  bookBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#8FD03C',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#043813',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },

  headerBlock: { marginBottom: 4 },
  summaryWrap: { marginTop: -18, zIndex: 4 },
  sectionPad: { paddingHorizontal: 20, marginTop: 8, marginBottom: 4 },
  kickerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  kickerText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1.5,
    color: '#7A9A7E',
  },
  cardPad: { paddingHorizontal: spacing.md },
});
