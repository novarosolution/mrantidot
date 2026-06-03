import { useCallback, useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { FlatList, Linking, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { AdminListShell, adminListShellStyles } from '@/components/kit/AdminListShell';
import { AdminAddButton } from '@/components/kit/AdminAddButton';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge';
import { api, screenLoadConfig } from '@/lib/api';
import { ADMIN_LIST_PERF } from '@/lib/listConfig';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { useScreenLoad } from '@/lib/useScreenLoad';
import type { AdminTechnician, User } from '@/types/api';
import { colors, fonts, spacing, surfaces } from '@/constants/theme';

function techStatus(u: User): { label: string; tone: BadgeTone } {
  if (u.disabled === true) return { label: 'Disabled', tone: 'danger' };
  if (u.available === false) return { label: 'Off duty', tone: 'warning' };
  return { label: 'Available', tone: 'success' };
}

export default function AdminTechniciansScreen() {
  const [techs, setTechs] = useState<AdminTechnician[]>([]);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const { loading, error, refreshing, runLoad, reload, refresh } = useScreenLoad();

  const load = useCallback(async () => {
    const { data } = await api.get<{ technicians: AdminTechnician[] }>('/admin/technicians', screenLoadConfig);
    setTechs(data.technicians);
  }, []);

  useEffect(() => {
    void runLoad(load, 'Could not load technicians');
  }, [load, runLoad]);

  const visibleTechnicians = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return techs;
    return techs.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.phone ?? '').includes(q) ||
        t.email.toLowerCase().includes(q) ||
        (t.city ?? '').toLowerCase().includes(q),
    );
  }, [techs, debouncedSearch]);

  if (loading) return <Spinner fullScreen />;

  if (error) {
    return (
      <AdminListShell title="Technicians" subtitle="Error">
        <ListEmptyRetry message={error} onRetry={() => void reload(load, error)} />
      </AdminListShell>
    );
  }

  const addBtn = (
    <AdminAddButton onPress={() => router.push({ pathname: '/(admin)/user-edit', params: { role: 'technician' } })} />
  );

  return (
    <AdminListShell title="Technicians" subtitle={`${techs.length} on the team`} rightAction={addBtn}>
      <View style={styles.searchWrap}>
        <Input label="Search" value={search} onChangeText={setSearch} placeholder="Name, phone, city" />
      </View>
      <FlatList
        data={visibleTechnicians}
        keyExtractor={(t) => t.id}
        {...ADMIN_LIST_PERF}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void refresh(load)} tintColor={colors.green} />
        }
        contentContainerStyle={visibleTechnicians.length === 0 ? adminListShellStyles.empty : adminListShellStyles.list}
        ListEmptyComponent={<EmptyState title="No technicians" />}
        renderItem={({ item }) => {
          const st = techStatus(item);
          return (
            <Card variant="premium" style={styles.card}>
              <Pressable onPress={() => router.push(`/(admin)/technician/${item.id}`)}>
                <View style={styles.head}>
                  <View style={styles.avatar}>
                    <Text style={styles.init}>
                      {item.name.split(' ').map((w) => w[0]).join('').slice(0, 2)}
                    </Text>
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.meta}>{item.city ?? 'Field'} · {item.phone ?? item.email}</Text>
                    {item.lastJobDate || item.activeJobs ? (
                      <Text style={styles.jobHint}>
                        {item.activeJobs ? `${item.activeJobs} active` : null}
                        {item.activeJobs && item.lastJobDate ? ' · ' : null}
                        {item.lastJobDate ? `Last ${item.lastJobDate}` : null}
                      </Text>
                    ) : null}
                  </View>
                  <StatusBadge label={st.label} tone={st.tone} />
                </View>
              </Pressable>
              <View style={styles.stats}>
                <View style={styles.stat}>
                  <Text style={styles.statVal}>
                    {item.rating && item.rating > 0 ? `★ ${item.rating.toFixed(1)}` : '—'}
                  </Text>
                  <Text style={styles.statLabel}>Rating</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statVal}>{item.completedJobs ?? item.jobsDone ?? 0}</Text>
                  <Text style={styles.statLabel}>Done</Text>
                </View>
                <Pressable
                  style={[styles.stat, styles.schedule]}
                  onPress={() => router.push(`/(admin)/technician/${item.id}`)}
                >
                  <Text style={styles.scheduleTitle}>Profile</Text>
                  <Text style={styles.scheduleSub}>View</Text>
                </Pressable>
                <Pressable
                  style={styles.stat}
                  onPress={() => router.push({ pathname: '/(admin)/user-edit', params: { id: item.id } })}
                >
                  <Text style={styles.actionTitle}>Edit</Text>
                </Pressable>
                {item.phone ? (
                  <Pressable style={styles.stat} onPress={() => void Linking.openURL(`tel:${item.phone}`)}>
                    <Text style={styles.actionTitle}>Call</Text>
                  </Pressable>
                ) : null}
              </View>
            </Card>
          );
        }}
      />
    </AdminListShell>
  );
}

const styles = StyleSheet.create({
  searchWrap: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  card: { marginBottom: 12, padding: 15 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  init: { fontFamily: fonts.displayExtra, fontSize: 15, color: colors.white },
  flex: { flex: 1 },
  name: { fontFamily: fonts.display, fontSize: 14 },
  meta: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 2 },
  jobHint: { fontFamily: fonts.body, fontSize: 10, color: colors.green, marginTop: 3 },
  stats: { flexDirection: 'row', gap: 9, marginTop: 13 },
  stat: { flex: 1, backgroundColor: surfaces.tintInfo, borderRadius: 11, padding: 9, alignItems: 'center' },
  statVal: { fontFamily: fonts.displayExtra, fontSize: 14, color: colors.green },
  statLabel: { fontFamily: fonts.body, fontSize: 9.5, color: colors.muted, marginTop: 2 },
  schedule: { backgroundColor: colors.green },
  scheduleTitle: { fontFamily: fonts.display, fontSize: 11, color: colors.white, marginTop: 3 },
  scheduleSub: { fontFamily: fonts.body, fontSize: 9.5, color: colors.lime },
  actionTitle: { fontFamily: fonts.display, fontSize: 11, color: colors.green, marginTop: 3 },
});
