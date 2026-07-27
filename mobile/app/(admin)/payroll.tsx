import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AdminListShell, adminListShellStyles } from '@/components/kit/AdminListShell';
import { formatRupee } from '@/components/kit/format';
import { GlassPanel, customerScrollProps } from '@/components/kit/GlassScreenKit';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { api, safeAsync, screenLoadConfig } from '@/lib/api';
import { adminRoutes, appPush } from '@/lib/routes';
import type { PayrollRow } from '@/types/api';
import { colors, fonts, premium, spacing } from '@/constants/theme';

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
              tintColor={colors.forest}
            />
          }
          {...customerScrollProps}
        >
          <View style={styles.summaryShell}>
            <LinearGradient
              colors={['#1B873E', '#0A6423', '#043813']}
              style={styles.summary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <LinearGradient colors={['#8FD03C', '#27A747']} style={styles.summaryGold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
              <Text style={styles.period}>
                {from} → {to}
              </Text>
              <Text style={styles.total}>{formatRupee(totalEarnings)}</Text>
              <Text style={styles.sub}>{totalJobs} completed jobs this period</Text>
            </LinearGradient>
          </View>

          {rows.map((r) => (
            <Pressable
              key={r.technicianId}
              onPress={() => appPush(adminRoutes.technician(r.technicianId))}
              style={({ pressed }) => [pressed && styles.pressed]}
            >
              <GlassPanel goldEdge tone="light" style={styles.card}>
                <View style={styles.rowTop}>
                  <View style={styles.avatar}>
                    <PremiumIcon icon={AppIcons.ui.user} variant="premium" size={18} color="#FFFFFF" boxSize={42} />
                  </View>
                  <View style={styles.rowBody}>
                    <Text style={styles.name}>{r.name}</Text>
                    <Text style={styles.meta}>
                      {r.jobsCompleted} jobs · {r.paySummary}
                      {r.disabled ? ' · Disabled' : r.available ? '' : ' · Off duty'}
                    </Text>
                  </View>
                  <Text style={styles.earn}>{formatRupee(r.earnings)}</Text>
                </View>
              </GlassPanel>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </AdminListShell>
  );
}

const styles = StyleSheet.create({
  content: { gap: 12 },
  summaryShell: {
    borderRadius: premium.radiusCard,
    overflow: 'hidden',
    marginBottom: 4,
    ...premium.shadowSoft,
  },
  summary: {
    borderRadius: premium.radiusCard,
    padding: 18,
    paddingTop: 22,
    overflow: 'hidden',
  },
  summaryGold: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
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
  pressed: { opacity: 0.94, transform: [{ scale: 0.99 }] },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {},
  rowBody: { flex: 1, minWidth: 0 },
  name: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink },
  earn: { fontFamily: fonts.displaySemi, fontSize: 16, color: colors.forest },
  meta: { marginTop: 3, fontFamily: fonts.body, fontSize: 12, color: colors.muted },
});
