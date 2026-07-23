import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { AdminListShell, adminListShellStyles } from '@/components/kit/AdminListShell';
import { customerScrollProps } from '@/components/kit/GlassScreenKit';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { api, getApiErrorMessage, safeAsync, screenLoadConfig } from '@/lib/api';
import { adminRoutes } from '@/lib/routes';
import type { LeaveRequest } from '@/types/api';
import { fonts, spacing } from '@/constants/theme';

export default function AdminLeaveScreen() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');

  const load = useCallback(async () => {
    setError(null);
    const res = await api.get<{ leaves: LeaveRequest[] }>('/leave', {
      ...screenLoadConfig,
      params: { status: filter },
    });
    setLeaves(res.data.leaves);
  }, [filter]);

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
    try {
      await api.post(`/leave/${id}/${action}`);
      Toast.show({ type: 'success', text1: action === 'approve' ? 'Leave approved' : 'Leave rejected' });
      await load();
    } catch (err) {
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Could not update leave') });
    }
  }

  function confirm(id: string, action: 'approve' | 'reject') {
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
        {(['pending', 'approved', 'rejected'] as const).map((f) => (
          <Pressable key={f} style={[styles.tab, filter === f && styles.tabOn]} onPress={() => setFilter(f)}>
            <Text style={[styles.tabText, filter === f && styles.tabTextOn]}>{f}</Text>
          </Pressable>
        ))}
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
            />
          }
          {...customerScrollProps}
        >
          {leaves.length === 0 ? (
            <Text style={styles.empty}>No {filter} leave requests</Text>
          ) : (
            leaves.map((l) => (
              <View key={l.id} style={styles.card}>
                <Text style={styles.name}>{l.technicianName || 'Technician'}</Text>
                <Text style={styles.meta}>
                  {l.from === l.to ? l.from : `${l.from} → ${l.to}`} · {l.type}
                </Text>
                {l.reason ? <Text style={styles.reason}>{l.reason}</Text> : null}
                {l.status === 'pending' ? (
                  <View style={styles.actions}>
                    <Pressable style={styles.approve} onPress={() => confirm(l.id, 'approve')}>
                      <Text style={styles.approveText}>Approve</Text>
                    </Pressable>
                    <Pressable style={styles.reject} onPress={() => confirm(l.id, 'reject')}>
                      <Text style={styles.rejectText}>Reject</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Text style={styles.status}>{l.status}</Text>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </AdminListShell>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: spacing.md, marginBottom: 8 },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  tabOn: { backgroundColor: '#0A6423' },
  tabText: { fontFamily: fonts.bodySemi, fontSize: 13, color: '#5A7360', textTransform: 'capitalize' },
  tabTextOn: { color: '#FFFFFF' },
  content: { gap: 10 },
  empty: { textAlign: 'center', marginTop: 40, fontFamily: fonts.body, color: '#8FA696' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 4,
  },
  name: { fontFamily: fonts.bodyBold, fontSize: 16, color: '#0C1F12' },
  meta: { fontFamily: fonts.body, fontSize: 13, color: '#5A7360' },
  reason: { marginTop: 4, fontFamily: fonts.body, fontSize: 13, color: '#0C1F12' },
  status: { marginTop: 8, fontFamily: fonts.bodySemi, fontSize: 12, color: '#5A7360', textTransform: 'capitalize' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  approve: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#0A6423',
  },
  approveText: { fontFamily: fonts.bodyBold, color: '#FFFFFF' },
  reject: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FBE7E1',
  },
  rejectText: { fontFamily: fonts.bodyBold, color: '#B33F28' },
});
