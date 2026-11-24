import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TableText, TableTwoLine, type AdminTableColumn } from '@/components/admin/AdminDataTable';
import { FilterButton, FilterRow } from '@/components/admin/AdminFilterBar';
import { AdminPagedList, useAdminPagedList } from '@/components/admin/AdminPagedList';
import { formatINR, formatIndianNumber } from '@/components/charts/chartFormat';
import { AdminActionSheet, type ActionSheetOption } from '@/components/kit/AdminActionSheet';
import { AdminAddButton } from '@/components/kit/AdminAddButton';
import { AdminListShell } from '@/components/kit/AdminListShell';
import { AdminFilterChips, AdminSearchField, AdminStatStrip } from '@/components/kit/AdminPageKit';
import { formatDayKey, formatRupee, initials } from '@/components/kit/format';
import { PressableScale } from '@/components/ui/PressableScale';
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge';
import { colors, fonts, premium, spacing, ui } from '@/constants/theme';
import { api, screenLoadConfig } from '@/lib/api';
import { CACHE_TTL } from '@/lib/apiCache';
import { adminRoutes, appPush } from '@/lib/routes';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { useStaleFocusRefresh } from '@/lib/useStaleFocusRefresh';
import { isAccountDisabled } from '@/lib/user-helpers';
import { useWideWebLayout } from '@/lib/webAdmin';
import type { AdminCustomersPage, CustomerStatusFilter, ListSort } from '@/types/adminLists';
import type { AdminCustomerRow, CustomerTagCount } from '@/types/adminManage';

type AdminCustomer = AdminCustomerRow;

const FILTERS: { key: CustomerStatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'vip', label: 'VIP' },
  { key: 'inactive', label: 'No bookings' },
  { key: 'new', label: 'New this week' },
  { key: 'disabled', label: 'Disabled' },
];

const SORTS: { key: string; label: string; sort: ListSort }[] = [
  { key: 'name', label: 'Name A–Z', sort: { key: 'name', order: 'asc' } },
  { key: 'spend', label: 'Highest spend', sort: { key: 'spend', order: 'desc' } },
  { key: 'bookings', label: 'Most bookings', sort: { key: 'bookings', order: 'desc' } },
  { key: 'last', label: 'Booked most recently', sort: { key: 'last', order: 'desc' } },
  { key: 'created', label: 'Newest accounts', sort: { key: 'created', order: 'desc' } },
];

type Extra = Pick<AdminCustomersPage, 'summary' | 'counts' | 'vipRule'>;

function customerBadge(c: AdminCustomer): { label: string; tone: BadgeTone } {
  if (isAccountDisabled(c)) return { label: 'Disabled', tone: 'danger' };
  if (c.statusTag === 'vip') return { label: 'VIP', tone: 'success' };
  if (c.statusTag === 'inactive') return { label: 'No bookings', tone: 'neutral' };
  return { label: 'Active', tone: 'success' };
}

function Avatar({ name }: { name: string }) {
  return (
    <View style={styles.avatar}>
      <Text style={styles.initial}>{initials(name)}</Text>
    </View>
  );
}

/** Up to two tags as small pills, then "+n". */
function TagPills({ tags }: { tags?: string[] }) {
  const list = tags ?? [];
  if (list.length === 0) return null;
  return (
    <View style={styles.tagRow}>
      {list.slice(0, 2).map((t) => (
        <Text key={t} style={styles.tag} numberOfLines={1}>
          {t}
        </Text>
      ))}
      {list.length > 2 ? <Text style={styles.tagMore}>+{list.length - 2}</Text> : null}
    </View>
  );
}

function vipRuleText(rule?: Extra['vipRule']): string | null {
  if (!rule) return null;
  const parts = [
    rule.vipSpend > 0 ? `spend ${formatINR(rule.vipSpend)}+` : '',
    rule.vipBookings > 0 ? `${rule.vipBookings}+ bookings` : '',
  ].filter(Boolean);
  return parts.length ? `VIP = ${parts.join(' or ')} (Business settings)` : 'VIP is switched off in Business settings';
}

export default function AdminCustomersScreen() {
  const wide = useWideWebLayout();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [status, setStatus] = useState<CustomerStatusFilter>('all');
  const [sort, setSort] = useState<ListSort>({ key: 'name', order: 'asc' });
  const [sortOpen, setSortOpen] = useState(false);
  /** Tag filter (exact tag, any case) — GET /admin/customer-tags lists the ones in use. */
  const [tag, setTag] = useState('');
  const [tagOpen, setTagOpen] = useState(false);
  const [tagCounts, setTagCounts] = useState<CustomerTagCount[]>([]);

  const loadTags = useCallback(() => {
    api
      .get<{ tags: CustomerTagCount[] }>('/admin/customer-tags', screenLoadConfig)
      .then(({ data }) => setTagCounts(data.tags))
      .catch(() => undefined);
  }, []);
  useEffect(() => loadTags(), [loadTags]);

  const query = useMemo(
    () => ({
      status: status === 'all' ? undefined : status,
      q: debouncedSearch.trim() || undefined,
      sort: sort.key,
      order: sort.order,
      tag: tag || undefined,
    }),
    [status, debouncedSearch, sort, tag],
  );

  const fetchPage = useCallback(
    async (page: number, limit: number, opts: { skipCache: boolean }) => {
      const { data } = await api.get<AdminCustomersPage>('/admin/customers', {
        ...screenLoadConfig,
        params: { ...query, page, limit },
        ...(opts.skipCache ? { skipCache: true } : { cacheTtlMs: CACHE_TTL.adminLists }),
      });
      return {
        items: data.customers,
        meta: data,
        extra: { summary: data.summary, counts: data.counts, vipRule: data.vipRule },
      };
    },
    [query],
  );

  const list = useAdminPagedList<AdminCustomer, Extra>({
    fetchPage,
    deps: [query],
    keyOf: (c) => c.id,
    errorMessage: 'Could not load customers',
  });

  useStaleFocusRefresh(() => {
    loadTags();
    return list.refresh();
  }, 3_000);

  const open = useCallback((c: AdminCustomer) => appPush(adminRoutes.customer(c.id)), []);
  const extra = list.extra;

  const columns = useMemo<AdminTableColumn<AdminCustomer>[]>(
    () => [
      {
        key: 'name',
        title: 'Customer',
        flex: 1.6,
        minWidth: 200,
        sortable: true,
        defaultOrder: 'asc',
        render: (c) => (
          <View style={styles.personCell}>
            <Avatar name={c.name} />
            <View style={styles.flex}>
              <TableTwoLine title={c.name} sub={c.email} />
              <TagPills tags={c.tags} />
            </View>
          </View>
        ),
      },
      { key: 'phone', title: 'Phone', width: 136, render: (c) => <TableText>{c.phone || '—'}</TableText> },
      { key: 'city', title: 'City', width: 118, render: (c) => <TableText muted>{c.city || '—'}</TableText> },
      {
        key: 'bookings',
        title: 'Bookings',
        width: 104,
        align: 'right',
        sortable: true,
        render: (c) => <TableText strong>{formatIndianNumber(c.bookingCount)}</TableText>,
      },
      {
        key: 'spend',
        title: 'Spend',
        width: 120,
        align: 'right',
        sortable: true,
        render: (c) => <TableText strong>{formatINR(c.totalSpend)}</TableText>,
      },
      {
        key: 'last',
        title: 'Last booking',
        width: 128,
        sortable: true,
        render: (c) => <TableText muted>{c.lastBookingAt ? formatDayKey(c.lastBookingAt.slice(0, 10)) : '—'}</TableText>,
      },
      {
        key: 'created',
        title: 'Joined',
        width: 112,
        sortable: true,
        render: (c) => <TableText muted>{c.createdAt ? formatDayKey(c.createdAt.slice(0, 10)) : '—'}</TableText>,
      },
      {
        key: 'status',
        title: 'Status',
        width: 120,
        render: (c) => {
          const badge = customerBadge(c);
          return <StatusBadge label={badge.label} tone={badge.tone} />;
        },
      },
    ],
    [],
  );

  const sortOptions: ActionSheetOption[] = SORTS.map((o) => ({
    key: o.key,
    label: o.label,
    subtitle: o.sort.key === sort.key && o.sort.order === sort.order ? 'Current' : undefined,
    onPress: () => setSort(o.sort),
  }));
  const sortLabel = SORTS.find((o) => o.sort.key === sort.key && o.sort.order === sort.order)?.label;
  const tagOptions: ActionSheetOption[] = [
    { key: '', label: 'Any tag', onPress: () => setTag('') },
    ...tagCounts.map((t) => ({
      key: t.tag,
      label: t.tag,
      subtitle: `${formatIndianNumber(t.count)} customer${t.count === 1 ? '' : 's'}${t.tag.toLowerCase() === tag.toLowerCase() ? ' · current' : ''}`,
      onPress: () => setTag(t.tag),
    })),
  ];

  const header = (
    <View style={styles.header}>
      {extra ? (
        <AdminStatStrip
          flush
          items={[
            { label: 'Customers', value: formatIndianNumber(extra.summary.total), color: colors.forest },
            { label: 'New · 7 days', value: formatIndianNumber(extra.summary.new), color: colors.green },
            { label: 'VIP', value: formatIndianNumber(extra.summary.vip), color: colors.forest },
            { label: 'Disabled', value: formatIndianNumber(extra.summary.disabled) },
          ]}
        />
      ) : null}
      <AdminSearchField value={search} onChangeText={setSearch} placeholder="Search name, phone, email, city, tag" />
      <AdminFilterChips
        chips={FILTERS.map((f) => ({
          key: f.key,
          label: extra ? `${f.label} ${formatIndianNumber(extra.counts[f.key] ?? 0)}` : f.label,
        }))}
        selected={status}
        onSelect={(k) => setStatus(k as CustomerStatusFilter)}
      />
      {tagCounts.length || tag || !wide ? (
        <FilterRow>
          {tagCounts.length || tag ? (
            <FilterButton label="Tag" value={tag || null} onPress={() => setTagOpen(true)} onClear={() => setTag('')} />
          ) : null}
          {!wide ? <FilterButton label="Sort" value={sortLabel} onPress={() => setSortOpen(true)} /> : null}
        </FilterRow>
      ) : null}
      {vipRuleText(extra?.vipRule) ? (
        <Text style={styles.hint}>{vipRuleText(extra?.vipRule)} · set a customer to always / never VIP on their profile</Text>
      ) : null}
    </View>
  );

  const addBtn = (
    <AdminAddButton
      label="Add customer"
      onPress={() =>
        appPush({
          pathname: adminRoutes.userEdit,
          params: { role: 'customer', returnTo: adminRoutes.customers },
        })
      }
    />
  );

  return (
    <AdminListShell
      title="Customers"
      subtitle={extra ? `${formatIndianNumber(extra.summary.total)} accounts · search & filter` : 'Accounts · search & filter'}
      rightAction={addBtn}
      backFallback={adminRoutes.team}
    >
      <AdminPagedList
        list={list}
        columns={columns}
        keyExtractor={(c) => c.id}
        header={header}
        sort={sort}
        onSortChange={setSort}
        onRowPress={open}
        rowLabel={(c) => `${c.name}, ${customerBadge(c).label}. Open profile`}
        noun="customers"
        emptyTitle="No customers match"
        emptyMessage={debouncedSearch || status !== 'all' || tag ? 'Try another filter or search.' : 'New sign-ups appear here.'}
        emptyActionLabel={tag ? 'Clear tag filter' : undefined}
        onEmptyAction={tag ? () => setTag('') : undefined}
        skeletonVariant="person"
        renderCard={(item) => {
          const badge = customerBadge(item);
          return (
            <PressableScale
              onPress={() => open(item)}
              containerStyle={styles.cardWrap}
              style={[styles.card, isAccountDisabled(item) && styles.cardDisabled]}
              scaleTo={0.98}
              accessibilityRole="button"
              accessibilityLabel={`${item.name}, ${badge.label}. Open profile`}
            >
              <Avatar name={item.name} />
              <View style={styles.flex}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.meta} numberOfLines={1}>
                  {[item.phone, item.city, `${item.bookingCount} bookings`].filter(Boolean).join(' · ')}
                </Text>
                <TagPills tags={item.tags} />
              </View>
              <View style={styles.right}>
                <Text style={styles.spend} numberOfLines={1}>
                  {formatRupee(item.totalSpend)}
                </Text>
                <StatusBadge label={badge.label} tone={badge.tone} />
              </View>
            </PressableScale>
          );
        }}
      />
      <AdminActionSheet visible={sortOpen} title="Sort customers" options={sortOptions} onClose={() => setSortOpen(false)} />
      <AdminActionSheet visible={tagOpen} title="Filter by tag" options={tagOptions} onClose={() => setTagOpen(false)} />
    </AdminListShell>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: spacing.xs },
  hint: { fontFamily: fonts.body, fontSize: 12, color: ui.textTertiary, marginBottom: spacing.sm },
  personCell: { flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 0, maxWidth: '100%' },
  cardWrap: { marginBottom: spacing.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: premium.radiusCard,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    ...ui.shadow,
  },
  cardDisabled: { opacity: 0.65 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: { fontFamily: fonts.displayExtra, fontSize: 12, color: colors.green },
  flex: { flex: 1, minWidth: 0 },
  name: { fontFamily: fonts.displayExtra, fontSize: 14, color: ui.text },
  meta: { fontFamily: fonts.body, fontSize: 11.5, color: ui.textSecondary, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: 6 },
  spend: { fontFamily: fonts.displayExtra, fontSize: 13, color: ui.text },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, flexWrap: 'wrap' },
  tag: {
    maxWidth: 120,
    fontFamily: fonts.bodySemi,
    fontSize: 10.5,
    color: ui.textSecondary,
    backgroundColor: ui.surfaceMuted,
    borderWidth: 1,
    borderColor: ui.border,
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 999,
    overflow: 'hidden',
  },
  tagMore: { fontFamily: fonts.bodySemi, fontSize: 10.5, color: ui.textTertiary },
});
