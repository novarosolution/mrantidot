import { useStaleFocusRefresh } from '@/lib/useStaleFocusRefresh';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AdminFilterChips } from '@/components/kit/AdminPageKit';
import { AdminEntrance, AdminListShell, adminListShellStyles, useListEntrance } from '@/components/kit/AdminListShell';
import { AdminListSkeleton } from '@/components/kit/AdminSkeletons';
import { formatDayKey, formatRupeeFull, initials, plural } from '@/components/kit/format';
import { GlassPanel, customerScrollProps } from '@/components/kit/GlassScreenKit';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { PressableScale } from '@/components/ui/PressableScale';
import { api, getApiErrorMessage, safeAsync, screenLoadConfig } from '@/lib/api';
import { adminRoutes, appPush } from '@/lib/routes';
import type { PayrollRow } from '@/types/api';
import { colors, fonts, premium, spacing, ui } from '@/constants/theme';

function monthKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function shiftMonth(key: string, delta: number): string {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, (m ?? 1) - 1 + delta, 1);
  return monthKey(d);
}

function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, (m ?? 1) - 1, 1);
  return d.toLocaleString('en-IN', { month: 'short', year: 'numeric' });
}

export default function AdminPayrollScreen() {
  const [month, setMonth] = useState(() => monthKey());
  const [rows, setRows] = useState<PayrollRow[]>([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalJobs, setTotalJobs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const entrance = useListEntrance(!loading);

  const periodChips = useMemo(() => {
    const current = monthKey();
    return [0, -1, -2, -3].map((delta) => {
      const key = shiftMonth(current, delta);
      return {
        key,
        label: delta === 0 ? 'This month' : monthLabel(key),
      };
    });
  }, []);

  const load = useCallback(async () => {
    setError(null);
    const res = await api.get<{
      from: string;
      to: string;
      totalEarnings: number;
      totalJobs: number;
      technicians: PayrollRow[];
    }>('/admin/payroll', {
      ...screenLoadConfig,
      params: { month },
    });
    setRows(res.data.technicians);
    setFrom(res.data.from);
    setTo(res.data.to);
    setTotalEarnings(res.data.totalEarnings);
    setTotalJobs(res.data.totalJobs);
  }, [month]);

  useStaleFocusRefresh(() => load().catch(() => undefined), 15_000);

  /** First load and month changes — shows the shimmer list while the request is in flight. */
  const loadWithSkeleton = useCallback(() => {
    setLoading(true);
    safeAsync(
      async () => {
        try {
          await load();
        } finally {
          setLoading(false);
        }
      },
      undefined,
      (msg) => setError(msg),
    );
  }, [load]);

  useEffect(() => {
    loadWithSkeleton();
  }, [loadWithSkeleton]);

  return (
    <AdminListShell title="Payroll" subtitle="Technician earnings by month" backFallback={adminRoutes.team}>
      <View style={styles.periodBar}>
        <AdminFilterChips
          chips={periodChips}
          selected={month}
          onSelect={(key) => setMonth(key)}
        />
      </View>
      {loading ? (
        <AdminListSkeleton variant="payroll" rows={4} />
      ) : error && rows.length === 0 ? (
        <ListEmptyRetry message={error} onRetry={loadWithSkeleton} />
      ) : (
        <ScrollView
          contentContainerStyle={[adminListShellStyles.scroll, styles.content]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                try {
                  await load();
                } catch (err) {
                  setError(getApiErrorMessage(err, 'Could not refresh'));
                } finally {
                  setRefreshing(false);
                }
              }}
              tintColor={colors.forest}
            />
          }
          {...customerScrollProps}
        >
          <FadeSlideIn slideFrom={14}>
            <View style={styles.summaryShell}>
              <LinearGradient
                colors={[colors.headerGreen, colors.forest, colors.forestDeep]}
                style={styles.summary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.period}>
                  {formatDayKey(from)} – {formatDayKey(to)}
                </Text>
                <Text style={styles.total} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                  {formatRupeeFull(totalEarnings)}
                </Text>
                <Text style={styles.sub}>
                  {plural(totalJobs, 'completed job')} · {monthLabel(month)}
                </Text>
              </LinearGradient>
            </View>
          </FadeSlideIn>

          {rows.length === 0 ? (
            <EmptyState title="No technicians yet" message="Earnings show here once technicians complete jobs." />
          ) : null}

          {rows.map((r, i) => (
            <AdminEntrance key={r.technicianId} index={i + 1} play={entrance(i)}>
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel={`Open ${r.name} profile`}
                onPress={() => appPush(adminRoutes.technician(r.technicianId))}
                scaleTo={0.98}
              >
                <GlassPanel goldEdge tone="light" style={styles.card}>
                  <View style={styles.rowTop}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{initials(r.name)}</Text>
                    </View>
                    <View style={styles.rowBody}>
                      <Text style={styles.name} numberOfLines={1}>
                        {r.name}
                      </Text>
                      <Text style={styles.meta} numberOfLines={2}>
                        {plural(r.jobsCompleted, 'job')} · {r.paySummary}
                        {r.disabled ? ' · Disabled' : r.available ? '' : ' · Off duty'}
                      </Text>
                    </View>
                    <Text style={styles.earn} numberOfLines={1}>
                      {formatRupeeFull(r.earnings)}
                    </Text>
                  </View>
                </GlassPanel>
              </PressableScale>
            </AdminEntrance>
          ))}
        </ScrollView>
      )}
    </AdminListShell>
  );
}

const styles = StyleSheet.create({
  periodBar: { paddingLeft: spacing.md, paddingTop: spacing.sm },
  content: { gap: 12 },
  summaryShell: {
    borderRadius: premium.radiusCard,
    marginBottom: 4,
    ...ui.shadowFloat,
  },
  summary: {
    borderRadius: premium.radiusCard,
    padding: 18,
    paddingTop: 22,
    overflow: 'hidden',
  },
  period: { fontFamily: fonts.body, fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  total: {
    marginTop: 6,
    fontFamily: fonts.displayExtra,
    fontSize: 28,
    color: colors.white,
    letterSpacing: -0.5,
  },
  sub: { marginTop: 4, fontFamily: fonts.body, fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  card: { borderRadius: premium.radiusCard },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.displayExtra, fontSize: 14, color: colors.forest },
  rowBody: { flex: 1, minWidth: 0 },
  name: { fontFamily: fonts.bodyBold, fontSize: 15, color: ui.text },
  earn: { fontFamily: fonts.displaySemi, fontSize: 16, color: colors.forest },
  meta: { marginTop: 3, fontFamily: fonts.body, fontSize: 12, color: ui.textSecondary },
});
