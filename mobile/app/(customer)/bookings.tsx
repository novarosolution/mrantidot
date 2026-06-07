import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Plus } from 'lucide-react-native';
import { BookingListCard } from '@/components/kit/BookingListCard';
import { BookingsEmpty } from '@/components/kit/BookingsEmpty';
import { BookingsNextHighlight } from '@/components/kit/BookingsNextHighlight';
import { BookingsSummaryBar } from '@/components/kit/BookingsSummaryBar';
import { CustomerListShell, listShellStyles } from '@/components/kit/CustomerListShell';
import { Chip } from '@/components/ui/Chip';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { api, getApiErrorMessage, safeAsync, screenLoadConfig } from '@/lib/api';
import { bookingDetailPath } from '@/lib/routes';
import { useAuth } from '@/context/AuthContext';
import type { Booking } from '@/types/api';
import { CUSTOMER_LIST_PERF } from '@/lib/listConfig';
import { colors, spacing } from '@/constants/theme';

export default function MyBookingsScreen() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<'active' | 'completed' | 'cancelled'>('active');
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
    return bookings.filter((b) => {
      if (filter === 'completed') return b.status === 'completed';
      if (filter === 'cancelled') return b.status === 'cancelled';
      return !['completed', 'cancelled'].includes(b.status);
    });
  }, [bookings, filter]);

  const nextActive = useMemo(() => {
    const active = bookings.filter((b) => !['completed', 'cancelled'].includes(b.status));
    if (active.length === 0) return null;
    return [...active].sort((a, b) => {
      const da = a.schedule?.date ?? '';
      const db = b.schedule?.date ?? '';
      return da.localeCompare(db);
    })[0]!;
  }, [bookings]);

  const bookFab = (
    <Pressable style={styles.fab} onPress={() => router.push('/(customer)/services')} hitSlop={8}>
      <Plus size={18} color={colors.white} strokeWidth={2.5} />
    </Pressable>
  );

  const filterChips = (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
      <Chip label={`Active (${counts.active})`} selected={filter === 'active'} onPress={() => setFilter('active')} />
      <Chip label={`Done (${counts.completed})`} selected={filter === 'completed'} onPress={() => setFilter('completed')} />
      <Chip label={`Cancelled (${counts.cancelled})`} selected={filter === 'cancelled'} onPress={() => setFilter('cancelled')} />
    </ScrollView>
  );

  return (
    <CustomerListShell title="My Bookings" showBack={false} rightAction={bookFab} headerExtra={filterChips}>
      {!loading && bookings.length > 0 ? (
        <BookingsSummaryBar
          active={counts.active}
          completed={counts.completed}
          cancelled={counts.cancelled}
          selected={filter}
          onSelect={setFilter}
        />
      ) : null}

      {loading ? (
        <Spinner />
      ) : loadError && bookings.length === 0 ? (
        <ListEmptyRetry message={loadError} onRetry={() => safeAsync(load)} />
      ) : (
        <FlatList
          data={filtered}
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
          contentContainerStyle={filtered.length === 0 ? listShellStyles.empty : listShellStyles.list}
          ListHeaderComponent={
            filter === 'active' && nextActive ? (
              <BookingsNextHighlight
                booking={nextActive}
                onPress={() => router.push(bookingDetailPath(user?.role, nextActive.id) as never)}
              />
            ) : null
          }
          ListEmptyComponent={<BookingsEmpty filter={filter} />}
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
  chips: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, paddingRight: spacing.md },
  fab: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
