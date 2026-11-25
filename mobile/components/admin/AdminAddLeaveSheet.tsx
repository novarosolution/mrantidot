import { CalendarOff, Search, TriangleAlert, X } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { addDaysKey, daysInclusive, formatDayKey, formatRangeLabel, istTodayKey } from '@/components/admin/DateRangePicker';
import { InlineCalendar, type CalendarValue } from '@/components/admin/InlineCalendar';
import { AdminFilterChips } from '@/components/kit/AdminPageKit';
import { initials } from '@/components/kit/format';
import { Button } from '@/components/ui/Button';
import { SheetModal } from '@/components/ui/SheetModal';
import { Spinner } from '@/components/ui/Spinner';
import { colors, fonts, spacing, typeScale, ui } from '@/constants/theme';
import { api, getApiErrorMessage, screenLoadConfig } from '@/lib/api';
import { useBusinessSettings } from '@/lib/businessSettings';
import { haptic } from '@/lib/motion';
import { adminRoutes, appPush } from '@/lib/routes';
import { IS_WEB } from '@/lib/webAdmin';
import type { User } from '@/types/api';
import type { AdminLeaveCreateResponse, LeaveJobConflict } from '@/types/adminManage';

const NOTE_MAX = 500;
/** How far back an admin may record leave (sick days entered late). */
const PAST_DAYS = 60;

type TechPick = { id: string; name: string };

/**
 * Add leave for a technician (approved straight away): date range, type from Business settings → Lists →
 * Leave types, optional note the technician sees. POST /leave/admin. When the technician still holds visits
 * on those days the sheet lists them so they can be handed to someone else.
 */
export function AdminAddLeaveSheet({
  visible,
  onClose,
  technician,
  initialDate,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  /** Preselected technician (technician screen); without it the sheet shows a picker. */
  technician?: TechPick | null;
  /** First day to start from (e.g. the calendar day that was tapped). */
  initialDate?: string;
  onCreated?: (res: AdminLeaveCreateResponse) => void;
}) {
  const settings = useBusinessSettings();
  const today = istTodayKey();
  const activeTypes = settings.lists.leaveTypes.filter((t) => t.active);
  const types = activeTypes.length ? activeTypes : settings.lists.leaveTypes;

  const [tech, setTech] = useState<TechPick | null>(technician ?? null);
  const [range, setRange] = useState<CalendarValue>({});
  const [type, setType] = useState(types[0]?.key ?? 'casual');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ jobs: LeaveJobConflict[]; name: string; dates: string } | null>(null);
  // Technician picker (only without a preselected technician).
  const [roster, setRoster] = useState<User[] | null>(null);
  const [rosterError, setRosterError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const pendingNav = useRef<(() => void) | null>(null);

  // Fresh form each time it opens.
  useEffect(() => {
    if (!visible) return;
    setTech(technician ?? null);
    const start = initialDate ?? today;
    setRange({ from: start, to: start });
    setType(types[0]?.key ?? 'casual');
    setNote('');
    setBusy(false);
    setDone(null);
    setQuery('');
    // Reset only on open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const loadRoster = useCallback(() => {
    setRosterError(null);
    api
      .get<{ technicians: User[] }>('/admin/technicians', { ...screenLoadConfig, params: { status: 'active' } })
      .then(({ data }) => setRoster(data.technicians))
      .catch((err) => setRosterError(getApiErrorMessage(err, 'Could not load technicians')));
  }, []);

  useEffect(() => {
    if (visible && !technician && roster === null) loadRoster();
  }, [visible, technician, roster, loadRoster]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const digits = q.replace(/\D/g, '');
    return (roster ?? [])
      .filter((t) => !q || t.name.toLowerCase().includes(q) || (digits.length >= 3 && (t.phone ?? '').includes(digits)))
      .slice(0, 8);
  }, [roster, query]);

  const from = range.from;
  const to = range.to ?? range.from;
  const days = from && to ? daysInclusive(from, to) : 0;
  const canSave = Boolean(tech && from && to && type && !busy);

  async function submit() {
    if (!tech || !from || !to || busy) return;
    setBusy(true);
    try {
      const { data } = await api.post<AdminLeaveCreateResponse>(
        '/leave/admin',
        { technicianId: tech.id, from, to, type, ...(note.trim() ? { note: note.trim() } : {}) },
        { skipErrorToast: true },
      );
      haptic('success');
      const dates = formatRangeLabel({ from, to });
      Toast.show({ type: 'success', text1: 'Leave added', text2: `${tech.name} · ${dates}. They have been notified.` });
      onCreated?.(data);
      if (data.jobs.length > 0) setDone({ jobs: data.jobs, name: tech.name, dates });
      else onClose();
    } catch (err) {
      haptic('error');
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Could not add leave') });
    } finally {
      setBusy(false);
    }
  }

  // Web: Enter adds the leave (outside the multi-line note); Escape closes (SheetModal).
  const submitRef = useRef(submit);
  submitRef.current = submit;
  useEffect(() => {
    if (!IS_WEB || !visible || done) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (e.key === 'Enter' && !e.shiftKey && tag !== 'TEXTAREA' && canSave) {
        e.preventDefault();
        void submitRef.current();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible, done, canSave]);

  function openAfterClose(go: () => void) {
    pendingNav.current = go;
    onClose();
  }

  const header = (
    <View style={styles.head}>
      <Text style={styles.title}>{done ? 'Leave added' : 'Add leave'}</Text>
      <Text style={styles.sub} numberOfLines={2}>
        {done
          ? `${done.name} · ${done.dates}`
          : tech
            ? `${tech.name}${days ? ` · ${formatRangeLabel({ from: from!, to: to! })} · ${days} ${days === 1 ? 'day' : 'days'}` : ''}`
            : 'Pick a technician, the days and the type'}
      </Text>
    </View>
  );

  return (
    <SheetModal
      visible={visible}
      onClose={() => (busy ? undefined : onClose())}
      onDismissed={() => {
        const go = pendingNav.current;
        pendingNav.current = null;
        go?.();
      }}
      dialogWidth={520}
      keyboardAvoiding
      header={header}
    >
      {done ? (
        <View style={styles.body}>
          <View style={styles.warnBox}>
            <TriangleAlert size={18} color={colors.amberInk} strokeWidth={2.2} />
            <Text style={styles.warnText}>
              {done.jobs.length === 1 ? '1 visit on these days is' : `${done.jobs.length} visits on these days are`} still assigned to{' '}
              {done.name}. Hand {done.jobs.length === 1 ? 'it' : 'them'} to another technician.
            </Text>
          </View>
          {done.jobs.map((j) => (
            <Pressable
              key={j.bookingId}
              onPress={() => openAfterClose(() => appPush(adminRoutes.booking(j.bookingId)))}
              style={({ pressed }) => [styles.jobRow, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={`Open booking ${j.ref}, ${j.serviceName}`}
            >
              <View style={styles.flex}>
                <Text style={styles.jobTitle} numberOfLines={1}>
                  {j.serviceName}
                </Text>
                <Text style={styles.jobMeta}>
                  {j.ref} · {j.date ? formatDayKey(j.date) : ''}
                  {j.slot && j.slot !== 'custom' ? ` · ${j.slot.replace('-', '–')}` : ''}
                </Text>
              </View>
              <Text style={styles.link}>Open</Text>
            </Pressable>
          ))}
          <View style={styles.actions}>
            <Button title="Done" variant="outline" size="md" fullWidth={false} style={styles.btn} onPress={onClose} />
            <Button
              title="View in bookings"
              variant="premium"
              size="md"
              fullWidth={false}
              style={styles.btn}
              onPress={() =>
                openAfterClose(() =>
                  appPush(adminRoutes.bookingsFiltered({ technicianId: tech?.id, status: 'confirmed', from, to })),
                )
              }
            />
          </View>
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {technician ? null : (
            <View style={styles.block}>
              <Text style={styles.label}>Technician</Text>
              {tech ? (
                <View style={styles.techChosen}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initials(tech.name)}</Text>
                  </View>
                  <Text style={styles.techName} numberOfLines={1}>
                    {tech.name}
                  </Text>
                  <Pressable onPress={() => setTech(null)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Pick another technician">
                    <Text style={styles.link}>Change</Text>
                  </Pressable>
                </View>
              ) : (
                <>
                  <View style={styles.search}>
                    <Search size={16} color={ui.textTertiary} strokeWidth={2.2} />
                    <TextInput
                      value={query}
                      onChangeText={setQuery}
                      placeholder="Search name or phone"
                      placeholderTextColor={ui.textTertiary}
                      style={styles.searchInput}
                      autoCorrect={false}
                      autoCapitalize="none"
                      accessibilityLabel="Search technicians"
                      onSubmitEditing={() => {
                        if (matches[0]) setTech({ id: matches[0].id, name: matches[0].name });
                      }}
                    />
                    {query ? (
                      <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="Clear search">
                        <X size={15} color={ui.textTertiary} strokeWidth={2.4} />
                      </Pressable>
                    ) : null}
                  </View>
                  {rosterError ? (
                    <Pressable onPress={loadRoster} accessibilityRole="button" style={styles.retry}>
                      <Text style={styles.errorText}>{rosterError} · Tap to retry</Text>
                    </Pressable>
                  ) : roster === null ? (
                    <View style={styles.loading}>
                      <Spinner />
                    </View>
                  ) : matches.length === 0 ? (
                    <Text style={styles.empty}>{roster.length ? 'No technician matches' : 'No active technicians yet'}</Text>
                  ) : (
                    matches.map((t) => (
                      <Pressable
                        key={t.id}
                        onPress={() => {
                          haptic('select');
                          setTech({ id: t.id, name: t.name });
                        }}
                        style={({ pressed }) => [styles.techRow, pressed && styles.pressed]}
                        accessibilityRole="button"
                        accessibilityLabel={`Pick ${t.name}`}
                      >
                        <View style={styles.avatarSm}>
                          <Text style={styles.avatarText}>{initials(t.name)}</Text>
                        </View>
                        <View style={styles.flex}>
                          <Text style={styles.techName} numberOfLines={1}>
                            {t.name}
                          </Text>
                          <Text style={styles.jobMeta} numberOfLines={1}>
                            {[t.city, t.phone].filter(Boolean).join(' · ')}
                          </Text>
                        </View>
                      </Pressable>
                    ))
                  )}
                </>
              )}
            </View>
          )}

          <View style={styles.block}>
            <Text style={styles.label}>Days</Text>
            <Text style={styles.helper}>
              {!from
                ? 'Tap the first day.'
                : range.to
                  ? `${formatRangeLabel({ from, to: range.to })} · ${days} ${days === 1 ? 'day' : 'days'} — tap a day to start again.`
                  : `${formatDayKey(from, true)} — tap the last day, or keep one day.`}
            </Text>
            <InlineCalendar mode="range" value={range} onChange={setRange} min={addDaysKey(today, -PAST_DAYS)} max={addDaysKey(today, 365)} />
          </View>

          <View style={styles.block}>
            <Text style={styles.label}>Type</Text>
            <AdminFilterChips chips={types.map((t) => ({ key: t.key, label: t.label }))} selected={type} onSelect={setType} />
          </View>

          <View style={styles.block}>
            <Text style={styles.label}>Note to the technician (optional)</Text>
            <TextInput
              value={note}
              onChangeText={(t) => setNote(t.slice(0, NOTE_MAX))}
              placeholder="e.g. Rest well — see you on Monday"
              placeholderTextColor={ui.textTertiary}
              style={styles.note}
              multiline
              maxLength={NOTE_MAX}
              accessibilityLabel="Note to the technician"
            />
          </View>

          <View style={styles.info}>
            <CalendarOff size={16} color={ui.textSecondary} strokeWidth={2.2} />
            <Text style={styles.infoText}>
              Approved straight away: attendance shows leave for these days, auto-assign skips them and they get a notification.
            </Text>
          </View>

          <View style={styles.actions}>
            <Button title="Cancel" variant="outline" size="md" fullWidth={false} style={styles.btn} disabled={busy} onPress={onClose} />
            <Button
              title={days > 1 ? `Add ${days} days` : 'Add leave'}
              variant="premium"
              size="md"
              fullWidth={false}
              style={styles.btn}
              loading={busy}
              disabled={!canSave}
              onPress={() => void submit()}
            />
          </View>
        </ScrollView>
      )}
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: spacing.md + 4, paddingTop: 4, paddingBottom: 4 },
  title: { ...typeScale.section, fontSize: 19, lineHeight: 25, color: ui.text },
  sub: { ...typeScale.caption, marginTop: 4, color: ui.textSecondary },
  scroll: { maxHeight: 620 },
  body: { paddingHorizontal: spacing.md, paddingBottom: spacing.md, paddingTop: spacing.xs },
  block: { marginTop: spacing.md },
  label: { ...typeScale.captionStrong, color: ui.text, marginBottom: 6 },
  helper: { ...typeScale.caption, color: ui.textSecondary, marginBottom: spacing.sm },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: colors.white,
    marginBottom: spacing.xs,
  },
  searchInput: { flex: 1, fontFamily: fonts.body, fontSize: 15, color: ui.text, paddingVertical: 0 },
  loading: { paddingVertical: spacing.md, alignItems: 'center' },
  retry: { paddingVertical: spacing.sm },
  errorText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.error },
  empty: { ...typeScale.caption, color: ui.textTertiary, paddingVertical: spacing.sm },
  techRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ui.border,
  },
  techChosen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 14,
    backgroundColor: ui.brandSoft,
  },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.forest, alignItems: 'center', justifyContent: 'center' },
  avatarSm: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.forest, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.displayExtra, fontSize: 11, color: colors.white },
  techName: { flex: 1, fontFamily: fonts.bodySemi, fontSize: 14, color: ui.text },
  flex: { flex: 1, minWidth: 0 },
  note: {
    minHeight: 76,
    maxHeight: 150,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: colors.white,
    fontFamily: fonts.body,
    fontSize: 14.5,
    color: ui.text,
    textAlignVertical: 'top',
  },
  info: {
    flexDirection: 'row',
    gap: 8,
    marginTop: spacing.md,
    padding: 12,
    borderRadius: 12,
    backgroundColor: ui.surfaceMuted,
  },
  infoText: { flex: 1, ...typeScale.caption, color: ui.textSecondary },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.md },
  btn: { minWidth: 120 },
  warnBox: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: colors.amberBg,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  warnText: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 13, lineHeight: 18, color: colors.amberInk },
  jobRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ui.border,
  },
  jobTitle: { fontFamily: fonts.bodySemi, fontSize: 14, color: ui.text },
  jobMeta: { fontFamily: fonts.body, fontSize: 12, color: ui.textSecondary, marginTop: 1 },
  link: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.forest },
  pressed: { opacity: 0.7 },
});
