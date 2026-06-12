import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { Plus } from 'lucide-react-native';
import { BookingListCard } from '@/components/kit/BookingListCard';
import { BookingsEmpty } from '@/components/kit/BookingsEmpty';
import { BookingsNextHighlight } from '@/components/kit/BookingsNextHighlight';
import { BookingsSummaryBar } from '@/components/kit/BookingsSummaryBar';
import { CustomerListShell, listShellStyles } from '@/components/kit/CustomerListShell';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { api, getApiErrorMessage, safeAsync, screenLoadConfig } from '@/lib/api';
import { bookingDetailPath } from '@/lib/routes';
import { useBookingCopy } from '@/lib/schedule-copy';
import { useAuth } from '@/context/AuthContext';
import type { Booking } from '@/types/api';
import { CUSTOMER_LIST_PERF } from '@/lib/listConfig';
import { colors, spacing } from '@/constants/theme';

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
  const { user } = useAuth();
  const bookingCopy = useBookingCopy();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<FilterKey>('active');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    const { data } = await api.get<{ bookings: Booking[] }>('/bookings', screenLoadConfig);
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
  const subtitle = loading ? undefined : `${total} booking${total === 1 ? '' : 's'}`;

  const bookFab = (
    <Pressable style={styles.fab} onPress={() => router.push('/(customer)/services')} hitSlop={8}>
      <Plus size={20} color={colors.white} strokeWidth={2.5} />
    </Pressable>
  );

  return (
    <CustomerListShell title={bookingCopy.listScreenTitle} subtitle={subtitle} showBack={false} rightAction={bookFab}>
      {loading ? (
        <Spinner />
      ) : loadError && bookings.length === 0 ? (
        <ListEmptyRetry message={loadError} onRetry={() => safeAsync(load)} />
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(b) => b.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                try {
                  await load();
                } finally {
                  setRefreshing(false);
                }
              }}
              tintColor={colors.green}
            />
          }
          contentContainerStyle={listData.length === 0 && !nextActive ? listShellStyles.empty : listShellStyles.list}
          ListHeaderComponent={
            bookings.length > 0 ? (
              <View style={styles.header}>
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
                    onPress={() => router.push(bookingDetailPath(user?.role, nextActive.id) as never)}
                  />
                ) : null}
              </View>
            ) : null
          }
          ListEmptyComponent={
            bookings.length === 0 || (listData.length === 0 && !(filter === 'active' && nextActive)) ? (
              <BookingsEmpty filter={filter} />
            ) : null
          }
          {...CUSTOMER_LIST_PERF}
          renderItem={({ item }) => (
            <BookingListCard
              booking={item}
              onPress={() => router.push(bookingDetailPath(user?.role, item.id) as never)}
            />
          )}
        />
      )}
    </CustomerListShell>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: spacing.xs },
  fab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
