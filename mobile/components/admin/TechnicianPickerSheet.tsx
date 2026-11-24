import { Ban, Check, Search, Star, TriangleAlert, X } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { initials } from '@/components/kit/format';
import { Button } from '@/components/ui/Button';
import { SheetModal } from '@/components/ui/SheetModal';
import { Skeleton } from '@/components/ui/Skeleton';
import { colors, fonts, spacing, typeScale, ui } from '@/constants/theme';
import { api, getApiErrorMessage, screenLoadConfig } from '@/lib/api';
import { haptic } from '@/lib/motion';
import type { TechnicianFitReport, TechnicianFitRow } from '@/types/adminManage';

const SEARCH_FROM = 8;

/**
 * Assign picker that explains fit: GET /admin/technicians/fit?bookingId= lists every active technician as a
 * good fit, possible (warnings such as "Off on Sundays", "No termite skill", "3/3 jobs today") or not available
 * ("On leave", "Off duty today", a job in the same slot). A good fit assigns on tap; a warning asks once
 * inline; unavailable rows can't be picked. Assigns with PATCH /bookings/:id/assign.
 *
 *   <TechnicianPickerSheet visible={open} bookingId={booking.id} onClose={() => setOpen(false)} onAssigned={reload} />
 */
export function TechnicianPickerSheet({
  visible,
  bookingId,
  onClose,
  onAssigned,
  title = 'Assign technician',
}: {
  visible: boolean;
  bookingId: string | null | undefined;
  onClose: () => void;
  /** Runs after a successful assign (reload the booking / list). */
  onAssigned?: (technician: { id: string; name: string }) => void;
  title?: string;
}) {
  const [report, setReport] = useState<TechnicianFitReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [confirming, setConfirming] = useState<string | null>(null);
  const [assigning, setAssigning] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!bookingId) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<TechnicianFitReport>('/admin/technicians/fit', { ...screenLoadConfig, params: { bookingId } });
      setReport(data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load technicians'));
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    if (!visible) return;
    setQuery('');
    setConfirming(null);
    setReport(null);
    void load();
  }, [visible, load]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (report?.technicians ?? []).filter((t) => !q || t.name.toLowerCase().includes(q) || (t.phone ?? '').includes(q));
  }, [report, query]);
  const groups: { key: TechnicianFitRow['fit']; title: string; hint: string; items: TechnicianFitRow[] }[] = [
    { key: 'good', title: 'Best fit', hint: 'Free and covers this visit', items: rows.filter((r) => r.fit === 'good') },
    { key: 'warn', title: 'Possible', hint: 'You can assign them — check the reason first', items: rows.filter((r) => r.fit === 'warn') },
    { key: 'blocked', title: 'Not available', hint: 'Can’t take this visit', items: rows.filter((r) => r.fit === 'blocked') },
  ];

  async function assign(t: TechnicianFitRow) {
    if (!bookingId || assigning) return;
    setAssigning(t.id);
    try {
      await api.patch(`/bookings/${bookingId}/assign`, { technicianId: t.id }, { skipErrorToast: true });
      haptic('success');
      Toast.show({ type: 'success', text1: `${t.name} assigned`, text2: t.fit === 'warn' ? t.summary : undefined });
      onAssigned?.({ id: t.id, name: t.name });
      onClose();
    } catch (err) {
      haptic('error');
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Could not assign technician') });
      void load();
    } finally {
      setAssigning(null);
    }
  }

  function press(t: TechnicianFitRow) {
    if (t.current) {
      Toast.show({ type: 'info', text1: `${t.name} is already on this visit` });
      return;
    }
    if (!t.canAssign) return;
    if (t.fit === 'warn' && confirming !== t.id) {
      haptic('warning');
      setConfirming(t.id);
      return;
    }
    void assign(t);
  }

  const visit = report?.visit;
  const header = (
    <View style={styles.head}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.sub} numberOfLines={2}>
        {visit
          ? [visit.serviceName, visit.when, visit.pestTypes.length ? visit.pestTypes.map((p) => p.label).join(', ') : ''].filter(Boolean).join(' · ')
          : 'Checking who can take this visit…'}
      </Text>
    </View>
  );

  return (
    <SheetModal visible={visible} onClose={() => (assigning ? undefined : onClose())} dialogWidth={560} keyboardAvoiding header={header}>
      <View style={styles.body}>
        {(report?.technicians.length ?? 0) >= SEARCH_FROM ? (
          <View style={styles.search}>
            <Search size={16} color={ui.textTertiary} strokeWidth={2.2} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search technicians"
              placeholderTextColor={ui.textTertiary}
              style={styles.searchInput}
              autoCorrect={false}
              autoCapitalize="none"
              accessibilityLabel="Search technicians"
            />
            {query ? (
              <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="Clear search">
                <X size={15} color={ui.textTertiary} strokeWidth={2.4} />
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
          {loading && !report ? (
            <View style={styles.skeletons} accessibilityRole="progressbar" accessibilityLabel="Loading technicians">
              {Array.from({ length: 4 }, (_, i) => (
                <View key={i} style={styles.skeletonRow}>
                  <Skeleton width={36} height={36} radius={18} />
                  <View style={styles.flex}>
                    <Skeleton width="55%" height={13} />
                    <Skeleton width="80%" height={11} style={styles.skelGap} />
                  </View>
                </View>
              ))}
            </View>
          ) : error ? (
            <View style={styles.state}>
              <Text style={styles.stateText}>{error}</Text>
              <Button title="Try again" variant="outline" size="sm" fullWidth={false} onPress={() => void load()} />
            </View>
          ) : report && report.technicians.length === 0 ? (
            <View style={styles.state}>
              <Text style={styles.stateTitle}>No active technicians</Text>
              <Text style={styles.stateText}>Add a technician (Team → Technicians) to assign this visit.</Text>
            </View>
          ) : rows.length === 0 && report ? (
            <Text style={styles.stateText}>No technician matches “{query.trim()}”.</Text>
          ) : (
            groups
              .filter((g) => g.items.length > 0)
              .map((g) => (
                <View key={g.key} style={styles.group}>
                  <Text style={styles.groupTitle}>
                    {g.title} · {g.items.length}
                  </Text>
                  <Text style={styles.groupHint}>{g.hint}</Text>
                  {g.items.map((t) => {
                    const open = confirming === t.id;
                    const busy = assigning === t.id;
                    return (
                      <View key={t.id} style={[styles.row, open && styles.rowOpen, !t.canAssign && styles.rowOff]}>
                        <Pressable
                          onPress={() => press(t)}
                          disabled={!t.canAssign || Boolean(assigning)}
                          style={({ pressed }) => [styles.rowMain, pressed && styles.pressed]}
                          accessibilityRole="button"
                          accessibilityState={{ disabled: !t.canAssign, busy }}
                          accessibilityLabel={`${t.name}. ${t.summary}${t.current ? '. Assigned now' : ''}${t.canAssign ? '' : '. Not available'}`}
                        >
                          <View style={[styles.avatar, t.fit === 'good' ? styles.avatarGood : t.fit === 'warn' ? styles.avatarWarn : styles.avatarOff]}>
                            <Text style={styles.avatarText}>{initials(t.name)}</Text>
                          </View>
                          <View style={styles.flex}>
                            <View style={styles.nameRow}>
                              <Text style={styles.name} numberOfLines={1}>
                                {t.name}
                              </Text>
                              {t.current ? <Text style={[styles.badge, styles.badgeCurrent]}>Assigned</Text> : null}
                              {t.preferred ? <Text style={[styles.badge, styles.badgePreferred]}>Customer’s pick</Text> : null}
                            </View>
                            {t.fit === 'good' ? (
                              <Text style={styles.meta} numberOfLines={1}>
                                {[t.summary, t.city].filter(Boolean).join(' · ')}
                              </Text>
                            ) : (
                              <View style={styles.reasons}>
                                {t.reasons.map((r) => (
                                  <View key={r.code + r.text} style={[styles.reason, r.severity === 'block' ? styles.reasonBlock : styles.reasonWarn]}>
                                    {r.severity === 'block' ? (
                                      <Ban size={11} color={colors.error} strokeWidth={2.6} />
                                    ) : (
                                      <TriangleAlert size={11} color={colors.amberInk} strokeWidth={2.6} />
                                    )}
                                    <Text style={[styles.reasonText, r.severity === 'block' ? styles.reasonTextBlock : styles.reasonTextWarn]}>{r.text}</Text>
                                  </View>
                                ))}
                              </View>
                            )}
                          </View>
                          <View style={styles.right}>
                            {t.rating > 0 ? (
                              <View style={styles.rating}>
                                <Star size={11} color={ui.text} fill={ui.text} strokeWidth={1.5} />
                                <Text style={styles.ratingText}>{t.rating.toFixed(1)}</Text>
                              </View>
                            ) : null}
                            {t.fit === 'good' && !t.current ? <Check size={16} color={colors.forest} strokeWidth={2.6} /> : null}
                          </View>
                        </Pressable>
                        {open ? (
                          <View style={styles.confirm}>
                            <Text style={styles.confirmText}>Assign {t.name} anyway?</Text>
                            <View style={styles.confirmActions}>
                              <Button title="Back" variant="outline" size="sm" fullWidth={false} disabled={busy} onPress={() => setConfirming(null)} />
                              <Button title="Assign anyway" variant="premium" size="sm" fullWidth={false} loading={busy} onPress={() => void assign(t)} />
                            </View>
                          </View>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              ))
          )}
        </ScrollView>
      </View>
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: spacing.md + 4, paddingTop: 4, paddingBottom: 4 },
  title: { ...typeScale.section, fontSize: 19, lineHeight: 25, color: ui.text },
  sub: { ...typeScale.caption, marginTop: 4, color: ui.textSecondary },
  body: { paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  scroll: { maxHeight: 520 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 44,
    paddingHorizontal: 12,
    marginTop: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: colors.white,
  },
  searchInput: { flex: 1, fontFamily: fonts.body, fontSize: 15, color: ui.text, paddingVertical: 0 },
  skeletons: { gap: 14, paddingVertical: spacing.md },
  skeletonRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  skelGap: { marginTop: 6 },
  state: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg },
  stateTitle: { fontFamily: fonts.bodyBold, fontSize: 15, color: ui.text },
  stateText: { ...typeScale.caption, color: ui.textSecondary, textAlign: 'center', paddingVertical: spacing.sm },
  group: { marginTop: spacing.md },
  groupTitle: { fontFamily: fonts.bodyBold, fontSize: 13, color: ui.text },
  groupHint: { ...typeScale.caption, color: ui.textTertiary, marginBottom: 6 },
  row: { borderRadius: 14, borderWidth: 1, borderColor: ui.hairline, backgroundColor: colors.white, marginBottom: 8 },
  rowOpen: { borderColor: colors.amber },
  rowOff: { backgroundColor: ui.surfaceMuted },
  rowMain: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  pressed: { opacity: 0.75 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarGood: { backgroundColor: colors.forest },
  avatarWarn: { backgroundColor: colors.amberInk },
  avatarOff: { backgroundColor: ui.textTertiary },
  avatarText: { fontFamily: fonts.displayExtra, fontSize: 12, color: colors.white },
  flex: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  name: { flexShrink: 1, fontFamily: fonts.bodyBold, fontSize: 14.5, color: ui.text },
  badge: { fontFamily: fonts.bodySemi, fontSize: 10.5, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, overflow: 'hidden' },
  badgeCurrent: { backgroundColor: ui.brandSoft, color: colors.forest },
  badgePreferred: { backgroundColor: colors.blueBg, color: colors.blue },
  meta: { fontFamily: fonts.body, fontSize: 12, color: ui.textSecondary, marginTop: 2 },
  reasons: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 4 },
  reason: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999 },
  reasonWarn: { backgroundColor: colors.amberBg },
  reasonBlock: { backgroundColor: colors.errorBg },
  reasonText: { fontFamily: fonts.bodySemi, fontSize: 11 },
  reasonTextWarn: { color: colors.amberInk },
  reasonTextBlock: { color: colors.error },
  right: { alignItems: 'flex-end', gap: 6 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { fontFamily: fonts.bodySemi, fontSize: 12, color: ui.text },
  confirm: { paddingHorizontal: 12, paddingBottom: 12, gap: 8 },
  confirmText: { fontFamily: fonts.bodySemi, fontSize: 13, color: ui.text },
  confirmActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
});
