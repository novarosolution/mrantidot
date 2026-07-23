import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AdminListShell, adminListShellStyles } from '@/components/kit/AdminListShell';
import { formatRupee } from '@/components/kit/format';
import { customerScrollProps } from '@/components/kit/GlassScreenKit';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { api, safeAsync, screenLoadConfig } from '@/lib/api';
import { adminRoutes, appPush } from '@/lib/routes';
import type { PayrollRow } from '@/types/api';
import { fonts } from '@/constants/theme';

export default function AdminPayrollScreen() {
  const [rows, setRows] = useState<PayrollRow[]>([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalJobs, setTotalJobs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const res = await api.get<{
      from: string;
      to: string;
      totalEarnings: number;
      totalJobs: number;
      technicians: PayrollRow[];
    }>('/admin/payroll', screenLoadConfig);
    setRows(res.data.technicians);
    setFrom(res.data.from);
    setTo(res.data.to);
    setTotalEarnings(res.data.totalEarnings);
    setTotalJobs(res.data.totalJobs);
  }, []);

  useEffect(() => {
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

  return (
    <AdminListShell title="Payroll" subtitle="Technician earnings this period" backFallback={adminRoutes.team}>
      {loading ? (
        <Spinner />
      ) : error && rows.length === 0 ? (
        <ListEmptyRetry message={error} onRetry={() => void load()} />
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
                } finally {
                  setRefreshing(false);
                }
              }}
            />
          }
          {...customerScrollProps}
        >
          <View style={styles.summary}>
            <Text style={styles.period}>
              {from} → {to}
            </Text>
            <Text style={styles.total}>{formatRupee(totalEarnings)}</Text>
            <Text style={styles.sub}>{totalJobs} completed jobs this period</Text>
          </View>

          {rows.map((r) => (
            <Pressable
              key={r.technicianId}
              style={styles.card}
              onPress={() => appPush(adminRoutes.technician(r.technicianId))}
            >
              <View style={styles.rowTop}>
                <Text style={styles.name}>{r.name}</Text>
                <Text style={styles.earn}>{formatRupee(r.earnings)}</Text>
              </View>
              <Text style={styles.meta}>
                {r.jobsCompleted} jobs · {r.paySummary}
                {r.disabled ? ' · Disabled' : r.available ? '' : ' · Off duty'}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </AdminListShell>
  );
}

const styles = StyleSheet.create({
  content: { gap: 10 },
  summary: {
    backgroundColor: '#0A6423',
    borderRadius: 18,
    padding: 18,
    marginBottom: 6,
  },
  period: { fontFamily: fonts.body, fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  total: {
    marginTop: 6,
    fontFamily: fonts.displayExtra,
    fontSize: 28,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  sub: { marginTop: 4, fontFamily: fonts.body, fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
  },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  name: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 15, color: '#0C1F12' },
  earn: { fontFamily: fonts.displaySemi, fontSize: 16, color: '#0A6423' },
  meta: { marginTop: 4, fontFamily: fonts.body, fontSize: 12, color: '#5A7360' },
});
