import { useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { CalendarDays, Mail, MapPin, Phone, Pencil, Wallet } from 'lucide-react-native';
import { BookingListCard } from '@/components/kit/BookingListCard';
import { AdminListShell, AdminSectionTitle, adminListShellStyles } from '@/components/kit/AdminListShell';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { api, screenLoadConfig } from '@/lib/api';
import { ADMIN_LIST_PERF } from '@/lib/listConfig';
import { adminRoutes, appPush } from '@/lib/routes';
import { paramString } from '@/lib/routeParams';
import { useScreenLoad } from '@/lib/useScreenLoad';
import { isAccountDisabled } from '@/lib/user-helpers';
import type { Booking, User } from '@/types/api';
import { colors, fonts, premium, spacing, surfaces } from '@/constants/theme';

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
      <AdminListShell title="Customer" subtitle="Error" backFallback={adminRoutes.customers}>
        <ListEmptyRetry message={error ?? 'Customer not found'} onRetry={() => void reload(load, error ?? undefined)} />
      </AdminListShell>
    );
  }

  const isDisabled = isAccountDisabled(customer);
  const returnTo = adminRoutes.customer(customer.id);

  const summary = (
    <View style={styles.summaryWrap}>
      <LinearGradient colors={['#FFFFFF', '#F7FAF6']} style={styles.profileCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <LinearGradient colors={['#D4A017', '#B6841C']} style={styles.goldBar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
        <View style={styles.statusRow}>
          <Text style={[styles.statusBadge, isDisabled && styles.statusDisabled]}>
            {isDisabled ? 'Account disabled' : 'Active account'}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Wallet size={16} color={colors.forest} strokeWidth={2.2} />
            <Text style={styles.statValue}>₹{totalSpend}</Text>
            <Text style={styles.statLabel}>Total spend</Text>
          </View>
          <View style={styles.statCard}>
            <CalendarDays size={16} color={colors.forest} strokeWidth={2.2} />
            <Text style={styles.statValue}>{bookings.length}</Text>
            <Text style={styles.statLabel}>Bookings</Text>
          </View>
        </View>

        <View style={styles.metaList}>
          <View style={styles.metaRow}>
            <Mail size={14} color={colors.muted} />
            <Text style={styles.metaText}>{customer.email}</Text>
          </View>
          {customer.phone ? (
            <View style={styles.metaRow}>
              <Phone size={14} color={colors.muted} />
              <Text style={styles.metaText}>{customer.phone}</Text>
            </View>
          ) : null}
          {customer.city ? (
            <View style={styles.metaRow}>
              <MapPin size={14} color={colors.muted} />
              <Text style={styles.metaText}>{customer.city}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.actions}>
          {customer.phone ? (
            <Pressable style={styles.actionBtn} onPress={() => void Linking.openURL(`tel:${customer.phone}`)}>
              <Phone size={15} color={colors.forest} />
              <Text style={styles.actionText}>Call</Text>
            </Pressable>
          ) : null}
          <Pressable
            style={styles.actionBtn}
            onPress={() =>
              appPush({
                pathname: adminRoutes.userEdit,
                params: { id: customer.id, returnTo },
              })
            }
          >
            <Pencil size={15} color={colors.forest} />
            <Text style={styles.actionText}>Edit</Text>
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={() => appPush(adminRoutes.bookings)}>
            <CalendarDays size={15} color={colors.forest} />
            <Text style={styles.actionText}>Bookings</Text>
          </Pressable>
        </View>
      </LinearGradient>
    </View>
  );

  return (
    <AdminListShell
      title={customer.name}
      subtitle="Customer profile"
      backFallback={adminRoutes.customers}
      headerExtra={summary}
    >
      <AdminSectionTitle title="Booking history" hint={`${bookings.length} total visits`} />
      <FlatList
        data={bookings}
        keyExtractor={(b) => b.id}
        {...ADMIN_LIST_PERF}
        contentContainerStyle={bookings.length === 0 ? adminListShellStyles.empty : adminListShellStyles.list}
        ListEmptyComponent={<EmptyState title="No bookings" message="This customer has not booked yet" />}
        renderItem={({ item }) => (
          <BookingListCard
            booking={item}
            onPress={() => appPush(adminRoutes.booking(item.id))}
            showCustomer={false}
          />
        )}
      />
    </AdminListShell>
  );
}

const styles = StyleSheet.create({
  summaryWrap: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  profileCard: {
    borderRadius: premium.radiusCard,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.07)',
    overflow: 'hidden',
  },
  goldBar: { height: 3, marginHorizontal: -spacing.md, marginTop: -spacing.md, marginBottom: spacing.sm },
  statusRow: { marginBottom: spacing.sm },
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
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  statCard: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: 14,
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.06)',
    alignItems: 'center',
    gap: 4,
  },
  statValue: { fontFamily: fonts.displayExtra, fontSize: 18, color: colors.forest },
  statLabel: { fontFamily: fonts.body, fontSize: 11, color: colors.muted },
  metaList: { gap: 8, marginBottom: spacing.sm },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: { flex: 1, fontFamily: fonts.body, fontSize: 13, color: colors.ink },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.1)',
  },
  actionText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.forest },
});
