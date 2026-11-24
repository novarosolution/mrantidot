import type { LucideIcon } from 'lucide-react-native';
import {
  Activity,
  CalendarCheck,
  CalendarOff,
  ChevronRight,
  Clock,
  FileText,
  Globe,
  Megaphone,
  SlidersHorizontal,
  Star,
  TicketPercent,
  UsersRound,
  Wallet,
  Wrench,
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { AdminEntrance, AdminListShell, adminListShellStyles, useListEntrance } from '@/components/kit/AdminListShell';
import { AdminFilterChips, AdminSearchField } from '@/components/kit/AdminPageKit';
import { AdminListSkeleton } from '@/components/kit/AdminSkeletons';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { api, getApiErrorMessage, screenLoadConfig } from '@/lib/api';
import { localDateKey } from '@/lib/dates';
import { ADMIN_LIST_PERF } from '@/lib/listConfig';
import { adminRoutes, adminUserEdit, appPush } from '@/lib/routes';
import { formatTimeAgo } from '@/lib/time-ago';
import { useStaleFocusRefresh } from '@/lib/useStaleFocusRefresh';
import type { ActivityActor, ActivityArea, ActivityCursor, ActivityEntry, ActivityListResponse } from '@/types/adminOps';
import { colors, fonts, spacing, ui } from '@/constants/theme';

const PAGE_SIZE = 30;
const OBJECT_ID = /^[a-f0-9]{24}$/i;

const AREAS: { key: ActivityArea; label: string; icon: LucideIcon; tint: string; ink: string }[] = [
  { key: 'bookings', label: 'Bookings', icon: CalendarCheck, tint: colors.soft, ink: colors.forest },
  { key: 'users', label: 'People', icon: UsersRound, tint: colors.blueBg, ink: colors.blue },
  { key: 'services', label: 'Services', icon: Wrench, tint: colors.mint, ink: colors.forest },
  { key: 'offers', label: 'Offers', icon: TicketPercent, tint: colors.amberBg, ink: colors.amberInk },
  { key: 'reviews', label: 'Reviews', icon: Star, tint: colors.amberBg, ink: colors.amberInk },
  { key: 'settings', label: 'Settings', icon: SlidersHorizontal, tint: colors.greyBg, ink: colors.ink },
  { key: 'content', label: 'App content', icon: FileText, tint: colors.greyBg, ink: colors.ink },
  { key: 'website', label: 'Website', icon: Globe, tint: colors.blueBg, ink: colors.blue },
  { key: 'leave', label: 'Leave', icon: CalendarOff, tint: colors.errorBg, ink: colors.error },
  { key: 'attendance', label: 'Attendance', icon: Clock, tint: colors.soft, ink: colors.forest },
  { key: 'payroll', label: 'Payroll', icon: Wallet, tint: colors.mint, ink: colors.forest },
  { key: 'broadcast', label: 'Broadcasts', icon: Megaphone, tint: colors.amberBg, ink: colors.amberInk },
];
const OTHER_AREA = { key: 'other' as const, label: 'Other', icon: Activity, tint: colors.greyBg, ink: colors.muted };
const AREA_BY_KEY = new Map(AREAS.map((a) => [a.key, a]));

type RangeKey = 'all' | 'today' | '7d' | '30d';
const RANGES: { key: RangeKey; label: string }[] = [
  { key: 'all', label: 'All time' },
  { key: 'today', label: 'Today' },
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
];

/** YYYY-MM-DD bounds (the server reads them as whole business-timezone days). */
function rangeBounds(range: RangeKey): { from?: string; to?: string } {
  if (range === 'all') return {};
  const days = range === 'today' ? 1 : range === '7d' ? 7 : 30;
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  return { from: localDateKey(start), to: localDateKey() };
}

function dayLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const key = localDateKey(d);
  if (key === localDateKey()) return 'Today';
  const y = new Date();
  y.setDate(y.getDate() - 1);
  if (key === localDateKey(y)) return 'Yesterday';
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
}

function clockTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

/** "scheduleRequest" → "schedule request". */
function humanField(name: string): string {
  return name
    .replace(/[._]/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .trim();
}

/** Screen that shows what the entry changed, when there is one. */
function targetAction(e: ActivityEntry): (() => void) | undefined {
  const id = e.targetId && OBJECT_ID.test(e.targetId) ? e.targetId : undefined;
  switch (e.targetType) {
    case 'booking':
      return id ? () => appPush(adminRoutes.booking(id)) : undefined;
    case 'user':
      return id ? () => adminUserEdit({ id, returnTo: adminRoutes.activity }) : undefined;
    case 'technician':
      return id ? () => appPush(adminRoutes.technician(id)) : undefined;
    case 'service':
      return id ? () => appPush({ pathname: adminRoutes.serviceEdit, params: { id } }) : () => appPush(adminRoutes.services);
    case 'offer':
      return id ? () => appPush({ pathname: adminRoutes.offerEdit, params: { id } }) : () => appPush(adminRoutes.offers);
    case 'review':
      return () => appPush(adminRoutes.reviews);
    case 'settings':
      return () => appPush(adminRoutes.businessSettings);
    case 'content':
      return () => appPush(adminRoutes.content);
    case 'leave':
      return () => appPush(adminRoutes.leave);
    case 'broadcast':
      return () => appPush(adminRoutes.broadcast);
    case 'blog':
      return id && e.method !== 'DELETE'
        ? () => appPush({ pathname: adminRoutes.websiteBlogEdit, params: { id } })
        : () => appPush(adminRoutes.websiteBlog);
    case 'team':
      return id && e.method !== 'DELETE'
        ? () => appPush({ pathname: adminRoutes.websiteTeamEdit, params: { id } })
        : () => appPush(adminRoutes.websiteTeam);
    case 'testimonial':
      return id && e.method !== 'DELETE'
        ? () => appPush({ pathname: adminRoutes.websiteTestimonialEdit, params: { id } })
        : () => appPush(adminRoutes.websiteTestimonials);
    case 'gallery':
      return () => appPush(adminRoutes.websiteGallery);
    case 'message':
      return () => appPush(adminRoutes.websiteMessages);
    case 'subscriber':
      return () => appPush(adminRoutes.websiteSubscribers);
    case 'website':
      return () => appPush(adminRoutes.website);
    default:
      if (e.area === 'payroll') return () => appPush(adminRoutes.payroll);
      return undefined;
  }
}

type Row = { kind: 'day'; key: string; label: string } | { kind: 'entry'; key: string; entry: ActivityEntry };

function withDayHeaders(entries: ActivityEntry[]): Row[] {
  const rows: Row[] = [];
  let lastDay = '';
  for (const entry of entries) {
    const label = dayLabel(entry.at);
    if (label !== lastDay) {
      rows.push({ kind: 'day', key: `day-${entry.at}`, label });
      lastDay = label;
    }
    rows.push({ kind: 'entry', key: entry.id, entry });
  }
  return rows;
}

function ActivityRow({ entry }: { entry: ActivityEntry }) {
  const area = AREA_BY_KEY.get(entry.area) ?? OTHER_AREA;
  const Icon = area.icon;
  const open = targetAction(entry);
  const fields = entry.fields.slice(0, 6).map(humanField);
  const more = entry.fields.length - fields.length;
  const when = `${clockTime(entry.at)} · ${formatTimeAgo(entry.at)}`;

  const body = (
    <>
      <View style={[styles.icon, { backgroundColor: area.tint }]}>
        <Icon size={18} color={area.ink} strokeWidth={2.2} />
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.summary}>{entry.summary}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          <Text style={styles.actor}>{entry.actor.name}</Text>
          {`  ·  ${when}`}
        </Text>
        {fields.length > 0 ? (
          <Text style={styles.fields} numberOfLines={2}>
            Changed: {fields.join(', ')}
            {more > 0 ? ` +${more}` : ''}
          </Text>
        ) : null}
      </View>
      {open ? <ChevronRight size={16} color={ui.textTertiary} strokeWidth={2.2} /> : null}
    </>
  );

  if (!open) {
    return (
      <View style={styles.row} accessible accessibilityLabel={`${entry.summary}. ${entry.actor.name}, ${when}`}>
        {body}
      </View>
    );
  }
  return (
    <Pressable
      onPress={open}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      accessibilityRole="button"
      accessibilityLabel={`${entry.summary}. ${entry.actor.name}, ${when}`}
      accessibilityHint="Opens what was changed"
    >
      {body}
    </Pressable>
  );
}

/**
 * Admin activity log — every successful admin change (who, what, when), newest first.
 * Server: GET /admin/activity (filters + cursor paging), GET /admin/activity/actors.
 */
export default function ActivityLogScreen() {
  const [area, setArea] = useState<'all' | ActivityArea>('all');
  const [actor, setActor] = useState('all');
  const [range, setRange] = useState<RangeKey>('all');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [actors, setActors] = useState<ActivityActor[]>([]);

  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [cursor, setCursor] = useState<ActivityCursor | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);
  const entrance = useListEntrance(!loading);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => clearTimeout(t);
  }, [query]);

  const params = useMemo(() => {
    const p: Record<string, string> = { limit: String(PAGE_SIZE), ...rangeBounds(range) };
    if (area !== 'all') p.area = area;
    if (actor !== 'all') p.actor = actor;
    if (debouncedQuery) p.q = debouncedQuery;
    return p;
  }, [area, actor, range, debouncedQuery]);

  const filtered = area !== 'all' || actor !== 'all' || range !== 'all' || Boolean(debouncedQuery);

  /** First page for the current filters (stale responses are dropped). */
  const loadFirst = useCallback(async () => {
    const id = ++requestId.current;
    const { data } = await api.get<ActivityListResponse>('/admin/activity', { ...screenLoadConfig, params });
    if (id !== requestId.current) return;
    setEntries(data.entries);
    setTotal(data.total);
    setCursor(data.nextCursor);
    setError(null);
  }, [params]);

  useEffect(() => {
    let alive = true;
    setReloading(true);
    loadFirst()
      .catch((err) => {
        if (alive) setError(getApiErrorMessage(err, 'Could not load the activity log'));
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
        setReloading(false);
      });
    return () => {
      alive = false;
    };
  }, [loadFirst]);

  useEffect(() => {
    api
      .get<{ actors: ActivityActor[] }>('/admin/activity/actors', screenLoadConfig)
      .then(({ data }) => setActors(data.actors))
      .catch(() => setActors([]));
  }, []);

  useStaleFocusRefresh(() => loadFirst().catch(() => undefined), 30_000);

  async function loadMore() {
    if (!cursor || loadingMore || reloading) return;
    setLoadingMore(true);
    const id = requestId.current;
    try {
      const { data } = await api.get<ActivityListResponse>('/admin/activity', {
        ...screenLoadConfig,
        params: { ...params, before: cursor.before, beforeId: cursor.beforeId },
      });
      if (id !== requestId.current) return;
      setEntries((prev) => {
        const seen = new Set(prev.map((e) => e.id));
        return [...prev, ...data.entries.filter((e) => !seen.has(e.id))];
      });
      setCursor(data.nextCursor);
    } catch {
      // Keep what is shown; scrolling again retries.
    } finally {
      setLoadingMore(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    try {
      await loadFirst();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load the activity log'));
    } finally {
      setRefreshing(false);
    }
  }

  const rows = useMemo(() => withDayHeaders(entries), [entries]);
  const areaChips = [{ key: 'all', label: 'All areas' }, ...AREAS.map((a) => ({ key: a.key, label: a.label }))];
  const actorChips = [{ key: 'all', label: 'All admins' }, ...actors.map((a) => ({ key: a.id, label: a.name }))];

  const subtitle = loading
    ? 'Who changed what, and when'
    : total === 0
      ? filtered
        ? 'No matching changes'
        : 'No changes recorded yet'
      : `${total.toLocaleString('en-IN')} change${total === 1 ? '' : 's'}${filtered ? ' match' : ' recorded'}`;

  const filters = (
    <View style={styles.filters}>
      <AdminSearchField value={query} onChangeText={setQuery} placeholder="Search changes, people or #booking" />
      <AdminFilterChips chips={areaChips} selected={area} onSelect={(k) => setArea(k as 'all' | ActivityArea)} />
      <AdminFilterChips chips={RANGES} selected={range} onSelect={(k) => setRange(k as RangeKey)} />
      {actors.length > 1 ? <AdminFilterChips chips={actorChips} selected={actor} onSelect={setActor} /> : null}
    </View>
  );

  if (loading) {
    return (
      <AdminListShell title="Activity log" subtitle={subtitle} backFallback={adminRoutes.team}>
        <AdminListSkeleton variant="notification" search chips rows={7} />
      </AdminListShell>
    );
  }

  if (error && entries.length === 0) {
    return (
      <AdminListShell title="Activity log" subtitle="Error" backFallback={adminRoutes.team}>
        {filters}
        <ListEmptyRetry
          message={error}
          onRetry={() => {
            setReloading(true);
            loadFirst()
              .catch((err) => setError(getApiErrorMessage(err, 'Could not load the activity log')))
              .finally(() => setReloading(false));
          }}
        />
      </AdminListShell>
    );
  }

  return (
    <AdminListShell title="Activity log" subtitle={subtitle} backFallback={adminRoutes.team} headerExtra={filters}>
      {reloading && !refreshing ? (
        <View style={styles.reloading} accessibilityLabel="Updating">
          <ActivityIndicator size="small" color={colors.forest} />
        </View>
      ) : null}
      <FlatList
        data={rows}
        keyExtractor={(r) => r.key}
        {...ADMIN_LIST_PERF}
        contentContainerStyle={rows.length === 0 ? adminListShellStyles.empty : [adminListShellStyles.list, styles.listGap]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={colors.green} />}
        onEndReachedThreshold={0.4}
        onEndReached={() => void loadMore()}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <EmptyState
            title={filtered ? 'Nothing matches' : 'No activity yet'}
            message={
              filtered
                ? 'Try another area, admin or date range.'
                : 'Changes made by admins — bookings, people, services, settings and more — show up here.'
            }
            actionLabel={filtered ? 'Clear filters' : undefined}
            onAction={
              filtered
                ? () => {
                    setArea('all');
                    setActor('all');
                    setRange('all');
                    setQuery('');
                  }
                : undefined
            }
          />
        }
        ListFooterComponent={
          rows.length === 0 ? null : loadingMore ? (
            <View style={styles.footer}>
              <ActivityIndicator size="small" color={colors.forest} />
            </View>
          ) : (
            <Text style={styles.footerText}>
              {cursor
                ? `Showing ${entries.length} of ${total.toLocaleString('en-IN')}`
                : `That's everything${total > 0 ? ` · ${total.toLocaleString('en-IN')}` : ''}`}
            </Text>
          )
        }
        renderItem={({ item, index }) =>
          item.kind === 'day' ? (
            <Text style={styles.day} accessibilityRole="header">
              {item.label}
            </Text>
          ) : (
            <AdminEntrance index={index} play={entrance(index)}>
              <ActivityRow entry={item.entry} />
            </AdminEntrance>
          )
        }
      />
    </AdminListShell>
  );
}

const styles = StyleSheet.create({
  filters: { gap: spacing.xs },
  listGap: { gap: 8 },
  reloading: { paddingTop: spacing.xs, alignItems: 'center' },
  day: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: ui.textTertiary,
    marginTop: spacing.sm,
    marginBottom: 2,
    paddingHorizontal: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
  },
  rowPressed: { opacity: 0.86 },
  icon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowBody: { flex: 1, minWidth: 0 },
  summary: { fontFamily: fonts.bodySemi, fontSize: 13.5, lineHeight: 19, color: colors.ink },
  meta: { fontFamily: fonts.body, fontSize: 12, color: ui.textSecondary, marginTop: 3 },
  actor: { fontFamily: fonts.bodySemi, color: colors.forest },
  fields: { fontFamily: fonts.body, fontSize: 11.5, color: ui.textTertiary, marginTop: 4 },
  footer: { paddingVertical: spacing.md, alignItems: 'center' },
  footerText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: ui.textTertiary,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
});
