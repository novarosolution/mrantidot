import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { AdminEntrance, AdminListShell, adminListShellStyles, useListEntrance } from '@/components/kit/AdminListShell';
import { AdminAddButton } from '@/components/kit/AdminAddButton';
import { AdminFilterChips, AdminSearchField, AdminStatStrip } from '@/components/kit/AdminPageKit';
import { AdminListSkeleton } from '@/components/kit/AdminSkeletons';
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { PressableScale } from '@/components/ui/PressableScale';
import { api, screenLoadConfig } from '@/lib/api';
import { CACHE_TTL } from '@/lib/apiCache';
import { ADMIN_LIST_PERF } from '@/lib/listConfig';
import { adminRoutes, appPush } from '@/lib/routes';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { useScreenLoad } from '@/lib/useScreenLoad';
import { useStaleFocusRefresh } from '@/lib/useStaleFocusRefresh';
import type { User, UserRole } from '@/types/api';
import { colors, fonts, premium, spacing, ui } from '@/constants/theme';

type RoleFilter = 'all' | UserRole;

const ROLE_LABEL: Record<UserRole, string> = {
  customer: 'Customer',
  technician: 'Technician',
  admin: 'Admin',
};

const ROLE_TONE: Record<UserRole, BadgeTone> = {
  customer: 'success',
  technician: 'success',
  admin: 'success',
};

export default function AdminUsersScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [filter, setFilter] = useState<RoleFilter>('all');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const { loading, error, refreshing, runLoad, reload, refresh } = useScreenLoad();
  const entrance = useListEntrance(!loading);

  const load = useCallback(async () => {
    const params: Record<string, string> = {};
    if (filter !== 'all') params.role = filter;
    const { data } = await api.get<{ users: User[] }>('/admin/users', {
      ...screenLoadConfig,
      params,
      cacheTtlMs: CACHE_TTL.adminLists,
    });
    setUsers(data.users);
  }, [filter]);

  useEffect(() => {
    void runLoad(load, 'Could not load users');
  }, [load, runLoad]);

  useStaleFocusRefresh(() => refresh(async () => {
    const params: Record<string, string> = {};
    if (filter !== 'all') params.role = filter;
    const { data } = await api.get<{ users: User[] }>('/admin/users', {
      ...screenLoadConfig,
      params,
      skipCache: true,
    });
    setUsers(data.users);
  }), 45_000);

  const visible = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone ?? '').includes(q),
    );
  }, [users, debouncedSearch]);

  const roleCounts = useMemo(() => {
    let customer = 0, technician = 0, admin = 0;
    for (const u of users) {
      if (u.role === 'customer') customer += 1;
      else if (u.role === 'technician') technician += 1;
      else if (u.role === 'admin') admin += 1;
    }
    return { customer, technician, admin, total: users.length };
  }, [users]);

  const header = useMemo(
    () => (
      <FadeSlideIn slideFrom={14}>
        <View style={styles.header}>
          <AdminStatStrip
            flush
            items={
              filter === 'all'
                ? [
                    { label: 'Total', value: roleCounts.total },
                    { label: 'Customers', value: roleCounts.customer },
                    { label: 'Techs', value: roleCounts.technician },
                    { label: 'Admins', value: roleCounts.admin },
                  ]
                : [{ label: 'Showing', value: users.length, color: colors.forest }]
            }
          />
          <AdminFilterChips
            chips={[
              { key: 'all', label: 'All' },
              { key: 'customer', label: 'Customers' },
              { key: 'technician', label: 'Technicians' },
              { key: 'admin', label: 'Admins' },
            ]}
            selected={filter}
            onSelect={(key) => setFilter(key as RoleFilter)}
          />
          <View style={styles.search}>
            <AdminSearchField value={search} onChangeText={setSearch} placeholder="Search name, email, phone" />
          </View>
        </View>
      </FadeSlideIn>
    ),
    [filter, search, roleCounts, users.length],
  );

  if (loading) {
    return (
      <AdminListShell title="Users & roles" subtitle="Accounts · roles & access" backFallback={adminRoutes.team}>
        <AdminListSkeleton variant="person" strip chips search />
      </AdminListShell>
    );
  }

  if (error) {
    return (
      <AdminListShell title="Users & roles" subtitle="Error" backFallback={adminRoutes.team}>
        <ListEmptyRetry message={error} onRetry={() => void reload(load, error)} />
      </AdminListShell>
    );
  }

  const addBtn = (
    <AdminAddButton
      onPress={() =>
        appPush({ pathname: adminRoutes.userEdit, params: { returnTo: adminRoutes.users } })
      }
    />
  );

  return (
    <AdminListShell
      title="Users & roles"
      subtitle={`${users.length} accounts · roles & access`}
      rightAction={addBtn}
      backFallback={adminRoutes.team}
    >
      <FlatList
        data={visible}
        keyExtractor={(u) => u.id}
        {...ADMIN_LIST_PERF}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={header}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void refresh(load)} tintColor={colors.green} />
        }
        contentContainerStyle={visible.length === 0 ? adminListShellStyles.empty : adminListShellStyles.list}
        ListEmptyComponent={<EmptyState title="No users" message="Try another filter or search" />}
        renderItem={({ item, index }) => (
          <AdminEntrance index={index + 1} play={entrance(index)}>
            <PressableScale
              containerStyle={styles.cardWrap}
              style={styles.card}
              scaleTo={0.98}
              onPress={() =>
                appPush({
                  pathname: adminRoutes.userEdit,
                  params: { id: item.id, returnTo: adminRoutes.users },
                })
              }
              accessibilityRole="button"
              accessibilityLabel={`${item.name}, ${ROLE_LABEL[item.role]}${item.disabled ? ', disabled' : ''}. Edit user`}
            >
              <View style={styles.row}>
                <View style={styles.avatar}>
                  <Text style={styles.initials}>
                    {item.name
                      .split(' ')
                      .map((w) => w[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </Text>
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
          </AdminEntrance>
        )}
      />
    </AdminListShell>
  );
}

const styles = StyleSheet.create({
  header: { paddingBottom: spacing.sm },
  /** The list already pads 16pt each side — the search field lines up with the strip and chips. */
  search: { marginTop: spacing.xs },
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
