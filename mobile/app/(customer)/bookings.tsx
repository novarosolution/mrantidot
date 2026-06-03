import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { BookingListCard } from '@/components/kit/BookingListCard';
import { CustomerListShell, listShellStyles } from '@/components/kit/CustomerListShell';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
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

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      if (filter === 'completed') return b.status === 'completed';
      if (filter === 'cancelled') return b.status === 'cancelled';
      return !['completed', 'cancelled'].includes(b.status);
    });
  }, [bookings, filter]);

  const filterChips = (
    <View style={styles.chips}>
      <Chip label="Active" selected={filter === 'active'} onPress={() => setFilter('active')} />
      <Chip label="Completed" selected={filter === 'completed'} onPress={() => setFilter('completed')} />
      <Chip label="Cancelled" selected={filter === 'cancelled'} onPress={() => setFilter('cancelled')} />
    </View>
  );

  return (
    <CustomerListShell
      title="My Bookings"
      subtitle="Track and manage your services"
      showBack={false}
      headerExtra={filterChips}
    >
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
          ListEmptyComponent={
            <EmptyState
              title="No bookings yet"
              message={
                filter === 'active'
                  ? 'Book a service from the Home tab'
                  : `No ${filter} bookings`
              }
            />
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
  chips: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
});
