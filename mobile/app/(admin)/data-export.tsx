import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { SegmentedToggle } from '@/components/admin/AdminFilterBar';
import { shareCsv } from '@/components/admin/csv';
import {
  DateRangePicker,
  FILTER_RANGE_PRESETS,
  formatRangeSummary,
  resolveDateRange,
  type DateRangeValue,
} from '@/components/admin/DateRangePicker';
import { formatIndianNumber } from '@/components/charts/chartFormat';
import { AdminLightHeader } from '@/components/kit/AdminLightHeader';
import { AdminSectionTitle } from '@/components/kit/AdminListShell';
import { AdminExportSkeleton } from '@/components/kit/AdminSkeletons';
import { GlassPanel, GlassScreen } from '@/components/kit/GlassScreenKit';
import { Button } from '@/components/ui/Button';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { colors, fonts, premiumType, spacing, ui } from '@/constants/theme';
import { api, getApiErrorMessage, screenLoadConfig } from '@/lib/api';
import { haptic, stagger } from '@/lib/motion';
import { adminRoutes } from '@/lib/routes';
import { shareTextFile } from '@/lib/shareFile';
import type { ExportDatasetGroup, ExportDatasetInfo, ExportSummary } from '@/types/adminLists';

/** Browsers download the files; phones open the share sheet with the text. */
const IS_WEB = Platform.OS === 'web';
const DOWNLOAD_TIMEOUT_MS = 180_000;

const GROUPS: { key: ExportDatasetGroup; title: string; hint: string }[] = [
  { key: 'operations', title: 'Operations', hint: 'Bookings, reviews, leave, attendance, notifications, admin activity' },
  { key: 'people', title: 'People', hint: 'Customers, technicians, saved addresses, payment methods' },
  { key: 'catalog', title: 'Catalog', hint: 'Services and offers' },
  { key: 'website', title: 'Website', hint: 'Blog, gallery, team, testimonials, messages, subscribers, layout' },
  { key: 'app', title: 'App content', hint: 'Home screen and app texts' },
];

type DateField = 'visit' | 'created';

function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function rangeSuffix(from?: string, to?: string): string {
  return from && to ? `-${from}_to_${to}` : '';
}

export default function AdminDataExportScreen() {
  const [dateValue, setDateValue] = useState<DateRangeValue>({ preset: 'all' });
  const [dateField, setDateField] = useState<DateField>('visit');
  const [summary, setSummary] = useState<ExportSummary | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [counting, setCounting] = useState(true);
  const [selected, setSelected] = useState<Set<string> | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const range = resolveDateRange(dateValue);
  const rangeParams = useMemo(
    () => (range ? { from: range.from, to: range.to, dateField } : { dateField }),
    [range?.from, range?.to, dateField],
  );

  // Only row counts load here — nothing heavy downloads until a button is tapped.
  const loadSummary = useCallback(async () => {
    setCounting(true);
    setSummaryError(null);
    try {
      const { data } = await api.get<ExportSummary>('/admin/export', {
        ...screenLoadConfig,
        params: { summary: 1, ...rangeParams },
        skipCache: true,
      });
      setSummary(data);
      setSelected((cur) => cur ?? new Set(data.datasets.map((d) => d.key)));
    } catch (err) {
      setSummaryError(getApiErrorMessage(err, 'Could not count the data'));
    } finally {
      setCounting(false);
    }
  }, [rangeParams]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  const grouped = useMemo(() => {
    const byGroup = new Map<ExportDatasetGroup, ExportDatasetInfo[]>();
    for (const d of summary?.datasets ?? []) {
      const list = byGroup.get(d.group) ?? [];
      list.push(d);
      byGroup.set(d.group, list);
    }
    return GROUPS.map((g) => ({ ...g, datasets: byGroup.get(g.key) ?? [] })).filter((g) => g.datasets.length > 0);
  }, [summary]);

  const selectedList = useMemo(
    () => (summary?.datasets ?? []).filter((d) => selected?.has(d.key)),
    [summary, selected],
  );
  const selectedRows = selectedList.reduce((sum, d) => sum + d.count, 0);
  const allSelected = Boolean(summary && selectedList.length === summary.datasets.length);

  const toggle = useCallback((key: string) => {
    haptic('select');
    setSelected((cur) => {
      const next = new Set(cur ?? []);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const downloadCsv = useCallback(
    async (d: ExportDatasetInfo) => {
      if (busy) return;
      if (d.count === 0) {
        Toast.show({ type: 'info', text1: `No ${d.label.toLowerCase()} in this range` });
        return;
      }
      setBusy(`csv:${d.key}`);
      try {
        const { data } = await api.get<string>('/admin/export', {
          ...screenLoadConfig,
          params: { format: 'csv', dataset: d.key, ...rangeParams },
          responseType: 'text',
          timeout: DOWNLOAD_TIMEOUT_MS,
          skipCache: true,
        });
        const result = await shareCsv(
          `mrantidot-${d.key}${rangeSuffix(range?.from, range?.to)}.csv`,
          stripBom(String(data)),
          `${d.label} CSV`,
        );
        haptic('success');
        Toast.show({ type: 'success', text1: result === 'downloaded' ? `${d.label} CSV downloaded` : `${d.label} CSV ready to share` });
      } catch (err) {
        haptic('error');
        Toast.show({ type: 'error', text1: getApiErrorMessage(err, `Could not export ${d.label.toLowerCase()}`) });
      } finally {
        setBusy(null);
      }
    },
    [busy, rangeParams, range?.from, range?.to],
  );

  const downloadJson = useCallback(async () => {
    if (busy || selectedList.length === 0) return;
    setBusy('json');
    try {
      const { data } = await api.get<string>('/admin/export', {
        ...screenLoadConfig,
        params: { format: 'json', datasets: selectedList.map((d) => d.key).join(','), ...rangeParams },
        responseType: 'text',
        timeout: DOWNLOAD_TIMEOUT_MS,
        skipCache: true,
      });
      const stamp = new Date(Date.now() + 330 * 60_000).toISOString().slice(0, 10);
      const result = await shareTextFile({
        filename: `mrantidot-backup-${stamp}${rangeSuffix(range?.from, range?.to)}.json`,
        title: 'Mr Antidot backup',
        mimeType: 'application/json',
        content: String(data),
      });
      haptic('success');
      Toast.show({ type: 'success', text1: result === 'downloaded' ? 'JSON backup downloaded' : 'JSON backup ready to share' });
    } catch (err) {
      haptic('error');
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Could not build the backup') });
    } finally {
      setBusy(null);
    }
  }, [busy, selectedList, rangeParams, range?.from, range?.to]);

  const header = <AdminLightHeader title="Data export" subtitle="Pick data and a date range" showBack backFallback={adminRoutes.team} />;

  if (!summary && counting) {
    return (
      <GlassScreen header={header}>
        <AdminExportSkeleton />
      </GlassScreen>
    );
  }
  if (!summary && summaryError) {
    return (
      <GlassScreen header={header}>
        <ListEmptyRetry message={summaryError} onRetry={() => void loadSummary()} />
      </GlassScreen>
    );
  }

  return (
    <GlassScreen header={header}>
      <FadeSlideIn delay={stagger(0)} slideFrom={14}>
        <GlassPanel>
          <Text style={styles.heroEyebrow}>EXPORT</Text>
          <Text style={styles.heroTitle}>Your business data</Text>
          <Text style={styles.heroBody}>
            Choose a date range and what you need. Nothing downloads until you tap a button. Passwords and live
            codes are never included; every row is exported (no limit).
          </Text>

          <Text style={styles.label}>Date range</Text>
          <DateRangePicker value={dateValue} onChange={(v) => setDateValue(v)} presets={FILTER_RANGE_PRESETS} />
          {range ? (
            <SegmentedToggle<DateField>
              label="Bookings by"
              options={[
                { value: 'visit', label: 'Visit date' },
                { value: 'created', label: 'Booked date' },
              ]}
              value={dateField}
              onChange={setDateField}
            />
          ) : null}
          <Text style={styles.note}>
            {range
              ? `Rows from ${formatRangeSummary(range)}: bookings by ${dateField === 'visit' ? 'visit' : 'booked'} date, attendance by day, leave that overlaps, everything else by the day it was created.`
              : 'All time — every record.'}
          </Text>

          <View style={styles.backupRow}>
            <View style={styles.flex}>
              <Text style={styles.backupTitle}>JSON backup</Text>
              <Text style={styles.backupSub}>
                {counting ? 'Counting…' : `${selectedList.length} datasets · ${formatIndianNumber(selectedRows)} rows`}
              </Text>
            </View>
            <Pressable
              onPress={() => {
                haptic('select');
                setSelected(allSelected ? new Set() : new Set(summary?.datasets.map((d) => d.key)));
              }}
              hitSlop={8}
              accessibilityRole="button"
            >
              <Text style={styles.selectAll}>{allSelected ? 'Select none' : 'Select all'}</Text>
            </Pressable>
          </View>
          <Button
            title={IS_WEB ? 'Download JSON backup' : 'Share JSON backup'}
            variant="premium"
            loading={busy === 'json'}
            disabled={selectedList.length === 0 || Boolean(busy && busy !== 'json')}
            onPress={() => void downloadJson()}
            style={styles.btnGapMd}
          />
          {summaryError ? <Text style={styles.error}>{summaryError}</Text> : null}
        </GlassPanel>
      </FadeSlideIn>

      {grouped.map((group, gi) => (
        <FadeSlideIn key={group.key} delay={stagger(gi + 1)} slideFrom={14}>
          <AdminSectionTitle flush title={group.title} hint={group.hint} />
          <View style={styles.sheets}>
            {group.datasets.map((d) => {
              const on = Boolean(selected?.has(d.key));
              const csv = d.formats.includes('csv');
              const csvBusy = busy === `csv:${d.key}`;
              return (
                <GlassPanel key={d.key} padded={false} style={styles.sheetPanel}>
                  <View style={styles.sheetInner}>
                    <Pressable
                      onPress={() => toggle(d.key)}
                      style={({ pressed }) => [styles.pick, pressed && styles.pressed]}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: on }}
                      accessibilityLabel={`${d.label}, ${d.count} rows. Include in JSON backup`}
                    >
                      <View style={[styles.box, on && styles.boxOn]}>{on ? <Check size={14} color={colors.white} strokeWidth={3} /> : null}</View>
                      <View style={styles.sheetCopy}>
                        <Text style={styles.sheetLabel} numberOfLines={1}>
                          {d.label}
                        </Text>
                        <Text style={styles.sheetHint} numberOfLines={1}>
                          {counting ? 'Counting…' : `${formatIndianNumber(d.count)} ${d.count === 1 ? 'row' : 'rows'}`}
                          {csv ? '' : ' · JSON only'}
                        </Text>
                      </View>
                    </Pressable>
                    {csv ? (
                      <Pressable
                        onPress={() => void downloadCsv(d)}
                        disabled={Boolean(busy)}
                        style={({ pressed }) => [styles.csvBtn, (pressed || csvBusy) && styles.pressed, d.count === 0 && styles.csvBtnEmpty]}
                        accessibilityRole="button"
                        accessibilityLabel={`${IS_WEB ? 'Download' : 'Share'} ${d.label} as CSV`}
                      >
                        <Text style={styles.csvText}>{csvBusy ? '…' : 'CSV'}</Text>
                      </Pressable>
                    ) : null}
                  </View>
                </GlassPanel>
              );
            })}
          </View>
        </FadeSlideIn>
      ))}
      <View style={styles.bottom} />
    </GlassScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.7 },
  heroEyebrow: { fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 1.1, color: colors.forest, marginBottom: 6 },
  heroTitle: { ...premiumType.sectionTitle, fontSize: 22, marginBottom: 8 },
  heroBody: { fontFamily: fonts.body, fontSize: 14, lineHeight: 21, color: colors.muted },
  label: { fontFamily: fonts.bodySemi, fontSize: 13, color: ui.text, marginTop: spacing.md, marginBottom: 6 },
  note: { fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, color: ui.textSecondary },
  backupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ui.border,
  },
  backupTitle: { fontFamily: fonts.bodyBold, fontSize: 15, color: ui.text },
  backupSub: { fontFamily: fonts.body, fontSize: 12.5, color: ui.textSecondary, marginTop: 2 },
  selectAll: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.forest },
  btnGapMd: { marginTop: spacing.md },
  error: { marginTop: spacing.sm, fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.error },
  sheets: { gap: spacing.sm },
  sheetPanel: { overflow: 'hidden' },
  sheetInner: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14 },
  pick: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 12 },
  box: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: ui.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: { backgroundColor: colors.forest, borderColor: colors.forest },
  sheetCopy: { flex: 1, minWidth: 0 },
  sheetLabel: { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink },
  sheetHint: { marginTop: 2, fontFamily: fonts.body, fontSize: 12.5, color: colors.muted },
  csvBtn: {
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ui.brandSoft,
    borderWidth: 1,
    borderColor: ui.border,
  },
  csvBtnEmpty: { opacity: 0.5 },
  csvText: { fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 0.4, color: colors.forest },
  bottom: { height: spacing.xl },
});
