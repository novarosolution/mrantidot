import * as Clipboard from 'expo-clipboard';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { AdminLightHeader } from '@/components/kit/AdminLightHeader';
import { AdminSectionTitle } from '@/components/kit/AdminListShell';
import { GlassPanel, GlassScreen } from '@/components/kit/GlassScreenKit';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { Button } from '@/components/ui/Button';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { AppIcons } from '@/constants/appIcons';
import { api, getApiErrorMessage, screenLoadConfig } from '@/lib/api';
import { adminRoutes } from '@/lib/routes';
import { useScreenLoad } from '@/lib/useScreenLoad';
import { colors, fonts, premiumType, spacing, surfaces } from '@/constants/theme';

type ExportSummary = {
  users: number;
  customers: number;
  technicians: number;
  admins: number;
  bookings: number;
  services: number;
  offers: number;
  reviews: number;
  leaveRequests: number;
  attendanceRecords: number;
};

type ExportCsvKey =
  | 'users'
  | 'customers'
  | 'technicians'
  | 'bookings'
  | 'services'
  | 'offers'
  | 'reviews'
  | 'leaveRequests'
  | 'attendance';

type AdminExportBundle = {
  exportedAt: string;
  version: number;
  summary: ExportSummary;
  csv: Record<ExportCsvKey, string>;
  users: unknown[];
  services: unknown[];
  offers: unknown[];
  bookings: unknown[];
  reviews: unknown[];
  leaveRequests: unknown[];
  attendance: unknown[];
  homeConfig: unknown;
  appConfig: unknown;
};

const CSV_SHEETS: Array<{ key: ExportCsvKey; label: string; hint: string; countKey: keyof ExportSummary }> = [
  { key: 'bookings', label: 'Bookings', hint: 'Jobs, schedules & amounts', countKey: 'bookings' },
  { key: 'customers', label: 'Customers', hint: 'Customer accounts', countKey: 'customers' },
  { key: 'technicians', label: 'Technicians', hint: 'Roster & pay fields', countKey: 'technicians' },
  { key: 'users', label: 'All users', hint: 'Every role including admins', countKey: 'users' },
  { key: 'services', label: 'Services', hint: 'Catalog pricing', countKey: 'services' },
  { key: 'offers', label: 'Offers', hint: 'Promo codes & discounts', countKey: 'offers' },
  { key: 'reviews', label: 'Reviews', hint: 'Ratings & comments', countKey: 'reviews' },
  { key: 'leaveRequests', label: 'Leave', hint: 'Technician leave requests', countKey: 'leaveRequests' },
  { key: 'attendance', label: 'Attendance', hint: 'Check-in history', countKey: 'attendanceRecords' },
];

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

async function shareText(title: string, message: string) {
  await Share.share({ title, message });
}

export default function AdminDataExportScreen() {
  const [bundle, setBundle] = useState<AdminExportBundle | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const { loading, error, runLoad, reload } = useScreenLoad();

  const load = useCallback(async () => {
    const { data } = await api.get<AdminExportBundle>('/admin/export', {
      ...screenLoadConfig,
      timeout: 90000,
    });
    setBundle(data);
  }, []);

  useEffect(() => {
    void runLoad(load, 'Could not load export data');
  }, [load, runLoad]);

  const summaryCards = useMemo(() => {
    if (!bundle) return [];
    const s = bundle.summary;
    return [
      { label: 'Bookings', value: s.bookings },
      { label: 'Customers', value: s.customers },
      { label: 'Technicians', value: s.technicians },
      { label: 'Services', value: s.services },
      { label: 'Offers', value: s.offers },
      { label: 'Reviews', value: s.reviews },
    ];
  }, [bundle]);

  async function runAction(key: string, fn: () => Promise<void>) {
    setBusy(key);
    try {
      await fn();
    } catch (err) {
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Could not share export') });
    } finally {
      setBusy(null);
    }
  }

  async function downloadAll() {
    if (!bundle) return;
    const stamp = bundle.exportedAt.slice(0, 10);
    const sections = CSV_SHEETS.map((sheet) => {
      const csv = bundle.csv[sheet.key] ?? '';
      return `### ${sheet.label}\n${csv}`;
    });
    const message = [
      `Mr Antidot — full admin data export`,
      `Generated ${formatWhen(bundle.exportedAt)}`,
      '',
      `Users ${bundle.summary.users} · Bookings ${bundle.summary.bookings} · Services ${bundle.summary.services}`,
      '',
      ...sections,
    ].join('\n\n');
    await shareText(`mrantidot-export-${stamp}`, message);
    Toast.show({ type: 'success', text1: 'Export ready to save or share' });
  }

  async function shareJson() {
    if (!bundle) return;
    const { csv: _csv, ...jsonBody } = bundle;
    const message = JSON.stringify(jsonBody, null, 2);
    await shareText('mrantidot-export.json', message);
    Toast.show({ type: 'success', text1: 'JSON export shared' });
  }

  async function copyJson() {
    if (!bundle) return;
    const { csv: _csv, ...jsonBody } = bundle;
    await Clipboard.setStringAsync(JSON.stringify(jsonBody));
    Toast.show({ type: 'success', text1: 'Full JSON copied' });
  }

  async function shareSheet(key: ExportCsvKey, label: string) {
    if (!bundle) return;
    const csv = bundle.csv[key];
    if (!csv?.trim()) {
      Toast.show({ type: 'info', text1: `No ${label.toLowerCase()} rows yet` });
      return;
    }
    await shareText(`mrantidot-${key}.csv`, csv);
    Toast.show({ type: 'success', text1: `${label} CSV ready` });
  }

  if (loading && !bundle) return <Spinner fullScreen />;

  if (error && !bundle) {
    return (
      <GlassScreen
        header={
          <AdminLightHeader
            title="Data export"
            subtitle="Download business data"
            showBack
            backFallback={adminRoutes.team}
          />
        }
      >
        <ListEmptyRetry message={error} onRetry={() => void reload(load, error)} />
      </GlassScreen>
    );
  }

  if (!bundle) return <Spinner fullScreen />;

  return (
    <GlassScreen
      header={
        <AdminLightHeader
          title="Data export"
          subtitle="Download all admin data"
          showBack
          backFallback={adminRoutes.team}
        />
      }
    >
      <GlassPanel>
        <Text style={styles.heroEyebrow}>FULL BACKUP</Text>
        <Text style={styles.heroTitle}>Export everything</Text>
        <Text style={styles.heroBody}>
          Pull bookings, people, catalog, offers, reviews, leave and attendance into CSV or JSON —
          passwords and live OTPs are excluded.
        </Text>
        <Text style={styles.meta}>Generated {formatWhen(bundle.exportedAt)}</Text>

        <View style={styles.summaryGrid}>
          {summaryCards.map((c) => (
            <View key={c.label} style={styles.summaryCell}>
              <Text style={styles.summaryValue}>{c.value}</Text>
              <Text style={styles.summaryLabel}>{c.label}</Text>
            </View>
          ))}
        </View>

        <Button
          title="Download all data"
          variant="premium"
          loading={busy === 'all'}
          onPress={() => void runAction('all', downloadAll)}
          style={{ marginTop: spacing.md }}
        />
        <View style={styles.rowBtns}>
          <Button
            title="Share JSON"
            variant="secondary"
            loading={busy === 'json'}
            onPress={() => void runAction('json', shareJson)}
            style={styles.halfBtn}
          />
          <Button
            title="Copy JSON"
            variant="outline"
            loading={busy === 'copy'}
            onPress={() => void runAction('copy', copyJson)}
            style={styles.halfBtn}
          />
        </View>
        <Button
          title="Refresh snapshot"
          variant="ghost"
          loading={busy === 'reload'}
          onPress={() => void runAction('reload', async () => { await reload(load); })}
          style={{ marginTop: spacing.sm }}
        />
      </GlassPanel>

      <AdminSectionTitle flush title="CSV sheets" hint="Share one dataset at a time" />
      <View style={styles.sheets}>
        {CSV_SHEETS.map((sheet) => {
          const count = bundle.summary[sheet.countKey];
          return (
            <Pressable
              key={sheet.key}
              style={({ pressed }) => [styles.sheetCard, pressed && styles.pressed]}
              onPress={() => void runAction(sheet.key, () => shareSheet(sheet.key, sheet.label))}
              disabled={busy === sheet.key}
            >
              <GlassPanel padded={false} style={styles.sheetPanel}>
                <View style={styles.sheetInner}>
                  <PremiumIcon
                    icon={AppIcons.ui.download}
                    variant="mint"
                    size="md"
                    color={colors.forest}
                    boxSize={42}
                  />
                  <View style={styles.sheetCopy}>
                    <Text style={styles.sheetLabel}>{sheet.label}</Text>
                    <Text style={styles.sheetHint}>
                      {sheet.hint} · {count} rows
                    </Text>
                  </View>
                  <Text style={styles.sheetAction}>{busy === sheet.key ? '…' : 'CSV'}</Text>
                </View>
              </GlassPanel>
            </Pressable>
          );
        })}
      </View>
    </GlassScreen>
  );
}

const styles = StyleSheet.create({
  heroEyebrow: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    letterSpacing: 1.1,
    color: colors.forest,
    marginBottom: 6,
  },
  heroTitle: { ...premiumType.sectionTitle, fontSize: 22, marginBottom: 8 },
  heroBody: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 21,
    color: colors.muted,
  },
  meta: {
    marginTop: 10,
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.muted,
  },
  summaryGrid: {
    marginTop: spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  summaryCell: {
    width: '31%',
    flexGrow: 1,
    minWidth: 96,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: surfaces.glassInput,
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
  },
  summaryValue: {
    fontFamily: fonts.displayExtra,
    fontSize: 20,
    color: colors.ink,
    letterSpacing: -0.4,
  },
  summaryLabel: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 11.5,
    color: colors.muted,
  },
  rowBtns: {
    flexDirection: 'row',
    gap: 10,
    marginTop: spacing.sm,
  },
  halfBtn: { flex: 1 },
  sheets: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  sheetCard: {},
  sheetPanel: { overflow: 'hidden' },
  sheetInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  sheetCopy: { flex: 1, minWidth: 0 },
  sheetLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.ink,
  },
  sheetHint: {
    marginTop: 2,
    fontFamily: fonts.body,
    fontSize: 12.5,
    color: colors.muted,
  },
  sheetAction: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 0.4,
    color: colors.forest,
  },
  pressed: { opacity: 0.88 },
});
