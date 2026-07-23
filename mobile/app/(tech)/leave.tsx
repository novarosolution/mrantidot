import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { CustomerPageHeader } from '@/components/kit/CustomerPageHeader';
import { GlassBackdrop, TAB_BAR_SCROLL_PAD, customerScrollProps } from '@/components/kit/GlassScreenKit';
import { Button } from '@/components/ui/Button';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { textInputDefaults } from '@/components/ui/textInputDefaults';
import { api, getApiErrorMessage, safeAsync, screenLoadConfig } from '@/lib/api';
import { localDateKey } from '@/lib/dates';
import { techGoBack } from '@/lib/routes';
import type { LeaveRequest, LeaveType } from '@/types/api';
import { colors, fonts, spacing } from '@/constants/theme';

const TYPES: { key: LeaveType; label: string }[] = [
  { key: 'casual', label: 'Casual' },
  { key: 'sick', label: 'Sick' },
  { key: 'emergency', label: 'Emergency' },
  { key: 'other', label: 'Other' },
];

function addDays(key: string, n: number): string {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(y, m - 1, d + n);
  return localDateKey(dt);
}

export default function TechLeaveScreen() {
  const today = localDateKey();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [type, setType] = useState<LeaveType>('casual');
  const [reason, setReason] = useState('');

  const load = useCallback(async () => {
    setError(null);
    const res = await api.get<{ leaves: LeaveRequest[] }>('/leave/me', screenLoadConfig);
    setLeaves(res.data.leaves);
  }, []);

  useEffect(() => {
    safeAsync(async () => {
      try {
        await load();
      } finally {
        setLoading(false);
      }
    }, undefined, (msg) => setError(msg));
  }, [load]);

  async function submit() {
    if (to < from) {
      Alert.alert('Invalid dates', 'End date must be on or after start date');
      return;
    }
    setSaving(true);
    try {
      await api.post('/leave', { from, to, type, reason: reason.trim() || undefined });
      Toast.show({ type: 'success', text1: 'Leave requested' });
      setReason('');
      await load();
    } catch (err) {
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Could not request leave') });
    } finally {
      setSaving(false);
    }
  }

  async function cancelLeave(id: string) {
    try {
      await api.post(`/leave/${id}/cancel`);
      Toast.show({ type: 'success', text1: 'Leave cancelled' });
      await load();
    } catch (err) {
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Could not cancel') });
    }
  }

  return (
    <View style={styles.root}>
      <GlassBackdrop />
      <SafeAreaView style={styles.safe} edges={['left', 'right', 'top']}>
        <CustomerPageHeader title="Leave" onBack={() => techGoBack()} />
        {loading ? (
          <Spinner />
        ) : error && leaves.length === 0 ? (
          <ListEmptyRetry message={error} onRetry={() => void load()} />
        ) : (
          <ScrollView
            contentContainerStyle={styles.content}
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
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Request leave</Text>
              <Text style={styles.hint}>Admin must approve. Approved days mark attendance as leave.</Text>

              <Text style={styles.label}>From (YYYY-MM-DD)</Text>
              <TextInput
                {...textInputDefaults}
                style={styles.input}
                value={from}
                onChangeText={setFrom}
                placeholder={today}
                autoCapitalize="none"
              />
              <View style={styles.quickRow}>
                <Pressable style={styles.chip} onPress={() => { setFrom(today); setTo(today); }}>
                  <Text style={styles.chipText}>Today</Text>
                </Pressable>
                <Pressable
                  style={styles.chip}
                  onPress={() => {
                    const t = addDays(today, 1);
                    setFrom(t);
                    setTo(t);
                  }}
                >
                  <Text style={styles.chipText}>Tomorrow</Text>
                </Pressable>
              </View>

              <Text style={styles.label}>To (YYYY-MM-DD)</Text>
              <TextInput
                {...textInputDefaults}
                style={styles.input}
                value={to}
                onChangeText={setTo}
                placeholder={today}
                autoCapitalize="none"
              />

              <Text style={styles.label}>Type</Text>
              <View style={styles.quickRow}>
                {TYPES.map((t) => (
                  <Pressable
                    key={t.key}
                    style={[styles.chip, type === t.key && styles.chipOn]}
                    onPress={() => setType(t.key)}
                  >
                    <Text style={[styles.chipText, type === t.key && styles.chipTextOn]}>{t.label}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.label}>Reason (optional)</Text>
              <TextInput
                {...textInputDefaults}
                style={[styles.input, styles.area]}
                value={reason}
                onChangeText={setReason}
                placeholder="Short note for admin"
                multiline
              />

              <Button title="Submit request" onPress={() => void submit()} loading={saving} />
            </View>

            <Text style={styles.section}>Your requests</Text>
            {leaves.length === 0 ? (
              <Text style={styles.empty}>No leave requests yet</Text>
            ) : (
              leaves.map((l) => (
                <View key={l.id} style={styles.row}>
                  <View style={styles.rowBody}>
                    <Text style={styles.rowTitle}>
                      {l.from === l.to ? l.from : `${l.from} → ${l.to}`}
                    </Text>
                    <Text style={styles.rowSub}>
                      {l.type} · {l.status}
                      {l.reason ? ` · ${l.reason}` : ''}
                    </Text>
                  </View>
                  {l.status === 'pending' ? (
                    <Pressable onPress={() => void cancelLeave(l.id)} hitSlop={8}>
                      <Text style={styles.cancel}>Cancel</Text>
                    </Pressable>
                  ) : null}
                </View>
              ))
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F6F8F5' },
  safe: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: TAB_BAR_SCROLL_PAD + 24, gap: 12 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    gap: 8,
  },
  cardTitle: { fontFamily: fonts.displaySemi, fontSize: 18, color: '#0C1F12' },
  hint: { fontFamily: fonts.body, fontSize: 13, color: '#5A7360', marginBottom: 8 },
  label: { marginTop: 6, fontFamily: fonts.bodySemi, fontSize: 12, color: '#5A7360' },
  input: {
    borderWidth: 1,
    borderColor: '#E2EED9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontFamily: fonts.body,
    fontSize: 15,
    color: '#0C1F12',
    backgroundColor: '#FAFCFA',
  },
  area: { minHeight: 72, textAlignVertical: 'top' },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#EEF4EF',
  },
  chipOn: { backgroundColor: '#0A6423' },
  chipText: { fontFamily: fonts.bodySemi, fontSize: 12, color: '#0A6423' },
  chipTextOn: { color: '#FFFFFF' },
  section: {
    marginTop: 8,
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: '#5A7360',
    textTransform: 'uppercase',
  },
  empty: { fontFamily: fonts.body, fontSize: 14, color: '#8FA696' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
  },
  rowBody: { flex: 1, minWidth: 0 },
  rowTitle: { fontFamily: fonts.bodySemi, fontSize: 14, color: '#0C1F12' },
  rowSub: { marginTop: 2, fontFamily: fonts.body, fontSize: 12, color: '#5A7360' },
  cancel: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.error },
});
