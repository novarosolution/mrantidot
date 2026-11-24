import { useCallback, useMemo, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight, Pencil, Phone } from 'lucide-react-native';
import { TableText, TableTwoLine, type AdminTableColumn } from '@/components/admin/AdminDataTable';
import { FilterButton, FilterRow } from '@/components/admin/AdminFilterBar';
import { AdminPagedList, useAdminPagedList } from '@/components/admin/AdminPagedList';
import { formatIndianNumber } from '@/components/charts/chartFormat';
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
import { technicianDisplayRating, technicianRealRating } from '@/lib/ratings';
import { adminRoutes, appPush } from '@/lib/routes';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { useStaleFocusRefresh } from '@/lib/useStaleFocusRefresh';
import { useWideWebLayout } from '@/lib/webAdmin';
import type { AdminTechnicianRow, AdminTechniciansPage, ListSort } from '@/types/adminLists';
import type { User } from '@/types/api';

type TechFilter = 'all' | 'available' | 'off_duty' | 'on_leave' | 'disabled';

const FILTERS: { key: TechFilter; label: string; count: keyof AdminTechniciansPage['counts'] }[] = [
  { key: 'all', label: 'All', count: 'all' },
  { key: 'available', label: 'Available', count: 'available' },
  { key: 'off_duty', label: 'Off duty', count: 'offDuty' },
  { key: 'on_leave', label: 'On leave today', count: 'onLeave' },
  { key: 'disabled', label: 'Disabled', count: 'disabled' },
];

const SORTS: { key: string; label: string; sort: ListSort }[] = [
  { key: 'name', label: 'Name A–Z', sort: { key: 'name', order: 'asc' } },
  { key: 'jobs', label: 'Most jobs done', sort: { key: 'jobs', order: 'desc' } },
  { key: 'rating', label: 'Highest rating', sort: { key: 'rating', order: 'desc' } },
  { key: 'joined', label: 'Newest first', sort: { key: 'joined', order: 'desc' } },
];

function techStatus(u: User): { label: string; tone: BadgeTone } {
  if (u.disabled === true) return { label: 'Disabled', tone: 'danger' };
  if (u.available === false) return { label: 'Off duty', tone: 'warning' };
  return { label: 'Available', tone: 'success' };
}

function editTech(id: string) {
  appPush({ pathname: adminRoutes.userEdit, params: { id, returnTo: adminRoutes.technicians } });
}

export default function AdminTechniciansScreen() {
  const wide = useWideWebLayout();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [status, setStatus] = useState<TechFilter>('all');
  const [sort, setSort] = useState<ListSort>({ key: 'name', order: 'asc' });
  const [sortOpen, setSortOpen] = useState(false);

  const query = useMemo(
    () => ({
      status: status === 'all' ? undefined : status,
      q: debouncedSearch.trim() || undefined,
      sort: sort.key,
      order: sort.order,
    }),
    [status, debouncedSearch, sort],
  );

  const fetchPage = useCallback(
    async (page: number, limit: number, opts: { skipCache: boolean }) => {
      const { data } = await api.get<AdminTechniciansPage>('/admin/technicians', {
        ...screenLoadConfig,
        params: { ...query, page, limit },
        ...(opts.skipCache ? { skipCache: true } : { cacheTtlMs: CACHE_TTL.adminLists }),
      });
      return { items: data.technicians, meta: data, extra: data.counts };
    },
    [query],
  );

  const list = useAdminPagedList<AdminTechnicianRow, AdminTechniciansPage['counts']>({
    fetchPage,
    deps: [query],
    keyOf: (t) => t.id,
    errorMessage: 'Could not load technicians',
  });

  useStaleFocusRefresh(() => list.refresh(), 3_000);

  const counts = list.extra;
  const open = useCallback((t: AdminTechnicianRow) => appPush(adminRoutes.technician(t.id)), []);

  const columns = useMemo<AdminTableColumn<AdminTechnicianRow>[]>(
    () => [
      {
        key: 'name',
        title: 'Technician',
        flex: 1.6,
        minWidth: 200,
        sortable: true,
        defaultOrder: 'asc',
        render: (t) => (
          <View style={styles.personCell}>
            <View style={styles.avatarSm}>
              <Text style={styles.initSm}>{initials(t.name)}</Text>
            </View>
            <TableTwoLine title={t.name} sub={[t.city, t.email].filter(Boolean).join(' · ')} />
          </View>
        ),
      },
      { key: 'phone', title: 'Phone', width: 132, render: (t) => <TableText>{t.phone || '—'}</TableText> },
      {
        key: 'status',
        title: 'Status',
        width: 168,
        render: (t) => {
          const st = techStatus(t);
          return (
            <View style={styles.badges}>
              <StatusBadge label={st.label} tone={st.tone} />
              {t.onLeaveToday ? <StatusBadge label="On leave" tone="info" /> : null}
            </View>
          );
        },
      },
      {
        key: 'active',
        title: 'Active jobs',
        width: 104,
        align: 'right',
        render: (t) => <TableText strong>{formatIndianNumber(t.activeJobs ?? 0)}</TableText>,
      },
      {
        key: 'jobs',
        title: 'Jobs done',
        width: 104,
        align: 'right',
        sortable: true,
        render: (t) => <TableText strong>{formatIndianNumber(t.completedJobs ?? t.jobsDone ?? 0)}</TableText>,
      },
      {
        key: 'rating',
        title: 'Rating',
        width: 118,
        sortable: true,
        render: (t) => {
          const shown = technicianDisplayRating(t);
          const real = technicianRealRating(t);
          return (
            <TableTwoLine
              title={shown > 0 ? `★ ${shown.toFixed(1)}` : '—'}
              sub={real != null ? `Reviews ${real.toFixed(1)}` : 'No reviews'}
              strong
            />
          );
        },
      },
      {
        key: 'last',
        title: 'Last job',
        width: 112,
        render: (t) => <TableText muted>{t.lastJobDate ? formatDayKey(t.lastJobDate) : '—'}</TableText>,
      },
      {
        key: 'edit',
        title: '',
        width: 64,
        align: 'right',
        render: (t) => (
          <Pressable
            onPress={() => editTech(t.id)}
            hitSlop={6}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.actionPressed]}
            accessibilityRole="button"
            accessibilityLabel={`Edit ${t.name}`}
          >
            <Pencil size={15} color={ui.brand} strokeWidth={2.2} />
          </Pressable>
        ),
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

  const header = (
    <View style={styles.header}>
      {counts ? (
        <AdminStatStrip
          flush
          items={[
            { label: 'Team', value: counts.all },
            { label: 'Available', value: counts.available, color: colors.green },
            { label: 'On leave', value: counts.onLeave },
            { label: 'Disabled', value: counts.disabled, color: counts.disabled ? colors.error : colors.forest },
          ]}
        />
      ) : null}
      <AdminSearchField value={search} onChangeText={setSearch} placeholder="Search name, phone, email, city" />
      <AdminFilterChips
        chips={FILTERS.map((f) => ({ key: f.key, label: counts ? `${f.label} ${counts[f.count]}` : f.label }))}
        selected={status}
        onSelect={(k) => setStatus(k as TechFilter)}
      />
      {!wide ? (
        <FilterRow>
          <FilterButton label="Sort" value={sortLabel} onPress={() => setSortOpen(true)} />
        </FilterRow>
      ) : null}
    </View>
  );

  const addBtn = (
    <AdminAddButton
      label="Add technician"
      onPress={() =>
        appPush({
          pathname: adminRoutes.userEdit,
          params: { role: 'technician', returnTo: adminRoutes.technicians },
        })
      }
    />
  );

  return (
    <AdminListShell
      title="Technicians"
      subtitle={counts ? `${counts.available} available · ${counts.all} total` : 'Roster & availability'}
      rightAction={addBtn}
      backFallback={adminRoutes.team}
    >
      <AdminPagedList
        list={list}
        columns={columns}
        keyExtractor={(t) => t.id}
        header={header}
        sort={sort}
        onSortChange={setSort}
        onRowPress={open}
        rowLabel={(t) => `${t.name}, ${techStatus(t).label}. Open profile`}
        noun="technicians"
        emptyTitle={debouncedSearch.trim() || status !== 'all' ? 'No matches' : 'No technicians'}
        emptyMessage={
          debouncedSearch.trim() || status !== 'all' ? 'Try another filter or search' : 'Add a technician to build your field team'
        }
        skeletonVariant="technician"
        renderCard={(item) => {
          const st = techStatus(item);
          const shown = technicianDisplayRating(item);
          const real = technicianRealRating(item);
          return (
            <View style={styles.card}>
              <PressableScale
                style={styles.head}
                scaleTo={0.98}
                onPress={() => open(item)}
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
                    {item.onLeaveToday ? <StatusBadge label="On leave" tone="info" /> : null}
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
              </PressableScale>

              <View style={styles.stats}>
                <View style={styles.stat}>
                  <Text style={styles.statVal} numberOfLines={1}>
                    {shown > 0 ? `★ ${shown.toFixed(1)}` : '—'}
                  </Text>
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
                  onPress={() => editTech(item.id)}
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
      <AdminActionSheet visible={sortOpen} title="Sort technicians" options={sortOptions} onClose={() => setSortOpen(false)} />
    </AdminListShell>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: spacing.xs },
  personCell: { flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 0, maxWidth: '100%' },
  avatarSm: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initSm: { fontFamily: fonts.displayExtra, fontSize: 12, color: colors.white },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: colors.white,
  },
  card: {
    marginBottom: spacing.sm,
    padding: 14,
    borderRadius: premium.radiusCard,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    ...ui.shadow,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12 },
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
