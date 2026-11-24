import { Lock, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { colors, fonts, premium, spacing, ui } from '@/constants/theme';
import { api, getApiErrorMessage } from '@/lib/api';
import { confirmAsync } from '@/lib/confirm';
import { haptic } from '@/lib/motion';
import { formatTimeAgo } from '@/lib/time-ago';
import { userInitials } from '@/lib/userInitials';
import { IS_WEB } from '@/lib/webAdmin';
import { modKeyLabel } from '@/lib/webKeys';
import type { CustomerNote } from '@/types/adminManage';

const NOTE_MAX = 1000;

function fullTime(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

/**
 * Internal notes on a customer (newest first) — admins only; the customer never sees them.
 * Server: POST /admin/customers/:id/notes { text } → { note, notes }, DELETE …/notes/:noteId → { notes }.
 */
export function AdminCustomerNotes({
  customerId,
  notes,
  onChange,
}: {
  customerId: string;
  notes: CustomerNote[];
  onChange: (next: CustomerNote[]) => void;
}) {
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const trimmed = text.trim();

  async function addNote() {
    if (!trimmed || saving) return;
    setSaving(true);
    try {
      const { data } = await api.post<{ note: CustomerNote; notes: CustomerNote[] }>(
        `/admin/customers/${customerId}/notes`,
        { text: trimmed },
        { skipErrorToast: true },
      );
      haptic('success');
      setText('');
      onChange(data.notes);
      Toast.show({ type: 'success', text1: 'Note added' });
    } catch (err) {
      haptic('error');
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Could not add the note') });
    } finally {
      setSaving(false);
    }
  }

  async function removeNote(note: CustomerNote) {
    const ok = await confirmAsync({
      title: 'Delete this note?',
      message: note.text.length > 120 ? `${note.text.slice(0, 117)}…` : note.text,
      confirmLabel: 'Delete',
      cancelLabel: 'Keep',
      destructive: true,
    });
    if (!ok) return;
    setDeleting(note.id);
    try {
      const { data } = await api.delete<{ notes: CustomerNote[] }>(`/admin/customers/${customerId}/notes/${note.id}`, {
        skipErrorToast: true,
      });
      haptic('success');
      Toast.show({ type: 'success', text1: 'Note deleted' });
      onChange(data.notes);
    } catch (err) {
      haptic('error');
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Could not delete the note') });
    } finally {
      setDeleting(null);
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.title}>Internal notes</Text>
        <View style={styles.privateTag}>
          <Lock size={11} color={ui.textSecondary} strokeWidth={2.4} />
          <Text style={styles.privateText}>Admins only</Text>
        </View>
      </View>

      {notes.length === 0 ? (
        <Text style={styles.empty}>
          No notes yet. Keep what the team should know — how they like to be contacted, gate codes, past complaints, follow-ups.
        </Text>
      ) : (
        <View style={styles.timeline}>
          {notes.map((note, i) => (
            <View key={note.id} style={styles.noteRow}>
              <View style={styles.rail}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{userInitials(note.byName)}</Text>
                </View>
                {i < notes.length - 1 ? <View style={styles.line} /> : null}
              </View>
              <View style={styles.noteBody}>
                <View style={styles.noteMetaRow}>
                  <Text style={styles.noteBy} numberOfLines={1}>
                    {note.byName || 'Admin'}
                  </Text>
                  <Text style={styles.noteWhen} accessibilityLabel={fullTime(note.at)}>
                    {formatTimeAgo(note.at)}
                  </Text>
                  <Pressable
                    onPress={() => void removeNote(note)}
                    disabled={deleting === note.id}
                    hitSlop={10}
                    style={({ pressed }) => [styles.deleteBtn, (pressed || deleting === note.id) && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel={`Delete note by ${note.byName || 'Admin'}`}
                  >
                    <Trash2 size={15} color={ui.textTertiary} strokeWidth={2.2} />
                  </Pressable>
                </View>
                <Text style={styles.noteText} selectable>
                  {note.text}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <Input
        label="Add a note"
        value={text}
        onChangeText={(t) => setText(t.slice(0, NOTE_MAX))}
        placeholder="e.g. Call before arriving — the bell doesn't work"
        multiline
        maxLength={NOTE_MAX}
        hint={trimmed.length > NOTE_MAX - 100 ? `${trimmed.length}/${NOTE_MAX}` : IS_WEB ? `${modKeyLabel()} + Enter adds the note` : undefined}
        containerStyle={styles.inputWrap}
        style={styles.input}
        accessibilityLabel="New internal note"
        onKeyPress={
          IS_WEB
            ? (e) => {
                const ev = e.nativeEvent as unknown as { key?: string; metaKey?: boolean; ctrlKey?: boolean };
                if (ev.key === 'Enter' && (ev.metaKey || ev.ctrlKey)) void addNote();
              }
            : undefined
        }
      />
      <Button
        title="Add note"
        variant="secondary"
        size="sm"
        onPress={() => void addNote()}
        loading={saving}
        disabled={!trimmed}
        fullWidth={false}
        style={styles.addBtn}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: premium.radiusCard,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    ...ui.shadow,
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  title: { fontFamily: fonts.displayExtra, fontSize: 15.5, color: ui.text, letterSpacing: -0.2 },
  privateTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: colors.greyBg,
  },
  privateText: { fontFamily: fonts.bodySemi, fontSize: 11, color: ui.textSecondary },
  empty: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: colors.muted },
  timeline: { marginTop: 2 },
  noteRow: { flexDirection: 'row', gap: 10 },
  rail: { alignItems: 'center', width: 30 },
  avatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.forest },
  line: { flex: 1, width: 2, marginVertical: 4, borderRadius: 1, backgroundColor: colors.greyBg },
  noteBody: { flex: 1, minWidth: 0, paddingBottom: spacing.md },
  noteMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 30 },
  noteBy: { flexShrink: 1, fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ink },
  noteWhen: { flex: 1, fontFamily: fonts.body, fontSize: 12, color: ui.textTertiary },
  deleteBtn: { padding: 4, borderRadius: 8 },
  pressed: { opacity: 0.5 },
  noteText: { fontFamily: fonts.body, fontSize: 13.5, lineHeight: 20, color: colors.ink },
  inputWrap: { marginTop: spacing.xs },
  input: { minHeight: 72, textAlignVertical: 'top' },
  addBtn: { marginTop: spacing.sm, alignSelf: 'flex-end' },
});
