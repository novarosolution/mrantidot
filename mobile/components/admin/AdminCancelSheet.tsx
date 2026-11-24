import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { AdminBottomSheet } from '@/components/kit/AdminBottomSheet';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api';
import { haptic } from '@/lib/motion';
import { CANCEL_REASON_MAX, CANCEL_REASON_MIN } from '@/types/adminOps';
import { colors, fonts, spacing, ui } from '@/constants/theme';

/** One tap fills the reason; the admin can still edit it before cancelling. */
const QUICK_REASONS = [
  'Customer asked to cancel',
  'Duplicate booking',
  'No technician available',
  'Outside service area',
  'Customer not reachable',
];

/**
 * Admin cancel with a required reason (server: PATCH /bookings/:id/cancel { reason }, ≥ 3 characters).
 * The reason is kept on the booking and in the activity log; the customer and technician are notified.
 */
export function AdminCancelSheet({
  visible,
  bookingId,
  bookingLabel,
  onClose,
  onCancelled,
}: {
  visible: boolean;
  bookingId: string;
  /** e.g. "#A1B2C3 · General pest control" */
  bookingLabel?: string;
  onClose: () => void;
  onCancelled: () => void | Promise<void>;
}) {
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setReason('');
    setTouched(false);
  }, [visible]);

  const trimmed = reason.trim();
  const tooShort = trimmed.length < CANCEL_REASON_MIN;
  const error = touched && tooShort ? `Give a reason (at least ${CANCEL_REASON_MIN} characters).` : undefined;

  async function submit() {
    setTouched(true);
    if (tooShort || busy) {
      haptic('error');
      return;
    }
    setBusy(true);
    try {
      await api.patch(`/bookings/${bookingId}/cancel`, { reason: trimmed });
      haptic('success');
      Toast.show({ type: 'success', text1: 'Booking cancelled', text2: 'The customer has been told.' });
      onClose();
      await onCancelled();
    } catch {
      // The api interceptor shows the server's message (e.g. already completed).
      haptic('error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminBottomSheet
      visible={visible}
      onClose={() => {
        if (!busy) onClose();
      }}
      title="Cancel booking?"
      hint={
        bookingLabel
          ? `${bookingLabel}. This can't be undone — the customer and technician are notified.`
          : "This can't be undone — the customer and technician are notified."
      }
      footer={
        <>
          <Button title="Cancel booking" variant="danger" onPress={() => void submit()} loading={busy} />
          <Button title="Keep booking" variant="secondary" onPress={onClose} disabled={busy} />
        </>
      }
    >
      <Text style={styles.label}>Quick reasons</Text>
      <View style={styles.chips}>
        {QUICK_REASONS.map((r) => (
          <Chip
            key={r}
            label={r}
            compact
            selected={trimmed === r}
            onPress={() => {
              setReason(r);
              setTouched(false);
            }}
          />
        ))}
      </View>
      <Input
        label="Reason (required)"
        value={reason}
        onChangeText={(t) => setReason(t.slice(0, CANCEL_REASON_MAX))}
        onBlur={() => setTouched(true)}
        placeholder="Why is this booking being cancelled?"
        multiline
        maxLength={CANCEL_REASON_MAX}
        error={error}
        hint={`Kept on the booking and in the activity log · ${trimmed.length}/${CANCEL_REASON_MAX}`}
        accessibilityLabel="Cancellation reason"
        style={styles.multiline}
      />
    </AdminBottomSheet>
  );
}

const styles = StyleSheet.create({
  label: { fontFamily: fonts.bodySemi, fontSize: 12, color: ui.textSecondary, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
  multiline: { minHeight: 84, textAlignVertical: 'top', color: colors.ink },
});
