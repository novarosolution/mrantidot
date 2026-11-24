import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TableText, TableTwoLine, type AdminTableColumn } from '@/components/admin/AdminDataTable';
import { FilterButton, FilterRow } from '@/components/admin/AdminFilterBar';
import { AdminPagedList, useAdminPagedList } from '@/components/admin/AdminPagedList';
import { AdminActionSheet, type ActionSheetOption } from '@/components/kit/AdminActionSheet';
import { AdminAddButton } from '@/components/kit/AdminAddButton';
import { AdminListShell } from '@/components/kit/AdminListShell';
import { AdminFilterChips, AdminSearchField, AdminStatStrip } from '@/components/kit/AdminPageKit';
import { formatDayKey, initials } from '@/components/kit/format';
import { PressableScale } from '@/components/ui/PressableScale';
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge';
import { colors, fonts, premium, spacing, ui } from '@/constants/theme';
import { api, screenLoadConfig } from '@/lib/api';
import { CACHE_TTL } from '@/lib/apiCache';
import { adminRoutes, appPush } from '@/lib/routes';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { useStaleFocusRefresh } from '@/lib/useStaleFocusRefresh';
import { useWideWebLayout } from '@/lib/webAdmin';
import type { AdminUserRow, AdminUsersPage, ListSort } from '@/types/adminLists';
import type { UserRole } from '@/types/api';

type RoleFilter = 'all' | UserRole;
type StatusFilter = '' | 'active' | 'disabled';

const ROLE_LABEL: Record<UserRole, string> = {
  customer: 'Customer',
  technician: 'Technician',
  admin: 'Admin',
};

const ROLE_TONE: Record<UserRole, BadgeTone> = {
  customer: 'success',
  technician: 'info',
  admin: 'gold',
};

const ROLE_CHIPS: { key: RoleFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'customer', label: 'Customers' },
  { key: 'technician', label: 'Technicians' },
  { key: 'admin', label: 'Admins' },
];

const SORTS: { key: string; label: string; sort: ListSort }[] = [
  { key: 'name', label: 'Name A–Z', sort: { key: 'name', order: 'asc' } },
  { key: 'created', label: 'Newest first', sort: { key: 'created', order: 'desc' } },
  { key: 'role', label: 'Role', sort: { key: 'role', order: 'asc' } },
];

function editUser(id: string) {
  appPush({ pathname: adminRoutes.userEdit, params: { id, returnTo: adminRoutes.users } });
}

export default function AdminUsersScreen() {
  const wide = useWideWebLayout();
  const [role, setRole] = useState<RoleFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [sort, setSort] = useState<ListSort>({ key: 'name', order: 'asc' });
  const [sheet, setSheet] = useState<null | 'status' | 'sort'>(null);

  const query = useMemo(
    () => ({
      role: role === 'all' ? undefined : role,
      status: status || undefined,
      q: debouncedSearch.trim() || undefined,
      sort: sort.key,
      order: sort.order,
    }),
    [role, status, debouncedSearch, sort],
  );

  const fetchPage = useCallback(
    async (page: number, limit: number, opts: { skipCache: boolean }) => {
      const { data } = await api.get<AdminUsersPage>('/admin/users', {
        ...screenLoadConfig,
        params: { ...query, page, limit },
        ...(opts.skipCache ? { skipCache: true } : { cacheTtlMs: CACHE_TTL.adminLists }),
      });
      return { items: data.users, meta: data, extra: data.counts };
    },
    [query],
  );

  const list = useAdminPagedList<AdminUserRow, AdminUsersPage['counts']>({
    fetchPage,
    deps: [query],
    keyOf: (u) => u.id,
    errorMessage: 'Could not load users',
  });

  useStaleFocusRefresh(() => list.refresh(), 15_000);
  const counts = list.extra;

  const columns = useMemo<AdminTableColumn<AdminUserRow>[]>(
    () => [
      {
        key: 'name',
        title: 'Name',
        flex: 1.5,
        minWidth: 200,
        sortable: true,
        defaultOrder: 'asc',
        render: (u) => (
          <View style={styles.personCell}>
            <View style={styles.avatarSm}>
              <Text style={styles.initialsSm}>{initials(u.name)}</Text>
            </View>
            <TableTwoLine title={u.name} sub={u.email} />
          </View>
        ),
      },
      { key: 'phone', title: 'Phone', width: 136, render: (u) => <TableText>{u.phone || '—'}</TableText> },
      {
        key: 'role',
        title: 'Role',
        width: 132,
        sortable: true,
        defaultOrder: 'asc',
        render: (u) => <StatusBadge label={ROLE_LABEL[u.role]} tone={ROLE_TONE[u.role]} />,
      },
      {
        key: 'access',
        title: 'Access',
        width: 150,
        render: (u) => (
          <View style={styles.badgesRow}>
            <StatusBadge label={u.disabled ? 'Disabled' : 'Active'} tone={u.disabled ? 'danger' : 'success'} />
            {u.protected ? <StatusBadge label="Primary" tone="neutral" /> : null}
          </View>
        ),
      },
      { key: 'city', title: 'City', width: 120, render: (u) => <TableText muted>{u.city || '—'}</TableText> },
      {
        key: 'created',
        title: 'Joined',
        width: 116,
        sortable: true,
        render: (u) => <TableText muted>{u.createdAt ? formatDayKey(u.createdAt.slice(0, 10)) : '—'}</TableText>,
      },
    ],
    [],
  );

  const statusOptions: ActionSheetOption[] = [
    { key: 'any', label: 'Active and disabled', onPress: () => setStatus('') },
    { key: 'active', label: 'Active only', onPress: () => setStatus('active') },
    { key: 'disabled', label: 'Disabled only', onPress: () => setStatus('disabled') },
  ];
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
            { label: 'Customers', value: counts.customer },
            { label: 'Techs', value: counts.technician },
            { label: 'Admins', value: counts.admin },
          ]}
        />
      ) : null}
      <AdminSearchField value={search} onChangeText={setSearch} placeholder="Search name, email, phone, city" />
      <AdminFilterChips
        chips={ROLE_CHIPS.map((c) => ({ key: c.key, label: counts ? `${c.label} ${counts[c.key]}` : c.label }))}
        selected={role}
        onSelect={(key) => setRole(key as RoleFilter)}
      />
      <FilterRow>
        <FilterButton
          label="Access"
          value={status === 'active' ? 'Active' : status === 'disabled' ? 'Disabled' : null}
          onPress={() => setSheet('status')}
          onClear={() => setStatus('')}
        />
        {!wide ? <FilterButton label="Sort" value={sortLabel} onPress={() => setSheet('sort')} /> : null}
      </FilterRow>
    </View>
  );

  const addBtn = (
    <AdminAddButton label="Add user" onPress={() => appPush({ pathname: adminRoutes.userEdit, params: { returnTo: adminRoutes.users } })} />
  );

  return (
    <AdminListShell
      title="Users & roles"
      subtitle={counts ? `${counts.all} accounts · roles & access` : 'Accounts · roles & access'}
      rightAction={addBtn}
      backFallback={adminRoutes.team}
    >
      <AdminPagedList
        list={list}
        columns={columns}
        keyExtractor={(u) => u.id}
        header={header}
        sort={sort}
        onSortChange={setSort}
        onRowPress={(u) => editUser(u.id)}
        rowLabel={(u) => `${u.name}, ${ROLE_LABEL[u.role]}${u.disabled ? ', disabled' : ''}. Edit user`}
        noun="users"
        emptyTitle="No users match"
        emptyMessage="Try another role, filter or search"
        skeletonVariant="person"
        renderCard={(item) => (
          <PressableScale
            containerStyle={styles.cardWrap}
            style={styles.card}
            scaleTo={0.98}
            onPress={() => editUser(item.id)}
            accessibilityRole="button"
            accessibilityLabel={`${item.name}, ${ROLE_LABEL[item.role]}${item.disabled ? ', disabled' : ''}. Edit user`}
          >
            <View style={styles.row}>
              <View style={styles.avatar}>
                <Text style={styles.initials}>{initials(item.name)}</Text>
              </View>
              <View style={styles.flex}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.meta} numberOfLines={1}>
                  {item.email}
                </Text>
                {item.phone ? (
                  <Text style={styles.meta} numberOfLines={1}>
                    {item.phone}
                  </Text>
                ) : null}
              </View>
              <View style={styles.badges}>
                <StatusBadge label={ROLE_LABEL[item.role]} tone={ROLE_TONE[item.role]} />
                {item.disabled ? <StatusBadge label="Disabled" tone="danger" /> : null}
                {item.protected ? <StatusBadge label="Primary" tone="neutral" /> : null}
              </View>
            </View>
          </PressableScale>
        )}
      />
      <AdminActionSheet visible={sheet === 'status'} title="Account access" options={statusOptions} onClose={() => setSheet(null)} />
      <AdminActionSheet visible={sheet === 'sort'} title="Sort users" options={sortOptions} onClose={() => setSheet(null)} />
    </AdminListShell>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: spacing.xs },
  personCell: { flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 0, maxWidth: '100%' },
  avatarSm: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsSm: { fontFamily: fonts.displayExtra, fontSize: 12, color: colors.forest },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  cardWrap: { marginBottom: spacing.sm },
  card: {
    padding: spacing.md,
    borderRadius: premium.radiusCard,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    ...ui.shadow,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { fontFamily: fonts.displayExtra, fontSize: 14, color: colors.forest },
  flex: { flex: 1, minWidth: 0 },
  name: { fontFamily: fonts.display, fontSize: 14, color: ui.text },
  meta: { fontFamily: fonts.body, fontSize: 12, color: ui.textSecondary, marginTop: 2 },
  badges: { alignItems: 'flex-end', gap: 4 },
});
