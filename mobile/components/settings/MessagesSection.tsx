import { memo, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BellRing, RotateCcw } from 'lucide-react-native';
import { AdminCollapsibleCard, AdminFilterChips } from '@/components/kit/AdminPageKit';
import { IconInput } from '@/components/kit/IconInput';
import { SettingsNote } from '@/components/settings/SettingsKit';
import { haptic } from '@/lib/motion';
import type { SettingsMessage } from '@/types/api';
import { colors, fonts, spacing, ui } from '@/constants/theme';

type Audience = 'customer' | 'tech' | 'admin';
type Messages = Record<string, SettingsMessage>;

/** Events in the order a visit goes through them (keys not listed here are shown at the end). */
const EVENTS: { event: string; title: string; when: string }[] = [
  { event: 'schedule_requested', title: 'Booking request received', when: 'A new booking waits for you to confirm the time' },
  { event: 'confirmed', title: 'Booking confirmed', when: 'A booking is confirmed straight away (auto-confirm)' },
  { event: 'schedule_confirmed', title: 'Visit time confirmed', when: 'You confirm the time of a pending booking' },
  { event: 'assigned', title: 'Technician assigned', when: 'A technician is assigned (by you or auto-assign)' },
  { event: 'start_otp_ready', title: 'Start code issued', when: 'The start code is ready for the visit' },
  { event: 'work_started', title: 'Work started', when: 'The technician enters the start code' },
  { event: 'in_progress', title: 'Service in progress', when: 'Treatment starts' },
  { event: 'end_otp_ready', title: 'Completion code issued', when: 'The technician finishes the last step' },
  { event: 'awaiting_verification', title: 'Treatment finished', when: 'Photos are ready for review' },
  { event: 'work_completed', title: 'Work completed', when: 'The completion code is verified' },
  { event: 'completed', title: 'Service completed', when: 'An admin marks the job complete' },
  { event: 'reschedule_requested', title: 'Reschedule requested', when: 'A customer moves a visit and it waits for you' },
  { event: 'rescheduled', title: 'Visit rescheduled', when: 'A visit gets a new confirmed time' },
  { event: 'cancelled', title: 'Booking cancelled', when: 'A booking is cancelled' },
  { event: 'order_updated', title: 'Order updated', when: 'You change the service or the total of a booking ({total} = new total)' },
  { event: 'reopened', title: 'Booking reopened', when: 'You reopen a cancelled booking' },
  // Technician time off (not part of a visit).
  { event: 'leave_requested', title: 'Leave requested', when: 'A technician asks for time off' },
  { event: 'leave_approved', title: 'Leave approved', when: 'You approve a leave request' },
  { event: 'leave_rejected', title: 'Leave not approved', when: 'You turn down a leave request' },
  { event: 'leave_added', title: 'Leave added', when: 'You add leave for a technician yourself ({note} = your note)' },
  { event: 'leave_cancelled', title: 'Leave cancelled', when: 'You cancel a technician’s approved leave' },
  // Reviews.
  { event: 'review_replied', title: 'Review reply', when: 'You first reply to a customer’s review ({note} = your reply)' },
];

const AUDIENCES: { key: Audience; label: string }[] = [
  { key: 'customer', label: 'Customer' },
  { key: 'tech', label: 'Technician' },
  { key: 'admin', label: 'Admins' },
];

/** Example values for the preview — the real ones come from the booking (or, for leave, the request). */
const SAMPLE: Record<string, string> = {
  service: 'Termite treatment',
  ref: '#4F2A9C',
  date: 'Tue, 24 Nov',
  time: '10 AM – 12 PM',
  name: 'Ravi',
  type: 'Casual',
  note: 'Back on Thursday.',
  total: '₹1,770',
};

/** Same rule as the server's fillTemplate: unknown placeholders become empty. */
function fill(text: string): string {
  return text
    .replace(/\{(\w+)\}/g, (_, k: string) => SAMPLE[k] ?? '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

const same = (a?: SettingsMessage, b?: SettingsMessage) => Boolean(a && b && a.title === b.title && a.body === b.body);

function MessageEditor({
  audience,
  value,
  fallback,
  onChange,
}: {
  audience: Audience;
  value: SettingsMessage;
  fallback?: SettingsMessage;
  onChange: (next: SettingsMessage) => void;
}) {
  const edited = Boolean(fallback) && !same(value, fallback);
  const label = AUDIENCES.find((a) => a.key === audience)?.label ?? audience;
  const title = fill(value.title || fallback?.title || '');
  const body = fill(value.body || fallback?.body || '');
  return (
    <View style={styles.editor}>
      <View style={styles.editorHead}>
        <Text style={styles.audience}>{label}</Text>
        {edited ? (
          <Pressable
            onPress={() => {
              if (!fallback) return;
              haptic('select');
              onChange({ ...fallback });
            }}
            hitSlop={6}
            style={({ pressed }) => [styles.reset, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={`Reset the ${label.toLowerCase()} message to default`}
          >
            <RotateCcw size={12} color={ui.brand} strokeWidth={2.5} />
            <Text style={styles.resetText}>Reset to default</Text>
          </Pressable>
        ) : (
          <Text style={styles.defaultTag}>Default</Text>
        )}
      </View>
      <IconInput
        label="Title"
        value={value.title}
        onChangeText={(t) => onChange({ ...value, title: t })}
        maxLength={80}
        placeholder={fallback?.title}
        hint={!value.title.trim() ? 'Empty = the default title is sent' : undefined}
      />
      <IconInput
        label="Message"
        value={value.body}
        onChangeText={(t) => onChange({ ...value, body: t })}
        maxLength={300}
        multiline
        placeholder={fallback?.body}
        hint={!value.body.trim() ? 'Empty = the default message is sent' : `${value.body.length}/300`}
      />
      <View style={styles.preview} accessibilityLabel={`Preview: ${title}. ${body}`}>
        <View style={styles.previewIcon}>
          <BellRing size={14} color={colors.white} strokeWidth={2.4} />
        </View>
        <View style={styles.previewText}>
          <Text style={styles.previewTitle} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.previewBody} numberOfLines={3}>
            {body}
          </Text>
        </View>
      </View>
    </View>
  );
}

export const MessagesSection = memo(function MessagesSection({
  messages,
  defaults,
  onChange,
}: {
  messages: Messages;
  defaults?: Messages;
  onChange: (next: Messages) => void;
}) {
  const [filter, setFilter] = useState<'all' | Audience>('all');

  const groups = useMemo(() => {
    const keys = Object.keys(messages);
    const known = new Set(EVENTS.map((e) => e.event));
    const extra = [...new Set(keys.map((k) => k.split('.')[0]!))].filter((e) => !known.has(e));
    return [...EVENTS, ...extra.map((event) => ({ event, title: event.replace(/_/g, ' '), when: '' }))]
      .map((e) => ({
        ...e,
        audiences: AUDIENCES.map((a) => a.key).filter((a) => `${e.event}.${a}` in messages),
      }))
      .filter((e) => e.audiences.length > 0);
  }, [messages]);

  const editedCount = Object.keys(messages).filter((k) => defaults?.[k] && !same(messages[k], defaults[k])).length;

  return (
    <>
      <View style={styles.vars}>
        <Text style={styles.varsTitle}>Placeholders you can use</Text>
        <View style={styles.varsRow}>
          {Object.entries(SAMPLE).map(([k, v]) => (
            <View key={k} style={styles.varChip}>
              <Text style={styles.varKey}>{`{${k}}`}</Text>
              <Text style={styles.varVal}>{v}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.filters}>
        <AdminFilterChips
          inset
          chips={[{ key: 'all', label: editedCount ? `All · ${editedCount} edited` : 'All' }, ...AUDIENCES.map((a) => ({ key: a.key, label: a.label }))]}
          selected={filter}
          onSelect={(k) => setFilter(k as 'all' | Audience)}
        />
      </View>
      <View style={styles.gutter}>
        <SettingsNote>In-app notifications sent at each step. Tap a step to edit its texts.</SettingsNote>
      </View>

      {groups
        .filter((g) => filter === 'all' || g.audiences.includes(filter))
        .map((g) => {
          const shown = g.audiences.filter((a) => filter === 'all' || a === filter);
          const edited = shown.some((a) => {
            const key = `${g.event}.${a}`;
            return defaults?.[key] && !same(messages[key], defaults[key]);
          });
          const who = shown.map((a) => AUDIENCES.find((x) => x.key === a)?.label).join(', ');
          return (
            <View key={g.event} style={styles.card}>
              <AdminCollapsibleCard title={edited ? `${g.title} · edited` : g.title} subtitle={[g.when, who].filter(Boolean).join(' · ')}>
                {shown.map((a) => {
                  const key = `${g.event}.${a}`;
                  const value = messages[key];
                  if (!value) return null;
                  return (
                    <MessageEditor
                      key={key}
                      audience={a}
                      value={value}
                      fallback={defaults?.[key]}
                      onChange={(next) => onChange({ ...messages, [key]: next })}
                    />
                  );
                })}
              </AdminCollapsibleCard>
            </View>
          );
        })}
    </>
  );
});

const styles = StyleSheet.create({
  vars: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    padding: 12,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.border,
    gap: 8,
  },
  varsTitle: { fontFamily: fonts.bodyBold, fontSize: 13, color: ui.text },
  varsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  varChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    height: 30,
    borderRadius: 999,
    backgroundColor: ui.brandSoft,
  },
  varKey: { fontFamily: fonts.bodyBold, fontSize: 12, color: ui.brand },
  varVal: { fontFamily: fonts.body, fontSize: 12, color: ui.textSecondary },
  filters: { marginTop: spacing.sm },
  gutter: { paddingHorizontal: spacing.md },
  card: { marginHorizontal: 0 },
  editor: {
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ui.border,
  },
  editorHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  audience: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: ui.text, letterSpacing: 0.2 },
  defaultTag: { fontFamily: fonts.bodySemi, fontSize: 11.5, color: ui.textTertiary },
  reset: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: ui.brandSoft,
  },
  resetText: { fontFamily: fonts.bodySemi, fontSize: 12, color: ui.brand },
  preview: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: 16,
    backgroundColor: ui.surfaceMuted,
    borderWidth: 1,
    borderColor: ui.border,
    marginBottom: spacing.sm,
  },
  previewIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.forest,
  },
  previewText: { flex: 1, minWidth: 0 },
  previewTitle: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: ui.text },
  previewBody: { fontFamily: fonts.body, fontSize: 12.5, lineHeight: 17, color: ui.textSecondary, marginTop: 2 },
  pressed: { opacity: 0.75 },
});
