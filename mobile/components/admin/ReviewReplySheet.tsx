import { MessageSquareReply } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { Button } from '@/components/ui/Button';
import { SheetModal } from '@/components/ui/SheetModal';
import { StarRating } from '@/components/ui/StarRating';
import { colors, fonts, spacing, typeScale, ui } from '@/constants/theme';
import { api, getApiErrorMessage } from '@/lib/api';
import { haptic } from '@/lib/motion';
import { formatTimeAgo } from '@/lib/time-ago';
import { IS_WEB } from '@/lib/webAdmin';
import { modKeyLabel } from '@/lib/webKeys';
import type { AdminReviewReply, AdminReviewRowV2 } from '@/types/adminManage';

const REPLY_MAX = 1000;

/**
 * Write, edit or remove the one public reply on a review. Customers see it under the review in the app and
 * on the website (as the business, without your name); the first reply also sends them a notification.
 * PUT /admin/reviews/:id/reply { text } → { reply }, DELETE /admin/reviews/:id/reply → { reply: null }.
 */
export function ReviewReplySheet({
  review,
  onClose,
  onSaved,
}: {
  /** The review being answered; null = closed. */
  review: AdminReviewRowV2 | null;
  onClose: () => void;
  onSaved: (reviewId: string, reply: AdminReviewReply | null) => void;
}) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState<null | 'save' | 'remove'>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const existing = review?.reply ?? null;

  useEffect(() => {
    if (!review) return;
    setText(review.reply?.text ?? '');
    setConfirmRemove(false);
    setBusy(null);
  }, [review]);

  const trimmed = text.trim();
  const unchanged = Boolean(existing && existing.text === trimmed);

  async function save() {
    if (!review || !trimmed || busy || unchanged) return;
    setBusy('save');
    try {
      const { data } = await api.put<{ reply: AdminReviewReply }>(`/admin/reviews/${review.id}/reply`, { text: trimmed }, { skipErrorToast: true });
      haptic('success');
      Toast.show({
        type: 'success',
        text1: existing ? 'Reply updated' : 'Reply posted',
        text2: existing ? undefined : `${review.customerName} has been notified.`,
      });
      onSaved(review.id, data.reply);
      onClose();
    } catch (err) {
      haptic('error');
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Could not save the reply') });
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!review || busy) return;
    if (!confirmRemove) {
      haptic('warning');
      setConfirmRemove(true);
      return;
    }
    setBusy('remove');
    try {
      await api.delete(`/admin/reviews/${review.id}/reply`, { skipErrorToast: true });
      haptic('success');
      Toast.show({ type: 'success', text1: 'Reply removed' });
      onSaved(review.id, null);
      onClose();
    } catch (err) {
      haptic('error');
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Could not remove the reply') });
    } finally {
      setBusy(null);
    }
  }

  return (
    <SheetModal
      visible={review !== null}
      onClose={() => (busy ? undefined : onClose())}
      dialogWidth={520}
      keyboardAvoiding
      header={
        <View style={styles.head}>
          <Text style={styles.title}>{existing ? 'Edit reply' : 'Reply to review'}</Text>
          {review ? (
            <Text style={styles.sub} numberOfLines={1}>
              {[review.customerFullName || review.customerName, review.serviceName, review.technicianName].filter(Boolean).join(' · ')}
            </Text>
          ) : null}
        </View>
      }
    >
      {review ? (
        <View style={styles.body}>
          <View style={styles.quote}>
            <StarRating rating={review.stars} size={14} showValue />
            <Text style={[styles.quoteText, !review.comment && styles.quoteEmpty]}>
              {review.comment ? `“${review.comment}”` : review.tags?.length ? review.tags.join(' · ') : 'No comment — stars only'}
            </Text>
          </View>

          <Text style={styles.label}>Your reply</Text>
          <TextInput
            value={text}
            onChangeText={(t) => {
              setText(t.slice(0, REPLY_MAX));
              setConfirmRemove(false);
            }}
            placeholder={review.stars >= 4 ? 'e.g. Thank you! Glad the team made it easy.' : 'e.g. Sorry about this — we have called you to set it right.'}
            placeholderTextColor={ui.textTertiary}
            style={styles.input}
            multiline
            maxLength={REPLY_MAX}
            autoFocus={IS_WEB}
            accessibilityLabel="Reply text"
            onKeyPress={
              IS_WEB
                ? (e) => {
                    const ev = e.nativeEvent as unknown as { key?: string; metaKey?: boolean; ctrlKey?: boolean };
                    if (ev.key === 'Enter' && (ev.metaKey || ev.ctrlKey)) void save();
                  }
                : undefined
            }
          />
          <View style={styles.metaRow}>
            <MessageSquareReply size={13} color={ui.textTertiary} strokeWidth={2.2} />
            <Text style={styles.helper}>
              {existing
                ? `Posted by ${existing.byName} ${formatTimeAgo(existing.editedAt ?? existing.at)}${existing.editedAt ? ' (edited)' : ''}. Customers see it as the business.`
                : 'Shown under the review in the app and on the website, as the business. The customer gets a notification.'}
            </Text>
          </View>
          <Text style={styles.count}>
            {trimmed.length}/{REPLY_MAX}
            {IS_WEB ? ` · ${modKeyLabel()} + Enter saves` : ''}
          </Text>

          <View style={styles.actions}>
            {existing ? (
              <Button
                title={confirmRemove ? 'Tap again to remove' : 'Remove reply'}
                variant="dangerOutline"
                size="md"
                fullWidth={false}
                style={styles.removeBtn}
                loading={busy === 'remove'}
                disabled={busy === 'save'}
                onPress={() => void remove()}
              />
            ) : null}
            <View style={styles.spacer} />
            <Button title="Cancel" variant="outline" size="md" fullWidth={false} style={styles.btn} disabled={Boolean(busy)} onPress={onClose} />
            <Button
              title={existing ? 'Save reply' : 'Post reply'}
              variant="premium"
              size="md"
              fullWidth={false}
              style={styles.btn}
              loading={busy === 'save'}
              disabled={!trimmed || unchanged || busy === 'remove'}
              onPress={() => void save()}
            />
          </View>
        </View>
      ) : null}
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: spacing.md + 4, paddingTop: 4, paddingBottom: 4 },
  title: { ...typeScale.section, fontSize: 19, lineHeight: 25, color: ui.text },
  sub: { ...typeScale.caption, marginTop: 4, color: ui.textSecondary },
  body: { paddingHorizontal: spacing.md, paddingBottom: spacing.md, paddingTop: spacing.sm },
  quote: { padding: 12, borderRadius: 14, backgroundColor: ui.surfaceMuted, gap: 6, marginBottom: spacing.md },
  quoteText: { ...typeScale.body, color: ui.text },
  quoteEmpty: { color: ui.textTertiary, fontStyle: 'italic' },
  label: { ...typeScale.captionStrong, color: ui.text, marginBottom: 6 },
  input: {
    minHeight: 104,
    maxHeight: 220,
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
  metaRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  helper: { flex: 1, ...typeScale.caption, color: ui.textSecondary },
  count: { ...typeScale.caption, color: ui.textTertiary, textAlign: 'right', marginTop: 4 },
  actions: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  spacer: { flex: 1 },
  removeBtn: { minWidth: 140 },
  btn: { minWidth: 110 },
});
