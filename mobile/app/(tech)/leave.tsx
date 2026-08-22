import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { CustomerPageHeader } from '@/components/kit/CustomerPageHeader';
import { GlassPanel, GlassSectionLabel, customerScrollProps } from '@/components/kit/GlassScreenKit';
import { TechScreen, TechScreenScroll, TECH_TAB_BAR_PAD } from '@/components/kit/TechScreenKit';
import { Button } from '@/components/ui/Button';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { textInputDefaults } from '@/components/ui/textInputDefaults';
import { api, getApiErrorMessage, safeAsync, screenLoadConfig } from '@/lib/api';
import { localDateKey } from '@/lib/dates';
import { techGoBack, techRoutes } from '@/lib/routes';
import type { LeaveRequest, LeaveStatus, LeaveType } from '@/types/api';
import { colors, fonts, formField, premium, spacing, surfaces } from '@/constants/theme';

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

function statusTone(status: LeaveStatus): { bg: string; text: string; label: string } {
  switch (status) {
    case 'approved':
      return { bg: colors.soft, text: colors.forest, label: 'Approved' };
    case 'rejected':
      return { bg: colors.errorBg, text: colors.error, label: 'Rejected' };
    case 'cancelled':
      return { bg: colors.greyBg, text: colors.muted, label: 'Cancelled' };
    default:
      return { bg: colors.amberBg, text: colors.amberInk, label: 'Pending' };
  }
}

export default function TechLeaveScreen() {
  const today = localDateKey();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
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

  function isValidDateKey(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [y, m, d] = value.split('-').map(Number);
    return localDateKey(new Date(y, m - 1, d)) === value;
  }

  async function submit() {
    if (!isValidDateKey(from) || !isValidDateKey(to)) {
      Alert.alert('Invalid dates', 'Use YYYY-MM-DD, or pick Today / Tomorrow / 3 days / 1 week.');
      return;
    }
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
    if (cancellingId) return;
    Alert.alert('Cancel leave request?', 'Admin will no longer see this pending request.', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Cancel request',
        style: 'destructive',
        onPress: () =>
          void (async () => {
            if (cancellingId) return;
            setCancellingId(id);
            try {
              await api.post(`/leave/${id}/cancel`);
              Toast.show({ type: 'success', text1: 'Leave cancelled' });
              await load();
            } catch (err) {
              Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Could not cancel') });
            } finally {
              setCancellingId(null);
            }
          })(),
      },
    ]);
  }

  const header = (
    <CustomerPageHeader
      variant="premium"
      title="Leave"
      subtitle="Request time off for approval"
      showBack
      onBack={() => techGoBack(techRoutes.home)}
    />
  );

  if (loading) {
    return (
      <TechScreen header={header} edges={['left', 'right', 'top']}>
        <Spinner />
      </TechScreen>
    );
  }

  if (error && leaves.length === 0) {
    return (
      <TechScreen header={header} edges={['left', 'right', 'top']}>
        <ListEmptyRetry message={error} onRetry={() => void load()} />
      </TechScreen>
    );
  }

  const pendingCount = leaves.filter((l) => l.status === 'pending').length;

  return (
    <TechScreen header={header} edges={['left', 'right', 'top']}>
      <TechScreenScroll
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
        <GlassPanel goldEdge tone="light">
          <Text style={styles.cardTitle}>Request leave</Text>
          <Text style={styles.hint}>
            Admin must approve. Approved days mark attendance as leave automatically.
          </Text>

          <Text style={styles.label}>From</Text>
          <TextInput
            {...textInputDefaults}
            style={styles.input}
            value={from}
            editable={false}
            placeholder={today}
            accessibilityLabel={`Leave from ${from}`}
          />
          <View style={styles.quickRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Leave today"
              style={styles.chip}
              onPress={() => {
                setFrom(today);
                setTo(today);
              }}
            >
              <Text style={styles.chipText}>Today</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Leave tomorrow"
              style={styles.chip}
              onPress={() => {
                const t = addDays(today, 1);
                setFrom(t);
                setTo(t);
              }}
            >
              <Text style={styles.chipText}>Tomorrow</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Leave for 3 days"
              style={styles.chip}
              onPress={() => {
                setFrom(today);
                setTo(addDays(today, 2));
              }}
            >
              <Text style={styles.chipText}>3 days</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Leave for 1 week"
              style={styles.chip}
              onPress={() => {
                setFrom(today);
                setTo(addDays(today, 6));
              }}
            >
              <Text style={styles.chipText}>1 week</Text>
            </Pressable>
          </View>

          <Text style={styles.label}>To</Text>
          <TextInput
            {...textInputDefaults}
            style={styles.input}
            value={to}
            editable={false}
            placeholder={today}
            accessibilityLabel={`Leave until ${to}`}
          />

          <Text style={styles.label}>Type</Text>
          <View style={styles.quickRow}>
            {TYPES.map((t) => (
              <Pressable
                key={t.key}
                accessibilityRole="button"
                accessibilityState={{ selected: type === t.key }}
                accessibilityLabel={`${t.label} leave`}
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

          <Button title="Submit request" variant="premium" onPress={() => void submit()} loading={saving} />
        </GlassPanel>

        <GlassSectionLabel
          title="Your requests"
          hint={
            leaves.length
              ? `${leaves.length} total${pendingCount ? ` · ${pendingCount} pending` : ''}`
              : undefined
          }
        />
        {leaves.length === 0 ? (
          <GlassPanel tone="mint">
            <Text style={styles.emptyTitle}>No leave requests yet</Text>
            <Text style={styles.empty}>Submit above when you need time off.</Text>
          </GlassPanel>
        ) : (
          leaves.map((l) => {
            const tone = statusTone(l.status);
            return (
              <GlassPanel key={l.id} padded={false} style={styles.rowPanel} tone="light">
                <View style={styles.row}>
                  <View style={styles.rowBody}>
                    <View style={styles.rowTop}>
                      <Text style={styles.rowTitle}>
                        {l.from === l.to ? l.from : `${l.from} → ${l.to}`}
                      </Text>
                      <View style={[styles.statusPill, { backgroundColor: tone.bg }]}>
                        <Text style={[styles.statusText, { color: tone.text }]}>{tone.label}</Text>
                      </View>
                    </View>
                    <Text style={styles.rowSub}>
                      {l.type.charAt(0).toUpperCase() + l.type.slice(1)}
                      {l.reason ? ` · ${l.reason}` : ''}
                    </Text>
                    {l.adminNote ? (
                      <Text style={styles.adminNote}>Admin: {l.adminNote}</Text>
                    ) : null}
                  </View>
                  {l.status === 'pending' ? (
                    <Button
                      title={cancellingId === l.id ? '…' : 'Cancel'}
                      variant="danger"
                      size="sm"
                      fullWidth={false}
                      loading={cancellingId === l.id}
                      disabled={Boolean(cancellingId)}
                      onPress={() => void cancelLeave(l.id)}
                      style={styles.cancelBtn}
                    />
                  ) : null}
                </View>
              </GlassPanel>
            );
          })
        )}
      </TechScreenScroll>
    </TechScreen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, paddingBottom: TECH_TAB_BAR_PAD + 24, gap: 12 },
  cardTitle: { fontFamily: fonts.displaySemi, fontSize: 18, color: colors.ink },
  hint: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginBottom: 8, lineHeight: 18 },
  label: { marginTop: 6, fontFamily: fonts.bodySemi, fontSize: 12, color: colors.muted },
  input: {
    borderWidth: formField.borderWidth,
    borderColor: formField.borderColor,
    borderRadius: formField.radius,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.ink,
    backgroundColor: formField.bg,
    minHeight: 48,
  },
  area: { minHeight: 72, textAlignVertical: 'top' },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: surfaces.glassInput,
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
  },
  chipOn: { backgroundColor: colors.forest, borderColor: colors.lime },
  chipText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.forest },
  chipTextOn: { color: colors.white },
  emptyTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.ink,
    textAlign: 'center',
  },
  empty: {
    marginTop: 4,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
  },
  rowPanel: { borderRadius: premium.radiusCard },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
  },
  rowBody: { flex: 1, minWidth: 0 },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  rowTitle: { flex: 1, fontFamily: fonts.bodySemi, fontSize: 14, color: colors.ink },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusText: { fontFamily: fonts.bodySemi, fontSize: 11 },
  rowSub: { marginTop: 4, fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  adminNote: {
    marginTop: 4,
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.forest,
  },
  cancelBtn: {
    minWidth: 88,
    paddingHorizontal: 4,
  },
});
