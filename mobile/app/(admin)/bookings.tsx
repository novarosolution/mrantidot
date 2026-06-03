import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { AdminBookingListCard } from '@/components/kit/AdminBookingListCard';
import { AdminListShell, adminListShellStyles } from '@/components/kit/AdminListShell';
import { AdminActionSheet, type ActionSheetOption } from '@/components/kit/AdminActionSheet';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { api, screenLoadConfig } from '@/lib/api';
import { bookingServiceName } from '@/lib/booking-helpers';
import { assignableTechnicians } from '@/lib/user-helpers';
import { ADMIN_LIST_PERF } from '@/lib/listConfig';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { useScreenLoad } from '@/lib/useScreenLoad';
import type { Booking, BookingStatusCounts, User } from '@/types/api';
import { colors, design, spacing } from '@/constants/theme';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'awaiting_verification', label: 'Verify' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
] as const;

export default function AdminBookingsScreen() {
  const { status: statusParam, serviceId: serviceIdParam } = useLocalSearchParams<{
    status?: string;
    serviceId?: string;
  }>();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [statusCounts, setStatusCounts] = useState<BookingStatusCounts | null>(null);
  const [techs, setTechs] = useState<User[]>([]);
  const initialFilter =
    statusParam && FILTERS.some((f) => f.key === statusParam) ? statusParam : 'all';
  const [filter, setFilter] = useState<string>(initialFilter);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const techsLoaded = useRef(false);
  const countsLoaded = useRef(false);
  const [assignTarget, setAssignTarget] = useState<Booking | null>(null);
  const { loading, error, refreshing, runLoad, refresh } = useScreenLoad();

  useEffect(() => {
    if (statusParam && FILTERS.some((f) => f.key === statusParam)) {
      setFilter(statusParam);
    }
  }, [statusParam]);

  const loadCounts = useCallback(async () => {
    const { data } = await api.get<BookingStatusCounts>('/bookings/status-counts', screenLoadConfig);
    setStatusCounts(data);
    countsLoaded.current = true;
  }, []);

  const load = useCallback(async () => {
    const params: Record<string, string> = {};
    if (filter !== 'all') params.status = filter;
    if (debouncedSearch.trim()) params.q = debouncedSearch.trim();
    if (serviceIdParam) params.serviceId = serviceIdParam;

    const listReq = api.get<{ bookings: Booking[] }>('/bookings', {
      ...screenLoadConfig,
      params,
    });
    const techsReq = techsLoaded.current
      ? Promise.resolve(null)
      : api.get<{ technicians: User[] }>('/admin/technicians', { ...screenLoadConfig, params: { available: 'true' } }).catch(() => null);
    const countsReq = countsLoaded.current ? Promise.resolve(null) : loadCounts().catch(() => null);

    const [listRes, techsRes] = await Promise.all([listReq, techsReq, countsReq]);
    setBookings(listRes.data.bookings);
    if (techsRes?.data) {
      setTechs(assignableTechnicians(techsRes.data.technicians));
      techsLoaded.current = true;
    }
  }, [filter, debouncedSearch, loadCounts, serviceIdParam]);

  useEffect(() => {
    void runLoad(load);
  }, [load, runLoad]);

  const focusedOnce = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!focusedOnce.current) {
        focusedOnce.current = true;
        return;
      }
      void refresh(load);
    }, [load, refresh]),
  );

  const assign = useCallback(
    (booking: Booking) => {
      if (techs.length === 0) {
        Alert.alert('No technicians', 'Add technicians in the admin panel first.');
        return;
      }
      setAssignTarget(booking);
    },
    [techs],
  );

  const assignOptions = useMemo<ActionSheetOption[]>(() => {
    if (!assignTarget) return [];
    return techs.map((t) => ({
      key: t.id,
      label: t.name,
      subtitle: t.phone || t.email || undefined,
      onPress: () => {
        void (async () => {
          try {
            await api.patch(`/bookings/${assignTarget.id}/assign`, { technicianId: t.id });
            Toast.show({ type: 'success', text1: 'Technician assigned' });
            await Promise.all([load(), loadCounts()]);
          } catch {
            // interceptor toast
          }
        })();
      },
    }));
  }, [assignTarget, techs, load, loadCounts]);

  const count = useCallback(
    (s: string) => (s === 'all' ? statusCounts?.total : statusCounts?.byStatus[s]) ?? 0,
    [statusCounts],
  );

  const openBooking = useCallback((id: string) => {
    router.push(`/(admin)/booking/${id}`);
  }, []);

  const headerExtra = useMemo(
    () => (
      <View style={styles.headerExtra}>
        <View style={styles.searchWrap}>
          <Input label="Search" value={search} onChangeText={setSearch} placeholder="Ref, customer, or service" />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {FILTERS.map((f) => {
            const n = count(f.key);
            return (
              <Chip
                key={f.key}
                label={`${f.label} (${n})`}
                selected={filter === f.key}
                onPress={() => setFilter(f.key)}
              />
            );
          })}
        </ScrollView>
      </View>
    ),
    [count, filter, search],
  );

  if (loading) return <Spinner fullScreen />;

  if (error) {
    return (
      <AdminListShell title="Bookings" showBack={false}>
        <ListEmptyRetry message={error} onRetry={() => void runLoad(load)} />
      </AdminListShell>
    );
  }

  return (
    <AdminListShell
      title="Bookings"
      subtitle={`${statusCounts?.total ?? bookings.length} total`}
      showBack={false}
      headerExtra={headerExtra}
    >
      <FlatList
        data={bookings}
        keyExtractor={(b) => b.id}
        {...ADMIN_LIST_PERF}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() =>
              void refresh(async () => {
                await Promise.all([load(), loadCounts()]);
              })
            }
            tintColor={colors.green}
          />
        }
        contentContainerStyle={bookings.length === 0 ? adminListShellStyles.empty : adminListShellStyles.list}
        ListEmptyComponent={<EmptyState title="No bookings" message="Try another filter or search" />}
        renderItem={({ item }) => (
          <AdminBookingListCard item={item} onOpen={openBooking} onAssign={assign} />
        )}
      />
      <AdminActionSheet
        visible={assignTarget !== null}
        title="Assign technician"
        message={assignTarget ? bookingServiceName(assignTarget) : undefined}
        options={assignOptions}
        onClose={() => setAssignTarget(null)}
      />
    </AdminListShell>
  );
}

const styles = StyleSheet.create({
  headerExtra: { backgroundColor: design.screenBg, borderBottomWidth: 1, borderBottomColor: colors.border },
  searchWrap: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  chips: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
