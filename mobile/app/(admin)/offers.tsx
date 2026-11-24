import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Copy } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { TableText, TableTwoLine, type AdminTableColumn } from '@/components/admin/AdminDataTable';
import { FilterButton, FilterRow } from '@/components/admin/AdminFilterBar';
import { AdminPagedList, useAdminPagedList } from '@/components/admin/AdminPagedList';
import { formatINR, formatIndianNumber } from '@/components/charts/chartFormat';
import { AdminActionSheet, type ActionSheetOption } from '@/components/kit/AdminActionSheet';
import { AdminAddButton } from '@/components/kit/AdminAddButton';
import { AdminListShell } from '@/components/kit/AdminListShell';
import { AdminOfferCard } from '@/components/kit/AdminOfferCard';
import { AdminFilterChips, AdminSearchField, AdminStatStrip } from '@/components/kit/AdminPageKit';
import { formatDayKey } from '@/components/kit/format';
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge';
import { colors, fonts, spacing, ui } from '@/constants/theme';
import { api, getApiErrorMessage, screenLoadConfig } from '@/lib/api';
import { CACHE_TTL } from '@/lib/apiCache';
import { confirmAsync } from '@/lib/confirm';
import { formatTimeAgo } from '@/lib/time-ago';
import { webTitle } from '@/lib/webKeys';
import { haptic } from '@/lib/motion';
import { adminRoutes, appPush } from '@/lib/routes';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { useStaleFocusRefresh } from '@/lib/useStaleFocusRefresh';
import { useWideWebLayout } from '@/lib/webAdmin';
import type { AdminOffersPage, ListSort } from '@/types/adminLists';
import type { OfferWithStats } from '@/types/adminManage';

type Offer = OfferWithStats;

type OfferFilter = 'all' | 'active' | 'inactive' | 'expired';

const SORTS: { key: string; label: string; sort: ListSort }[] = [
  { key: 'created', label: 'Newest first', sort: { key: 'created', order: 'desc' } },
  { key: 'code', label: 'Code A–Z', sort: { key: 'code', order: 'asc' } },
  { key: 'uses', label: 'Most used', sort: { key: 'uses', order: 'desc' } },
  { key: 'expires', label: 'Expiring soonest', sort: { key: 'expires', order: 'asc' } },
  { key: 'discount', label: 'Biggest discount', sort: { key: 'discount', order: 'desc' } },
];

function isExpired(o: Offer): boolean {
  return o.expiresAt ? new Date(o.expiresAt).getTime() < Date.now() : false;
}

function offerState(o: Offer): { label: string; tone: BadgeTone } {
  if (isExpired(o)) return { label: 'Expired', tone: 'danger' };
  return o.active ? { label: 'Active', tone: 'success' } : { label: 'Off', tone: 'neutral' };
}

function discountText(o: Offer): string {
  return o.discountType === 'percent' ? `${o.discount}% off` : `${formatINR(o.discount)} off`;
}

function openOffer(o: Offer) {
  appPush({ pathname: adminRoutes.offerEdit, params: { id: o.id } });
}

export default function AdminOffersScreen() {
  const wide = useWideWebLayout();
  const [filter, setFilter] = useState<OfferFilter>('all');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [sort, setSort] = useState<ListSort>({ key: 'created', order: 'desc' });
  const [sortOpen, setSortOpen] = useState(false);

  const query = useMemo(
    () => ({
      status: filter === 'all' ? undefined : filter,
      q: debouncedSearch.trim() || undefined,
      sort: sort.key,
      order: sort.order,
    }),
    [filter, debouncedSearch, sort],
  );

  const fetchPage = useCallback(
    async (page: number, limit: number, opts: { skipCache: boolean }) => {
      const { data } = await api.get<AdminOffersPage>('/admin/offers', {
        ...screenLoadConfig,
        params: { ...query, page, limit },
        ...(opts.skipCache ? { skipCache: true } : { cacheTtlMs: CACHE_TTL.offers }),
      });
      return { items: data.offers, meta: data, extra: data.counts };
    },
    [query],
  );

  const list = useAdminPagedList<Offer, AdminOffersPage['counts']>({
    fetchPage,
    deps: [query],
    keyOf: (o) => o.id,
    errorMessage: 'Could not load offers',
  });

  useStaleFocusRefresh(() => list.refresh(), 30_000);
  const counts = list.extra;

  /** Switching off asks first (customers lose the code at checkout); switching on is instant. */
  const toggleActive = useCallback(
    async (o: Offer) => {
      const next = !o.active;
      if (!next) {
        const ok = await confirmAsync({
          title: `Turn off ${o.code}?`,
          message: 'Customers can’t apply it at checkout until you turn it back on. Bookings that already used it keep their discount.',
          confirmLabel: 'Turn off',
          cancelLabel: 'Keep on',
          destructive: true,
        });
        if (!ok) return;
      }
      list.updateItems((items) => items.map((x) => (x.id === o.id ? { ...x, active: next } : x)));
      try {
        await api.patch(`/admin/offers/${o.id}`, { active: next }, { skipErrorToast: true });
        haptic('success');
        Toast.show({
          type: next && isExpired(o) ? 'info' : 'success',
          text1: next ? `${o.code} is on` : `${o.code} is off`,
          text2: next && isExpired(o) ? 'It has expired — extend the expiry so customers can use it.' : undefined,
        });
      } catch (err) {
        list.updateItems((items) => items.map((x) => (x.id === o.id ? { ...x, active: o.active } : x)));
        haptic('error');
        Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Could not update the offer') });
      }
    },
    [list],
  );

  /** A switched-off copy with a new code — opens it to edit. */
  const duplicate = useCallback(async (o: Offer) => {
    try {
      const { data } = await api.post<{ offer: Offer }>(`/admin/offers/${o.id}/duplicate`, {}, { skipErrorToast: true });
      haptic('success');
      Toast.show({ type: 'success', text1: `Copied as ${data.offer.code}`, text2: 'It is switched off — check it, then turn it on.' });
      appPush({ pathname: adminRoutes.offerEdit, params: { id: data.offer.id } });
    } catch (err) {
      haptic('error');
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Could not copy the offer') });
    }
  }, []);

  const columns = useMemo<AdminTableColumn<Offer>[]>(
    () => [
      {
        key: 'code',
        title: 'Code',
        flex: 1.6,
        minWidth: 220,
        sortable: true,
        defaultOrder: 'asc',
        render: (o) => <TableTwoLine title={<Text style={styles.code}>{o.code}</Text>} sub={o.description} />,
      },
      {
        key: 'discount',
        title: 'Discount',
        width: 116,
        sortable: true,
        render: (o) => <TableText strong>{discountText(o)}</TableText>,
      },
      {
        key: 'min',
        title: 'Min order',
        width: 108,
        align: 'right',
        render: (o) => <TableText muted>{o.minOrderAmount ? formatINR(o.minOrderAmount) : '—'}</TableText>,
      },
      {
        key: 'uses',
        title: 'Used',
        width: 116,
        align: 'right',
        sortable: true,
        render: (o) => (
          <TableTwoLine
            title={
              <Text style={styles.used}>
                {formatIndianNumber(o.stats?.uses ?? o.useCount ?? 0)}
                {o.maxUses ? <Text style={styles.max}> / {formatIndianNumber(o.maxUses)}</Text> : null}
              </Text>
            }
            sub={o.stats?.lastUsedAt ? `Last ${formatTimeAgo(o.stats.lastUsedAt)}` : 'Not used yet'}
          />
        ),
      },
      {
        key: 'given',
        title: 'Discount given',
        width: 124,
        align: 'right',
        render: (o) => <TableText muted={!o.stats?.discountGiven}>{formatINR(o.stats?.discountGiven ?? 0)}</TableText>,
      },
      {
        key: 'revenue',
        title: 'Revenue',
        width: 116,
        align: 'right',
        render: (o) => (
          <TableTwoLine
            title={formatINR(o.stats?.revenue ?? 0)}
            sub={o.stats?.completed ? `${o.stats.completed} completed` : undefined}
          />
        ),
      },
      {
        key: 'expires',
        title: 'Expires',
        width: 112,
        sortable: true,
        defaultOrder: 'asc',
        render: (o) => <TableText muted>{o.expiresAt ? formatDayKey(o.expiresAt.slice(0, 10)) : 'Never'}</TableText>,
      },
      {
        key: 'state',
        title: 'Status',
        width: 214,
        render: (o) => {
          const st = offerState(o);
          return (
            <View style={styles.stateCell}>
              <StatusBadge label={st.label} tone={st.tone} />
              <Pressable
                onPress={() => void toggleActive(o)}
                hitSlop={6}
                style={({ pressed }) => [styles.toggle, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={o.active ? `Turn off ${o.code}` : `Turn on ${o.code}`}
              >
                <Text style={styles.toggleText}>{o.active ? 'Turn off' : 'Turn on'}</Text>
              </Pressable>
              <Pressable
                ref={webTitle(`Duplicate ${o.code}`)}
                onPress={() => void duplicate(o)}
                hitSlop={6}
                style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={`Duplicate ${o.code}`}
              >
                <Copy size={14} color={colors.forest} strokeWidth={2.3} />
              </Pressable>
            </View>
          );
        },
      },
    ],
    [toggleActive, duplicate],
  );

  const sortOptions: ActionSheetOption[] = SORTS.map((o) => ({
    key: o.key,
    label: o.label,
    subtitle: o.sort.key === sort.key && o.sort.order === sort.order ? 'Current' : undefined,
    onPress: () => setSort(o.sort),
  }));
  const sortLabel = SORTS.find((o) => o.sort.key === sort.key && o.sort.order === sort.order)?.label;

  const header = (
    <View style={styles.header}>
      {counts ? (
        <AdminStatStrip
          flush
          items={[
            { label: 'Total', value: counts.all },
            { label: 'Active', value: counts.active, color: colors.forest },
            { label: 'Off', value: counts.inactive, color: colors.muted },
            { label: 'Expired', value: counts.expired, color: colors.error },
          ]}
        />
      ) : null}
      <AdminSearchField value={search} onChangeText={setSearch} placeholder="Search code or description" />
      <AdminFilterChips
        chips={[
          { key: 'all', label: counts ? `All ${counts.all}` : 'All' },
          { key: 'active', label: counts ? `Active ${counts.active}` : 'Active' },
          { key: 'inactive', label: counts ? `Off ${counts.inactive}` : 'Off' },
          { key: 'expired', label: counts ? `Expired ${counts.expired}` : 'Expired' },
        ]}
        selected={filter}
        onSelect={(key) => setFilter(key as OfferFilter)}
      />
      {!wide ? (
        <FilterRow>
          <FilterButton label="Sort" value={sortLabel} onPress={() => setSortOpen(true)} />
        </FilterRow>
      ) : null}
      <Text style={styles.hint}>Active = switched on and not past its expiry date. Usage counts bookings with the code (cancelled ones left out).</Text>
    </View>
  );

  return (
    <AdminListShell
      title="Offers & coupons"
      subtitle={counts ? `${counts.active} live · manage checkout promos` : 'Manage checkout promos'}
      rightAction={<AdminAddButton label="New offer" onPress={() => appPush(adminRoutes.offerEdit)} />}
      backFallback={adminRoutes.team}
    >
      <AdminPagedList
        list={list}
        columns={columns}
        keyExtractor={(o) => o.id}
        header={header}
        sort={sort}
        onSortChange={setSort}
        onRowPress={openOffer}
        rowLabel={(o) => `${o.code}, ${discountText(o)}, ${offerState(o).label}. Edit offer`}
        noun="offers"
        emptyTitle={filter === 'all' && !debouncedSearch ? 'No offers yet' : 'No offers match'}
        emptyMessage={
          filter === 'all' && !debouncedSearch ? 'Create a coupon customers can apply at checkout' : 'Try another filter or search'
        }
        emptyActionLabel={filter === 'all' && !debouncedSearch ? 'New offer' : undefined}
        onEmptyAction={filter === 'all' && !debouncedSearch ? () => appPush(adminRoutes.offerEdit) : undefined}
        skeletonVariant="offer"
        renderCard={(item) => (
          <AdminOfferCard
            offer={item}
            onPress={() => openOffer(item)}
            onEdit={() => openOffer(item)}
            onToggle={() => void toggleActive(item)}
          />
        )}
      />
      <AdminActionSheet visible={sortOpen} title="Sort offers" options={sortOptions} onClose={() => setSortOpen(false)} />
    </AdminListShell>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: spacing.xs },
  hint: { fontFamily: fonts.body, fontSize: 12, color: ui.textTertiary, marginBottom: spacing.sm },
  code: { fontFamily: fonts.bodyBold, fontSize: 13.5, letterSpacing: 0.6, color: ui.text },
  max: { fontFamily: fonts.body, color: ui.textTertiary },
  used: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: ui.text },
  iconBtn: {
    width: 30,
    height: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: colors.white,
  },
  stateCell: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  toggle: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: colors.white,
  },
  toggleText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.forest },
  pressed: { opacity: 0.7 },
});
