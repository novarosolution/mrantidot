import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Linking, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { ChevronRight, Pencil, Phone } from 'lucide-react-native';
import { adminShadow } from '@/components/kit/homeUi';
import { AdminListShell, adminListShellStyles } from '@/components/kit/AdminListShell';
import { AdminAddButton } from '@/components/kit/AdminAddButton';
import { AdminSearchField, AdminStatStrip } from '@/components/kit/AdminPageKit';
import { formatDayKey, initials } from '@/components/kit/format';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge';
import { api, screenLoadConfig } from '@/lib/api';
import { ADMIN_LIST_PERF } from '@/lib/listConfig';
import { adminRoutes, appPush } from '@/lib/routes';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { technicianDisplayRating, technicianRealRating } from '@/lib/ratings';
import { useScreenLoad } from '@/lib/useScreenLoad';
import type { AdminTechnician, User } from '@/types/api';
import { colors, fonts, spacing, ui } from '@/constants/theme';
import { useStaleFocusRefresh } from '@/lib/useStaleFocusRefresh';

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

  useStaleFocusRefresh(() => load().catch(() => undefined), 3_000);

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

  const availableCount = useMemo(() => techs.filter((t) => t.available !== false && !t.disabled).length, [techs]);
  const offDutyCount = useMemo(() => techs.filter((t) => t.available === false && !t.disabled).length, [techs]);
  const disabledCount = useMemo(() => techs.filter((t) => t.disabled).length, [techs]);

  if (loading) return <Spinner fullScreen />;

  if (error) {
    return (
      <AdminListShell title="Technicians" subtitle="Error">
        <ListEmptyRetry message={error} onRetry={() => void reload(load, error)} />
      </AdminListShell>
    );
  }

  const addBtn = (
    <AdminAddButton
      onPress={() =>
        appPush({
          pathname: adminRoutes.userEdit,
          params: { role: 'technician', returnTo: adminRoutes.technicians },
        })
      }
    />
  );

  const listHeader = (
    <View>
      <AdminStatStrip
        flush
        items={[
          { label: 'Team', value: techs.length },
          { label: 'Available', value: availableCount, color: colors.green },
          { label: 'Off duty', value: offDutyCount },
          { label: 'Disabled', value: disabledCount, color: disabledCount ? colors.error : colors.forest },
        ]}
      />
      <View style={styles.searchWrap}>
        <AdminSearchField value={search} onChangeText={setSearch} placeholder="Search name, phone, city" />
      </View>
    </View>
  );

  return (
    <AdminListShell
      title="Technicians"
      subtitle={`${availableCount} available · ${techs.length} total`}
      rightAction={addBtn}
      backFallback={adminRoutes.team}
    >
      <FlatList
        data={visibleTechnicians}
        keyExtractor={(t) => t.id}
        {...ADMIN_LIST_PERF}
        ListHeaderComponent={listHeader}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void refresh(load)} tintColor={colors.green} />
        }
        contentContainerStyle={visibleTechnicians.length === 0 ? adminListShellStyles.empty : adminListShellStyles.list}
        ListEmptyComponent={<EmptyState title="No technicians" />}
        renderItem={({ item }) => {
          const st = techStatus(item);
          const shown = technicianDisplayRating(item);
          const real = technicianRealRating(item);
          return (
            <View style={styles.card}>
              <Pressable
                style={({ pressed }) => [styles.head, pressed && styles.headPressed]}
                onPress={() => appPush(adminRoutes.technician(item.id))}
                accessibilityRole="button"
                accessibilityLabel={`${item.name}, ${st.label}. Open profile`}
              >
                <View style={styles.avatar}>
                  <Text style={styles.init}>{initials(item.name)}</Text>
                </View>
                <View style={styles.flex}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <StatusBadge label={st.label} tone={st.tone} />
                  </View>
                  <Text style={styles.meta} numberOfLines={1}>
                    {item.city ?? 'Field'} · {item.phone ?? item.email}
                  </Text>
                  {item.lastJobDate || item.activeJobs ? (
                    <Text style={styles.jobHint} numberOfLines={1}>
                      {item.activeJobs ? `${item.activeJobs} active` : null}
                      {item.activeJobs && item.lastJobDate ? ' · ' : null}
                      {item.lastJobDate ? `Last job ${formatDayKey(item.lastJobDate)}` : null}
                    </Text>
                  ) : null}
                </View>
                <ChevronRight size={18} color={ui.textTertiary} strokeWidth={2.2} />
              </Pressable>

              <View style={styles.stats}>
                <View style={styles.stat}>
                  <Text style={styles.statVal}>{shown > 0 ? `★ ${shown.toFixed(1)}` : '—'}</Text>
                  <Text style={styles.statLabel}>Shown rating</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Text style={styles.statVal}>{real != null ? real.toFixed(1) : '—'}</Text>
                  <Text style={styles.statLabel}>Reviews avg</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Text style={styles.statVal}>{item.completedJobs ?? item.jobsDone ?? 0}</Text>
                  <Text style={styles.statLabel}>Jobs done</Text>
                </View>
              </View>

              <View style={styles.actions}>
                {item.phone ? (
                  <Pressable
                    style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
                    onPress={() => void Linking.openURL(`tel:${item.phone}`)}
                    accessibilityRole="button"
                    accessibilityLabel={`Call ${item.name}`}
                  >
                    <Phone size={15} color={ui.brand} strokeWidth={2.2} />
                    <Text style={styles.actionText}>Call</Text>
                  </Pressable>
                ) : null}
                <Pressable
                  style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
                  onPress={() =>
                    appPush({
                      pathname: adminRoutes.userEdit,
                      params: { id: item.id, returnTo: adminRoutes.technicians },
                    })
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`Edit ${item.name}`}
                >
                  <Pencil size={15} color={ui.brand} strokeWidth={2.2} />
                  <Text style={styles.actionText}>Edit</Text>
                </Pressable>
              </View>
            </View>
          );
        }}
      />
    </AdminListShell>
  );
}

const styles = StyleSheet.create({
  searchWrap: { marginBottom: spacing.xs },
  card: {
    marginBottom: spacing.sm,
    padding: 14,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    ...adminShadow.card,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12 },
  headPressed: { opacity: 0.7 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  init: { fontFamily: fonts.displayExtra, fontSize: 15, color: colors.white },
  flex: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { flexShrink: 1, fontFamily: fonts.displayExtra, fontSize: 15.5, color: ui.text, letterSpacing: -0.2 },
  meta: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: ui.textSecondary, marginTop: 2 },
  jobHint: { fontFamily: fonts.bodySemi, fontSize: 11.5, color: ui.brand, marginTop: 2 },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: ui.surfaceMuted,
  },
  stat: { flexGrow: 1, flexBasis: 0, minWidth: 0, alignItems: 'center', paddingHorizontal: 4 },
  statDivider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: ui.border },
  statVal: { fontFamily: fonts.displayExtra, fontSize: 15, color: ui.text },
  statLabel: { fontFamily: fonts.bodyMedium, fontSize: 11, color: ui.textSecondary, marginTop: 1 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  action: {
    flex: 1,
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: colors.white,
  },
  actionPressed: { backgroundColor: ui.surfaceMuted },
  actionText: { fontFamily: fonts.bodyBold, fontSize: 13, color: ui.brand },
});
