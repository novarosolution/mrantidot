import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Linking, StyleSheet, Text, View } from 'react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { BookingListCard } from '@/components/kit/BookingListCard';
import {
  AdminEntrance,
  AdminListShell,
  AdminSectionTitle,
  adminListShellStyles,
  useListEntrance,
} from '@/components/kit/AdminListShell';
import { AdminProfileSkeleton } from '@/components/kit/AdminSkeletons';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { PressableScale } from '@/components/ui/PressableScale';
import { api, screenLoadConfig } from '@/lib/api';
import { ADMIN_LIST_PERF } from '@/lib/listConfig';
import { adminRoutes, appPush } from '@/lib/routes';
import { paramString } from '@/lib/routeParams';
import { useScreenLoad } from '@/lib/useScreenLoad';
import { isAccountDisabled } from '@/lib/user-helpers';
import type { Booking } from '@/types/api';
import { colors, fonts, premium, spacing, surfaces, ui } from '@/constants/theme';
import { stagger } from '@/lib/motion';
import { useStaleFocusRefresh } from '@/lib/useStaleFocusRefresh';
import { formatRupeeFull } from '@/components/kit/format';
import { AdminCustomerAddresses } from '@/components/admin/AdminCustomerAddresses';
import { AdminCustomerNotes } from '@/components/admin/AdminCustomerNotes';
import { AdminCustomerTags } from '@/components/admin/AdminCustomerTags';
import type { AdminCustomerProfile, AdminSavedAddress, CustomerNote } from '@/types/adminManage';

type StatusTag = 'active' | 'inactive' | 'vip';

export default function AdminCustomerDetailScreen() {
  const id = paramString(useLocalSearchParams<{ id: string | string[] }>().id);
  const { loading, error, runLoad, reload } = useScreenLoad();
  const [customer, setCustomer] = useState<AdminCustomerProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [totalSpend, setTotalSpend] = useState(0);
  const [statusTag, setStatusTag] = useState<StatusTag>('inactive');
  /** Internal notes, newest first (admins only). */
  const [notes, setNotes] = useState<CustomerNote[]>([]);
  /** Saved addresses (null while loading; [] when none or they could not be loaded). */
  const [addresses, setAddresses] = useState<AdminSavedAddress[] | null>(null);
  const entrance = useListEntrance(!loading);

  const load = useCallback(async () => {
    if (!id) throw new Error('Customer not found');
    const { data } = await api.get<{ customer: AdminCustomerProfile; bookings: Booking[]; totalSpend: number; statusTag: StatusTag }>(
      `/admin/customers/${id}`,
      screenLoadConfig,
    );
    setCustomer(data.customer);
    setNotes(data.customer.adminNotes ?? []);
    setBookings(data.bookings);
    setTotalSpend(data.totalSpend);
    setStatusTag(data.statusTag);
    // Addresses are extra — a failure here never blocks the profile.
    api
      .get<{ addresses: AdminSavedAddress[] }>(`/admin/customers/${id}/addresses`, screenLoadConfig)
      .then((res) => setAddresses(res.data.addresses))
      .catch(() => setAddresses((prev) => prev ?? []));
  }, [id]);

  useEffect(() => {
    void runLoad(load, 'Could not load customer');
  }, [load, runLoad]);

  useStaleFocusRefresh(() => load().catch(() => undefined), 3_000);

  if (loading) {
    return (
      <AdminListShell title="Customer" subtitle="Customer profile" backFallback={adminRoutes.customers}>
        <AdminProfileSkeleton variant="customer" />
      </AdminListShell>
    );
  }

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
    <>
      <FadeSlideIn delay={stagger(0)} slideFrom={14}>
        <View style={styles.profileCard}>
          <View style={styles.statusRow}>
            <Text style={[styles.statusBadge, isDisabled && styles.statusDisabled]}>
              {isDisabled ? 'Account disabled' : 'Active account'}
            </Text>
            {statusTag === 'vip' ? (
              <Text style={[styles.statusBadge, styles.statusVip]}>{customer.vipOverride === 'vip' ? 'VIP · set by you' : 'VIP'}</Text>
            ) : null}
            {(customer.tags ?? []).map((t) => (
              <Text key={t} style={[styles.statusBadge, styles.statusTagChip]}>
                {t}
              </Text>
            ))}
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <PremiumIcon icon={AppIcons.ui.wallet} variant="plain" size="sm" color={colors.forest} strokeWidth={2.2} />
              <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                {formatRupeeFull(totalSpend)}
              </Text>
              <Text style={styles.statLabel}>Total spend</Text>
            </View>
            <View style={styles.statCard}>
              <PremiumIcon icon={AppIcons.ui.calendar} variant="plain" size="sm" color={colors.forest} strokeWidth={2.2} />
              <Text style={styles.statValue} numberOfLines={1}>
                {bookings.length}
              </Text>
              <Text style={styles.statLabel}>Bookings</Text>
            </View>
          </View>

          <View style={styles.metaList}>
            <View style={styles.metaRow}>
              <PremiumIcon icon={AppIcons.ui.mail} variant="plain" size="xs" color={colors.muted} />
              <Text style={styles.metaText} numberOfLines={1}>
                {customer.email}
              </Text>
            </View>
            {customer.phone ? (
              <View style={styles.metaRow}>
                <PremiumIcon icon={AppIcons.ui.phone} variant="plain" size="xs" color={colors.muted} />
                <Text style={styles.metaText} numberOfLines={1}>
                  {customer.phone}
                </Text>
              </View>
            ) : null}
            {customer.city ? (
              <View style={styles.metaRow}>
                <PremiumIcon icon={AppIcons.ui.mapPin} variant="plain" size="xs" color={colors.muted} />
                <Text style={styles.metaText} numberOfLines={1}>
                  {customer.city}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.actions}>
            {customer.phone ? (
              <PressableScale
                style={styles.actionBtn}
                onPress={() => void Linking.openURL(`tel:${customer.phone}`)}
                accessibilityRole="button"
                accessibilityLabel={`Call ${customer.name}`}
              >
                <PremiumIcon icon={AppIcons.ui.phone} variant="plain" size="sm" color={colors.forest} />
                <Text style={styles.actionText}>Call</Text>
              </PressableScale>
            ) : null}
            <PressableScale
              style={styles.actionBtn}
              onPress={() =>
                appPush({
                  pathname: adminRoutes.userEdit,
                  params: { id: customer.id, returnTo },
                })
              }
              accessibilityRole="button"
              accessibilityLabel={`Edit ${customer.name}`}
            >
              <PremiumIcon icon={AppIcons.ui.edit} variant="plain" size="sm" color={colors.forest} />
              <Text style={styles.actionText}>Edit</Text>
            </PressableScale>
            <PressableScale
              style={styles.actionBtn}
              onPress={() => appPush(adminRoutes.bookingsFiltered({ customerId: customer.id }))}
              accessibilityRole="button"
              accessibilityLabel={`Open ${customer.name}'s bookings`}
            >
              <PremiumIcon icon={AppIcons.ui.calendar} variant="plain" size="sm" color={colors.forest} />
              <Text style={styles.actionText}>Bookings</Text>
            </PressableScale>
            {!isDisabled ? (
              <PressableScale
                style={[styles.actionBtn, styles.actionPrimary]}
                onPress={() => appPush(adminRoutes.bookingCreateFor(customer.id))}
                accessibilityRole="button"
                accessibilityLabel={`Book a visit for ${customer.name}`}
              >
                <PremiumIcon icon={AppIcons.ui.plus} variant="plain" size="sm" color={colors.white} />
                <Text style={[styles.actionText, styles.actionTextPrimary]}>Book visit</Text>
              </PressableScale>
            ) : null}
          </View>

          <AdminCustomerAddresses customerId={customer.id} customerName={customer.name} addresses={addresses} onChange={setAddresses} />
        </View>
      </FadeSlideIn>
      <FadeSlideIn delay={stagger(1)} slideFrom={14}>
        <AdminCustomerTags
          customerId={customer.id}
          tags={customer.tags ?? []}
          vipOverride={customer.vipOverride ?? null}
          statusTag={statusTag}
          onChange={(next) => {
            setCustomer((c) => (c ? { ...c, tags: next.customer.tags, vipOverride: next.customer.vipOverride } : c));
            setStatusTag(next.statusTag);
          }}
        />
        <AdminCustomerNotes customerId={customer.id} notes={notes} onChange={setNotes} />
      </FadeSlideIn>
      <FadeSlideIn delay={stagger(2)} slideFrom={14}>
        <AdminSectionTitle flush title="Booking history" hint={`${bookings.length} total visits`} />
      </FadeSlideIn>
    </>
  );

  return (
    <AdminListShell title={customer.name} subtitle="Customer profile" backFallback={adminRoutes.customers}>
      {/* Profile card scrolls with the history so long lists get the whole screen. */}
      <FlatList
        data={bookings}
        keyExtractor={(b) => b.id}
        {...ADMIN_LIST_PERF}
        ListHeaderComponent={summary}
        contentContainerStyle={[adminListShellStyles.list, bookings.length === 0 && styles.emptyGrow]}
        ListEmptyComponent={<EmptyState title="No bookings" message="This customer has not booked yet" />}
        renderItem={({ item, index }) => (
          <AdminEntrance index={index + 2} play={entrance(index)}>
            <BookingListCard
              booking={item}
              onPress={() => appPush(adminRoutes.booking(item.id))}
              showCustomer={false}
            />
          </AdminEntrance>
        )}
      />
    </AdminListShell>
  );
}

const styles = StyleSheet.create({
  emptyGrow: { flexGrow: 1 },
  profileCard: {
    borderRadius: premium.radiusCard,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: ui.hairline,
    backgroundColor: colors.white,
    ...ui.shadow,
  },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.sm },
  statusVip: { color: colors.amberInk, backgroundColor: colors.amberBg },
  statusTagChip: { color: ui.textSecondary, backgroundColor: ui.surfaceMuted },
  statusBadge: {
    alignSelf: 'flex-start',
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: colors.green,
    backgroundColor: colors.soft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  statusDisabled: { color: surfaces.tintDangerInk, backgroundColor: surfaces.tintDanger },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  statCard: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: 14,
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: ui.hairline,
    alignItems: 'center',
    gap: 4,
  },
  statValue: { fontFamily: fonts.displayExtra, fontSize: 18, color: colors.forest, maxWidth: '100%' },
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
    borderColor: ui.border,
  },
  actionText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.forest },
  actionPrimary: { backgroundColor: colors.forest, borderColor: colors.forest },
  actionTextPrimary: { color: colors.white },
});
