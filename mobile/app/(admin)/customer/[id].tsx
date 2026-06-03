import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { BookingListCard } from '@/components/kit/BookingListCard';
import { AdminListShell, adminListShellStyles } from '@/components/kit/AdminListShell';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { api, screenLoadConfig } from '@/lib/api';
import { ADMIN_LIST_PERF } from '@/lib/listConfig';
import { paramString } from '@/lib/routeParams';
import { useScreenLoad } from '@/lib/useScreenLoad';
import { isAccountDisabled } from '@/lib/user-helpers';
import type { Booking, User } from '@/types/api';
import { colors, fonts, spacing, surfaces } from '@/constants/theme';

export default function AdminCustomerDetailScreen() {
  const id = paramString(useLocalSearchParams<{ id: string | string[] }>().id);
  const { loading, error, runLoad, reload } = useScreenLoad();
  const [customer, setCustomer] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [totalSpend, setTotalSpend] = useState(0);

  const load = useCallback(async () => {
    if (!id) throw new Error('Customer not found');
    const { data } = await api.get<{ customer: User; bookings: Booking[]; totalSpend: number }>(
      `/admin/customers/${id}`,
      screenLoadConfig,
    );
    setCustomer(data.customer);
    setBookings(data.bookings);
    setTotalSpend(data.totalSpend);
  }, [id]);

  useEffect(() => {
    void runLoad(load, 'Could not load customer');
  }, [load, runLoad]);

  if (loading) return <Spinner fullScreen />;

  if (error || !customer) {
    return (
      <AdminListShell title="Customer" subtitle="Error">
        <ListEmptyRetry message={error ?? 'Customer not found'} onRetry={() => void reload(load, error ?? undefined)} />
      </AdminListShell>
    );
  }

  const isDisabled = isAccountDisabled(customer);

  const summary = (
    <View style={styles.summary}>
      <View style={styles.statusRow}>
        <Text style={[styles.statusBadge, isDisabled && styles.statusDisabled]}>
          {isDisabled ? 'Account disabled' : 'Active account'}
        </Text>
      </View>
      <Text style={styles.meta}>{customer.email}</Text>
      {customer.phone ? <Text style={styles.meta}>{customer.phone}</Text> : null}
      {customer.city ? <Text style={styles.meta}>{customer.city}</Text> : null}
      <View style={styles.statsRow}>
        <Text style={styles.stat}>₹{totalSpend} spent</Text>
        <Text style={styles.stat}>{bookings.length} bookings</Text>
      </View>
      <View style={styles.actions}>
        {customer.phone ? (
          <Pressable onPress={() => void Linking.openURL(`tel:${customer.phone}`)}>
            <Text style={styles.link}>Call</Text>
          </Pressable>
        ) : null}
        <Pressable onPress={() => router.push({ pathname: '/(admin)/user-edit', params: { id: customer.id } })}>
          <Text style={styles.link}>Edit account</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/(admin)/bookings')}>
          <Text style={styles.link}>All bookings</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <AdminListShell title={customer.name} subtitle="Customer profile" headerExtra={summary}>
      <FlatList
        data={bookings}
        keyExtractor={(b) => b.id}
        {...ADMIN_LIST_PERF}
        contentContainerStyle={bookings.length === 0 ? adminListShellStyles.empty : adminListShellStyles.list}
        ListEmptyComponent={<EmptyState title="No bookings" message="This customer has not booked yet" />}
        renderItem={({ item }) => (
          <BookingListCard booking={item} onPress={() => router.push(`/(admin)/booking/${item.id}`)} showCustomer={false} />
        )}
      />
    </AdminListShell>
  );
}

const styles = StyleSheet.create({
  summary: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  statusRow: { marginBottom: 6 },
  statusBadge: {
    alignSelf: 'flex-start',
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: colors.green,
    backgroundColor: colors.soft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusDisabled: { color: surfaces.tintDangerInk, backgroundColor: surfaces.tintDanger },
  meta: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  statsRow: { flexDirection: 'row', gap: 16, marginTop: 8 },
  stat: { fontFamily: fonts.display, fontSize: 13, color: colors.green },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 10 },
  link: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.secondaryDark },
});
