import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { AdminListShell, adminListShellStyles } from '@/components/kit/AdminListShell';
import { AdminAddButton } from '@/components/kit/AdminAddButton';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { formatRupee } from '@/components/kit/format';
import { api, screenLoadConfig } from '@/lib/api';
import { ADMIN_LIST_PERF } from '@/lib/listConfig';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { useScreenLoad } from '@/lib/useScreenLoad';
import { isAccountDisabled } from '@/lib/user-helpers';
import type { AdminCustomer, AdminCustomersResponse } from '@/types/api';
import { colors, fonts, spacing } from '@/constants/theme';

type CustomerFilter = 'all' | 'active' | 'disabled' | 'vip';

function customerBadge(c: AdminCustomer): { label: string; tone: BadgeTone } {
  if (isAccountDisabled(c)) return { label: 'Disabled', tone: 'danger' };
  if (c.statusTag === 'vip') return { label: 'VIP', tone: 'gold' };
  if (c.statusTag === 'inactive') return { label: 'Inactive', tone: 'neutral' };
  return { label: 'Active', tone: 'success' };
}

export default function AdminCustomersScreen() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [summary, setSummary] = useState({ total: 0, new: 0, vip: 0 });
  const [search, setSearch] = useState('');
  const [listFilter, setListFilter] = useState<CustomerFilter>('all');
  const debouncedSearch = useDebouncedValue(search, 300);
  const { loading, error, refreshing, runLoad, reload, refresh } = useScreenLoad();

  const load = useCallback(async () => {
    const { data } = await api.get<AdminCustomersResponse>('/admin/customers', screenLoadConfig);
    setCustomers(data.customers);
    setSummary(data.summary);
  }, []);

  useEffect(() => {
    void runLoad(load, 'Could not load customers');
  }, [load, runLoad]);

  const visibleCustomers = useMemo(() => {
    let list = customers;
    if (listFilter === 'vip') list = list.filter((c) => c.statusTag === 'vip');
    else if (listFilter === 'active') list = list.filter((c) => !isAccountDisabled(c) && c.statusTag !== 'inactive');
    else if (listFilter === 'disabled') list = list.filter((c) => isAccountDisabled(c));

    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone ?? '').includes(q) ||
        (c.city ?? '').toLowerCase().includes(q),
    );
  }, [customers, debouncedSearch, listFilter]);

  const summaryHeader = (
    <View>
      <View style={styles.summary}>
        <Card variant="premium" style={styles.sumCard}>
          <Text style={styles.sumVal}>{summary.total}</Text>
          <Text style={styles.sumLabel}>Total</Text>
        </Card>
        <Card variant="premium" style={styles.sumCard}>
          <Text style={styles.sumVal}>{summary.new}</Text>
          <Text style={styles.sumLabel}>New</Text>
        </Card>
        <Card variant="premium" style={styles.sumCard}>
          <Text style={styles.sumVal}>{summary.vip}</Text>
          <Text style={styles.sumLabel}>VIP</Text>
        </Card>
      </View>
      <View style={styles.searchWrap}>
        <Input label="Search" value={search} onChangeText={setSearch} placeholder="Name, phone, email, city" />
      </View>
      <View style={styles.chips}>
        {(['all', 'active', 'vip', 'disabled'] as const).map((key) => (
          <Chip key={key} label={key.charAt(0).toUpperCase() + key.slice(1)} selected={listFilter === key} onPress={() => setListFilter(key)} />
        ))}
      </View>
    </View>
  );

  if (loading) return <Spinner fullScreen />;

  if (error) {
    return (
      <AdminListShell title="Customers" subtitle="Error">
        <ListEmptyRetry message={error} onRetry={() => void reload(load, error)} />
      </AdminListShell>
    );
  }

  const addBtn = (
    <AdminAddButton onPress={() => router.push({ pathname: '/(admin)/user-edit', params: { role: 'customer' } })} />
  );

  return (
    <AdminListShell title="Customers" subtitle={`${summary.total} registered`} rightAction={addBtn} headerExtra={summaryHeader}>
      <FlatList
        data={visibleCustomers}
        keyExtractor={(c) => c.id}
        {...ADMIN_LIST_PERF}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh(load)} tintColor={colors.green} />}
        contentContainerStyle={visibleCustomers.length === 0 ? adminListShellStyles.empty : adminListShellStyles.list}
        ListEmptyComponent={<EmptyState title="No customers" message="Try another filter or add a customer" />}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/(admin)/customer/${item.id}`)}>
            <Card variant="premium" style={{ ...styles.card, ...(isAccountDisabled(item) ? styles.cardDisabled : {}) }}>
              <View style={styles.avatar}>
                <Text style={styles.initial}>
                  {item.name.split(' ').map((w) => w[0]).join('').slice(0, 2)}
                </Text>
              </View>
              <View style={styles.flex}>
                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.meta}>
                  {[item.city, `${item.bookingCount} bookings`].filter(Boolean).join(' · ')}
                </Text>
              </View>
              <View style={styles.right}>
                <Text style={styles.spend}>{formatRupee(item.totalSpend)}</Text>
                {(() => {
                  const badge = customerBadge(item);
                  return <StatusBadge label={badge.label} tone={badge.tone} />;
                })()}
              </View>
            </Card>
          </Pressable>
        )}
      />
    </AdminListShell>
  );
}

const styles = StyleSheet.create({
  summary: { flexDirection: 'row', gap: 10, paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  sumCard: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  sumVal: { fontFamily: fonts.displayExtra, fontSize: 18, color: colors.green },
  sumLabel: { fontFamily: fonts.body, fontSize: 10, color: colors.muted, marginTop: 2 },
  searchWrap: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.sm, padding: 13 },
  cardDisabled: { opacity: 0.65 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: { fontFamily: fonts.displayExtra, fontSize: 12, color: colors.green },
  flex: { flex: 1 },
  name: { fontFamily: fonts.display, fontSize: 13.5, color: colors.ink },
  meta: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: 6 },
  spend: { fontFamily: fonts.displayExtra, fontSize: 13 },
});
