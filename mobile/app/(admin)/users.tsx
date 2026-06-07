import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { AdminListShell, adminListShellStyles } from '@/components/kit/AdminListShell';
import { AdminAddButton } from '@/components/kit/AdminAddButton';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { api, screenLoadConfig } from '@/lib/api';
import { ADMIN_LIST_PERF } from '@/lib/listConfig';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { useScreenLoad } from '@/lib/useScreenLoad';
import type { User, UserRole } from '@/types/api';
import { colors, fonts, spacing } from '@/constants/theme';
import { Input } from '@/components/ui/Input';

type RoleFilter = 'all' | UserRole;

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

export default function AdminUsersScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [filter, setFilter] = useState<RoleFilter>('all');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const { loading, error, refreshing, runLoad, reload, refresh } = useScreenLoad();

  const load = useCallback(async () => {
    const params: Record<string, string> = {};
    if (filter !== 'all') params.role = filter;
    const { data } = await api.get<{ users: User[] }>('/admin/users', { ...screenLoadConfig, params });
    setUsers(data.users);
  }, [filter]);

  const focusedOnce = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!focusedOnce.current) {
        focusedOnce.current = true;
        void runLoad(load, 'Could not load users');
        return;
      }
      void refresh(load);
    }, [load, runLoad, refresh]),
  );

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

  const header = useMemo(
    () => (
      <View style={styles.header}>
        <View style={styles.chips}>
          {(['all', 'customer', 'technician', 'admin'] as const).map((key) => (
            <Chip
              key={key}
              label={key === 'all' ? 'All' : ROLE_LABEL[key]}
              selected={filter === key}
              onPress={() => setFilter(key)}
            />
          ))}
        </View>
        <Input label="Search" value={search} onChangeText={setSearch} placeholder="Name, email, or phone" />
      </View>
    ),
    [filter, search],
  );

  if (loading) return <Spinner fullScreen />;

  if (error) {
    return (
      <AdminListShell title="Users & roles" subtitle="Error">
        <ListEmptyRetry message={error} onRetry={() => void reload(load, error)} />
      </AdminListShell>
    );
  }

  const addBtn = <AdminAddButton onPress={() => router.push('/(admin)/user-edit')} />;

  return (
    <AdminListShell title="Users & roles" subtitle="Customers, technicians, admins" rightAction={addBtn}>
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
        renderItem={({ item }) => (
          <Card
            variant="premium"
            onPress={() => router.push({ pathname: '/(admin)/user-edit', params: { id: item.id } })}
            style={styles.card}
          >
            <View style={styles.row}>
              <View style={styles.flex}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.meta}>{item.email}</Text>
                {item.phone ? <Text style={styles.meta}>{item.phone}</Text> : null}
              </View>
              <View style={styles.badges}>
                <StatusBadge label={ROLE_LABEL[item.role]} tone={ROLE_TONE[item.role]} />
                {item.disabled ? <StatusBadge label="Disabled" tone="danger" /> : null}
                {item.protected ? <StatusBadge label="Primary" tone="neutral" /> : null}
              </View>
            </View>
          </Card>
        )}
      />
    </AdminListShell>
  );
}

const styles = StyleSheet.create({
  header: { paddingBottom: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.sm, paddingHorizontal: spacing.md },
  card: { padding: spacing.md, marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  flex: { flex: 1, minWidth: 0 },
  name: { fontFamily: fonts.display, fontSize: 14, color: colors.ink },
  meta: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 2 },
  badges: { alignItems: 'flex-end', gap: 4 },
});
