import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { TableText, TableTwoLine, type AdminTableColumn } from '@/components/admin/AdminDataTable';
import { FilterButton, FilterRow, FilterSummary } from '@/components/admin/AdminFilterBar';
import { AdminPagedList, useAdminPagedList } from '@/components/admin/AdminPagedList';
import {
  DateRangePicker,
  FILTER_RANGE_PRESETS,
  formatRangeLabel,
  resolveDateRange,
  type DateRangeValue,
} from '@/components/admin/DateRangePicker';
import { formatIndianNumber } from '@/components/charts/chartFormat';
import { AdminActionSheet, type ActionSheetOption } from '@/components/kit/AdminActionSheet';
import { AdminListShell } from '@/components/kit/AdminListShell';
import { AdminFilterChips, AdminSearchField } from '@/components/kit/AdminPageKit';
import { formatDayKey } from '@/components/kit/format';
import { StarRating } from '@/components/ui/StarRating';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { colors, fonts, premium, spacing, ui } from '@/constants/theme';
import { api, screenLoadConfig } from '@/lib/api';
import { CACHE_TTL } from '@/lib/apiCache';
import { notify } from '@/lib/confirm';
import { haptic } from '@/lib/motion';
import { paramString } from '@/lib/routeParams';
import { adminRoutes, appPush } from '@/lib/routes';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { useStaleFocusRefresh } from '@/lib/useStaleFocusRefresh';
import { useWideWebLayout } from '@/lib/webAdmin';
import type { AdminReviewRow, AdminReviewsPage, ListSort } from '@/types/adminLists';
import type { User } from '@/types/api';

type Visibility = 'all' | 'visible' | 'hidden';
type Summary = AdminReviewsPage['summary'];

const SORTS: { key: string; label: string; sort: ListSort }[] = [
  { key: 'new', label: 'Newest first', sort: { key: 'created', order: 'desc' } },
  { key: 'old', label: 'Oldest first', sort: { key: 'created', order: 'asc' } },
  { key: 'low', label: 'Lowest rating first', sort: { key: 'stars', order: 'asc' } },
  { key: 'high', label: 'Highest rating first', sort: { key: 'stars', order: 'desc' } },
];

function parseRatingParam(raw?: string): number[] {
  if (!raw) return [];
  return [...new Set(raw.split(',').map((s) => Number.parseInt(s, 10)))].filter((n) => n >= 1 && n <= 5).sort();
}

function ratingLabel(stars: number[]): string {
  if (stars.length === 0) return '';
  if (stars.length === 1) return `${stars[0]}★`;
  return `${stars.join(', ')}★`;
}

/** Star distribution over every matching review — tap a row to filter to that rating. */
function RatingBreakdown({
  summary,
  selected,
  onToggle,
}: {
  summary: Summary;
  selected: number[];
  onToggle: (stars: number) => void;
}) {
  const max = Math.max(1, ...Object.values(summary.breakdown));
  return (
    <View style={styles.summaryCard}>
      <View style={styles.avgCol}>
        <Text style={styles.avgValue}>{summary.count > 0 ? summary.average.toFixed(1) : '—'}</Text>
        <StarRating rating={summary.average} size={14} />
        <Text style={styles.avgSub}>
          {formatIndianNumber(summary.count)} {summary.count === 1 ? 'review' : 'reviews'}
          {summary.hidden ? ` · ${summary.hidden} hidden` : ''}
        </Text>
      </View>
      <View style={styles.bars}>
        {[5, 4, 3, 2, 1].map((stars) => {
          const count = summary.breakdown[String(stars) as keyof Summary['breakdown']] ?? 0;
          const active = selected.includes(stars);
          return (
            <Pressable
              key={stars}
              onPress={() => {
                haptic('select');
                onToggle(stars);
              }}
              style={({ pressed }) => [styles.barRow, active && styles.barRowActive, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${stars} stars: ${count} reviews${active ? ', filtered' : ''}`}
            >
              <Text style={styles.barLabel}>{stars}★</Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${(count / max) * 100}%` },
                    stars <= 2 ? styles.barFillLow : null,
                  ]}
                />
              </View>
              <Text style={styles.barCount}>{formatIndianNumber(count)}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function AdminReviewsScreen() {
  const wide = useWideWebLayout();
  const params = useLocalSearchParams<{ rating?: string; technicianId?: string }>();
  const [visibility, setVisibility] = useState<Visibility>('all');
  const [stars, setStars] = useState<number[]>(() => parseRatingParam(paramString(params.rating)));
  const [technician, setTechnician] = useState<{ id: string; name: string } | null>(() => {
    const id = paramString(params.technicianId);
    return id ? { id, name: 'Selected' } : null;
  });
  const [dateValue, setDateValue] = useState<DateRangeValue>({ preset: 'all' });
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [sort, setSort] = useState<ListSort>({ key: 'created', order: 'desc' });
  const [sheet, setSheet] = useState<null | 'technician' | 'sort'>(null);
  const [techs, setTechs] = useState<User[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    setStars(parseRatingParam(paramString(params.rating)));
  }, [params.rating]);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ technicians: User[] }>('/admin/technicians', { ...screenLoadConfig, cacheTtlMs: CACHE_TTL.profile })
      .then(({ data }) => {
        if (cancelled) return;
        setTechs(data.technicians);
        setTechnician((cur) => {
          if (!cur || cur.name !== 'Selected') return cur;
          const t = data.technicians.find((x) => x.id === cur.id);
          return t ? { id: t.id, name: t.name } : cur;
        });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const range = resolveDateRange(dateValue);
  const query = useMemo(
    () => ({
      visibility: visibility === 'all' ? undefined : visibility,
      rating: stars.length ? stars.join(',') : undefined,
      technicianId: technician?.id,
      from: range?.from,
      to: range?.to,
      q: debouncedSearch.trim() || undefined,
      sort: sort.key,
      order: sort.order,
    }),
    [visibility, stars, technician, range?.from, range?.to, debouncedSearch, sort],
  );

  const fetchPage = useCallback(
    async (page: number, limit: number, opts: { skipCache: boolean }) => {
      const { data } = await api.get<AdminReviewsPage>('/admin/reviews', {
        ...screenLoadConfig,
        params: { ...query, page, limit },
        ...(opts.skipCache ? { skipCache: true } : { cacheTtlMs: CACHE_TTL.adminLists }),
      });
      return { items: data.reviews, meta: data, extra: data.summary };
    },
    [query],
  );

  const list = useAdminPagedList<AdminReviewRow, Summary>({
    fetchPage,
    deps: [query],
    keyOf: (r) => r.id,
    errorMessage: 'Could not load reviews',
  });

  useStaleFocusRefresh(() => list.refresh(), 30_000);

  const toggleHidden = useCallback(
    async (r: AdminReviewRow) => {
      if (busyId) return;
      const next = !r.hidden;
      setBusyId(r.id);
      list.updateItems((items) => items.map((x) => (x.id === r.id ? { ...x, hidden: next } : x)));
      try {
        await api.patch(`/admin/reviews/${r.id}`, { hidden: next });
        haptic('success');
      } catch {
        list.updateItems((items) => items.map((x) => (x.id === r.id ? { ...x, hidden: r.hidden } : x)));
        haptic('error');
        notify('Error', 'Could not update review');
      } finally {
        setBusyId(null);
      }
    },
    [busyId, list],
  );

  const toggleStar = useCallback((n: number) => {
    setStars((cur) => (cur.includes(n) ? cur.filter((x) => x !== n) : [...cur, n].sort()));
  }, []);

  const clearAll = useCallback(() => {
    setVisibility('all');
    setStars([]);
    setTechnician(null);
    setDateValue({ preset: 'all' });
    setSearch('');
  }, []);

  const summaryParts = [
    visibility !== 'all' ? (visibility === 'hidden' ? 'Hidden' : 'Visible') : '',
    ratingLabel(stars),
    technician ? (technician.name === 'Selected' ? 'One technician' : technician.name) : '',
    range ? formatRangeLabel(range) : '',
    debouncedSearch.trim() ? `“${debouncedSearch.trim()}”` : '',
  ].filter(Boolean);

  const actions = (r: AdminReviewRow) => (
    <View style={styles.actions}>
      <Pressable
        onPress={() => appPush(adminRoutes.booking(r.bookingId))}
        accessibilityRole="button"
        accessibilityLabel="Open booking"
        hitSlop={6}
        style={({ pressed }) => [styles.linkBtn, pressed && styles.linkPressed]}
      >
        <Text style={styles.link}>Booking</Text>
      </Pressable>
      <Pressable
        onPress={() => void toggleHidden(r)}
        disabled={busyId === r.id}
        accessibilityRole="button"
        accessibilityLabel={r.hidden ? 'Show review' : 'Hide review'}
        hitSlop={6}
        style={({ pressed }) => [styles.linkBtn, pressed && styles.linkPressed]}
      >
        <Text style={[styles.link, busyId === r.id && styles.linkBusy]}>{busyId === r.id ? '…' : r.hidden ? 'Show' : 'Hide'}</Text>
      </Pressable>
    </View>
  );

  const columns = useMemo<AdminTableColumn<AdminReviewRow>[]>(
    () => [
      {
        key: 'stars',
        title: 'Rating',
        width: 118,
        sortable: true,
        defaultOrder: 'asc',
        render: (r) => <StarRating rating={r.stars} size={13} showValue />,
      },
      {
        key: 'comment',
        title: 'Review',
        flex: 2,
        minWidth: 220,
        render: (r) => (
          <View style={styles.reviewCell}>
            <TableText lines={2} muted={!r.comment}>
              {r.comment || 'No comment'}
            </TableText>
            {r.tags?.length ? <TableText muted>{r.tags.join(' · ')}</TableText> : null}
          </View>
        ),
      },
      {
        key: 'who',
        title: 'Customer · service',
        flex: 1.3,
        minWidth: 160,
        render: (r) => <TableTwoLine title={r.customerFullName || r.customerName} sub={r.serviceName} strong={false} />,
      },
      {
        key: 'tech',
        title: 'Technician',
        width: 140,
        render: (r) => <TableText>{r.technicianName || '—'}</TableText>,
      },
      {
        key: 'created',
        title: 'Date',
        width: 104,
        sortable: true,
        render: (r) => <TableText muted>{r.createdAt ? formatDayKey(String(r.createdAt).slice(0, 10)) : '—'}</TableText>,
      },
      {
        key: 'status',
        title: '',
        width: 190,
        align: 'right',
        render: (r) => (
          <View style={styles.statusCell}>
            {r.hidden ? <StatusBadge label="Hidden" tone="danger" /> : null}
            {actions(r)}
          </View>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [busyId, toggleHidden],
  );

  const technicianOptions: ActionSheetOption[] = [
    { key: 'any', label: 'Any technician', onPress: () => setTechnician(null) },
    ...techs.map((t) => ({ key: t.id, label: t.name, onPress: () => setTechnician({ id: t.id, name: t.name }) })),
  ];
  const sortOptions: ActionSheetOption[] = SORTS.map((o) => ({
    key: o.key,
    label: o.label,
    subtitle: o.sort.key === sort.key && o.sort.order === sort.order ? 'Current' : undefined,
    onPress: () => setSort(o.sort),
  }));
  const sortLabel = SORTS.find((o) => o.sort.key === sort.key && o.sort.order === sort.order)?.label;

  const summary = list.extra;
  const header = (
    <View style={styles.header}>
      {summary ? <RatingBreakdown summary={summary} selected={stars} onToggle={toggleStar} /> : null}
      <AdminSearchField value={search} onChangeText={setSearch} placeholder="Search comments and tags" />
      <AdminFilterChips
        chips={[
          { key: 'all', label: 'All' },
          { key: 'visible', label: 'Visible' },
          { key: 'hidden', label: 'Hidden' },
        ]}
        selected={visibility}
        onSelect={(key) => setVisibility(key as Visibility)}
      />
      <DateRangePicker value={dateValue} onChange={(v) => setDateValue(v)} presets={FILTER_RANGE_PRESETS} caption={false} />
      <FilterRow>
        <FilterButton
          label="Technician"
          value={technician ? (technician.name === 'Selected' ? 'One technician' : technician.name) : null}
          onPress={() => setSheet('technician')}
          onClear={() => setTechnician(null)}
        />
        {!wide ? <FilterButton label="Sort" value={sortLabel} onPress={() => setSheet('sort')} /> : null}
      </FilterRow>
      <FilterSummary parts={summaryParts} onClear={clearAll} />
    </View>
  );

  return (
    <AdminListShell
      title="Reviews"
      subtitle={summary ? `${formatIndianNumber(summary.count)} ratings · moderate feedback` : 'Moderate feedback'}
      backFallback={adminRoutes.team}
    >
      <AdminPagedList
        list={list}
        columns={columns}
        keyExtractor={(r) => r.id}
        header={header}
        sort={sort}
        onSortChange={setSort}
        noun="reviews"
        emptyTitle={summaryParts.length ? 'No reviews match' : 'No reviews yet'}
        emptyMessage={summaryParts.length ? 'Try another filter.' : 'Reviews appear after completed bookings.'}
        emptyActionLabel={summaryParts.length ? 'Clear filters' : undefined}
        onEmptyAction={summaryParts.length ? clearAll : undefined}
        skeletonVariant="review"
        renderCard={(item) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <StarRating rating={item.stars} size={15} showValue />
              {item.hidden ? <StatusBadge label="Hidden" tone="danger" /> : null}
            </View>
            <Text style={styles.meta} numberOfLines={1}>
              {[item.customerName, item.serviceName, item.technicianName].filter(Boolean).join(' · ')}
            </Text>
            {item.comment ? (
              <Text style={styles.comment} numberOfLines={3}>
                {item.comment}
              </Text>
            ) : null}
            <View style={styles.cardFoot}>
              <Text style={styles.date}>{item.createdAt ? formatDayKey(String(item.createdAt).slice(0, 10)) : ''}</Text>
              {actions(item)}
            </View>
          </View>
        )}
      />
      <AdminActionSheet visible={sheet === 'technician'} title="Filter by technician" options={technicianOptions} onClose={() => setSheet(null)} />
      <AdminActionSheet visible={sheet === 'sort'} title="Sort reviews" options={sortOptions} onClose={() => setSheet(null)} />
    </AdminListShell>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: spacing.xs },
  pressed: { opacity: 0.8 },
  summaryCard: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: premium.radiusCard,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    ...ui.shadow,
  },
  avgCol: { width: 104, alignItems: 'center', justifyContent: 'center', gap: 4 },
  avgValue: { fontFamily: fonts.display, fontSize: 32, lineHeight: 38, letterSpacing: -0.8, color: ui.text },
  avgSub: { fontFamily: fonts.body, fontSize: 11.5, color: ui.textSecondary, textAlign: 'center' },
  bars: { flex: 1, minWidth: 0, gap: 2 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4, paddingHorizontal: 6, borderRadius: 8 },
  barRowActive: { backgroundColor: ui.brandSoft },
  barLabel: { width: 26, fontFamily: fonts.bodySemi, fontSize: 12, color: ui.text },
  barTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: ui.hairline, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4, backgroundColor: colors.green },
  barFillLow: { backgroundColor: colors.amber },
  barCount: { width: 34, textAlign: 'right', fontFamily: fonts.bodySemi, fontSize: 12, color: ui.textSecondary },
  reviewCell: { gap: 2, maxWidth: '100%' },
  statusCell: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'flex-end' },
  card: {
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: premium.radiusCard,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    ...ui.shadow,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  meta: { fontFamily: fonts.body, fontSize: 12, color: ui.textSecondary, marginTop: 6 },
  comment: { fontFamily: fonts.body, fontSize: 13, color: ui.text, marginTop: 8, lineHeight: 18 },
  cardFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  date: { fontFamily: fonts.body, fontSize: 12, color: ui.textTertiary },
  actions: { flexDirection: 'row', gap: 8 },
  linkBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: colors.white,
  },
  linkPressed: { backgroundColor: ui.surfaceMuted },
  link: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.forest },
  linkBusy: { opacity: 0.5 },
});
