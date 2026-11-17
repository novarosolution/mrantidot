import { useStaleFocusRefresh } from '@/lib/useStaleFocusRefresh';
import { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { AdminFilterChips } from '@/components/kit/AdminPageKit';
import { AdminListShell, adminListShellStyles } from '@/components/kit/AdminListShell';
import { GlassPanel, customerScrollProps } from '@/components/kit/GlassScreenKit';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { api, getApiErrorMessage, safeAsync, screenLoadConfig } from '@/lib/api';
import { adminRoutes } from '@/lib/routes';
import type { LeaveRequest } from '@/types/api';
import { colors, fonts, premium, spacing, surfaces } from '@/constants/theme';

const FILTERS = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
] as const;

export default function AdminLeaveScreen() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const res = await api.get<{ leaves: LeaveRequest[] }>('/leave', {
      ...screenLoadConfig,
      params: { status: filter },
    });
    setLeaves(res.data.leaves);
  }, [filter]);

  useStaleFocusRefresh(() => load().catch(() => undefined), 15_000);

  useEffect(() => {
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

  async function decide(id: string, action: 'approve' | 'reject') {
    if (busyId) return;
    setBusyId(`${id}:${action}`);
    try {
      await api.post(`/leave/${id}/${action}`);
      Toast.show({ type: 'success', text1: action === 'approve' ? 'Leave approved' : 'Leave rejected' });
      await load();
    } catch (err) {
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Could not update leave') });
    } finally {
      setBusyId(null);
    }
  }

  function confirm(id: string, action: 'approve' | 'reject') {
    if (busyId) return;
    Alert.alert(
      action === 'approve' ? 'Approve leave?' : 'Reject leave?',
      action === 'approve' ? 'Attendance will be marked as leave for these dates.' : undefined,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action === 'approve' ? 'Approve' : 'Reject',
          style: action === 'approve' ? 'default' : 'destructive',
          onPress: () => void decide(id, action),
        },
      ],
    );
  }

  return (
    <AdminListShell title="Leave requests" subtitle="Approve technician time off" backFallback={adminRoutes.team}>
      <View style={styles.tabs}>
        <AdminFilterChips
          inset
          chips={FILTERS.map((f) => ({ key: f.key, label: f.label }))}
          selected={filter}
          onSelect={(key) => setFilter(key as typeof filter)}
        />
      </View>
      {loading ? (
        <Spinner />
      ) : error && leaves.length === 0 ? (
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
          {leaves.length === 0 ? (
            <EmptyState
              title={`No ${filter} requests`}
              message={filter === 'pending' ? 'New time-off requests from technicians show up here.' : undefined}
            />
          ) : (
            leaves.map((l) => {
              const approving = busyId === `${l.id}:approve`;
              const rejecting = busyId === `${l.id}:reject`;
              const rowBusy = Boolean(busyId?.startsWith(`${l.id}:`));
              return (
                <GlassPanel key={l.id} goldEdge tone="light" style={styles.card}>
                  <Text style={styles.name}>{l.technicianName || 'Technician'}</Text>
                  <Text style={styles.meta}>
                    {l.from === l.to ? l.from : `${l.from} → ${l.to}`} · {l.type}
                  </Text>
                  {l.reason ? <Text style={styles.reason}>{l.reason}</Text> : null}
                  {l.status === 'pending' ? (
                    <View style={styles.actions}>
                      <Button
                        title="Approve"
                        variant="premium"
                        size="md"
                        fullWidth={false}
                        style={styles.actionBtn}
                        loading={approving}
                        disabled={rowBusy}
                        onPress={() => confirm(l.id, 'approve')}
                      />
                      <Button
                        title="Reject"
                        variant="danger"
                        size="md"
                        fullWidth={false}
                        style={styles.actionBtn}
                        loading={rejecting}
                        disabled={rowBusy}
                        onPress={() => confirm(l.id, 'reject')}
                      />
                    </View>
                  ) : (
                    <View style={styles.statusPill}>
                      <Text style={styles.status}>{l.status}</Text>
                    </View>
                  )}
                </GlassPanel>
              );
            })
          )}
        </ScrollView>
      )}
    </AdminListShell>
  );
}

const styles = StyleSheet.create({
  tabs: { paddingBottom: spacing.xs },
  content: { gap: 12 },
  card: { borderRadius: premium.radiusCard },
  name: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.ink },
  meta: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 4 },
  reason: { marginTop: 8, fontFamily: fonts.body, fontSize: 13, color: colors.ink, lineHeight: 18 },
  statusPill: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: surfaces.glassSoft,
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
  },
  status: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.muted, textTransform: 'capitalize' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  actionBtn: { flex: 1 },
});
