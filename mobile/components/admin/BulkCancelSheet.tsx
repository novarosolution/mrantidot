import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AdminBottomSheet } from '@/components/kit/AdminBottomSheet';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { colors, fonts, spacing, ui } from '@/constants/theme';
import { haptic } from '@/lib/motion';
import { CANCEL_REASON_MAX, CANCEL_REASON_MIN } from '@/types/adminOps';

/** One tap fills the reason; the admin can still edit it. */
const QUICK_REASONS = [
  'Customer asked to cancel',
  'Duplicate booking',
  'No technician available',
  'Outside service area',
  'Customer not reachable',
];

/**
 * Reason sheet for cancelling several bookings at once (POST /bookings/bulk/cancel). The reason is
 * required (≥ 3 characters), kept on every booking and in the activity log; customers and technicians
 * are notified like a single cancel. `onSubmit` sends it — the sheet stays open (busy) until it resolves.
 */
export function BulkCancelSheet({
  visible,
  count,
  skipped,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  /** Bookings that will be cancelled. */
  count: number;
  /** Selected bookings that are already completed / cancelled (skipped by the server). */
  skipped: number;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
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
  const label = `${count} booking${count === 1 ? '' : 's'}`;

  async function submit() {
    setTouched(true);
    if (tooShort || busy || count === 0) {
      haptic('error');
      return;
    }
    setBusy(true);
    try {
      await onSubmit(trimmed);
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
      title={`Cancel ${label}?`}
      hint={
        `The customers and technicians are notified. This can't be undone.` +
        (skipped > 0 ? ` ${skipped} selected booking${skipped === 1 ? ' is' : 's are'} already completed or cancelled and will be skipped.` : '')
      }
      footer={
        <>
          <Button title={`Cancel ${label}`} variant="danger" onPress={() => void submit()} loading={busy} disabled={count === 0} />
          <Button title="Keep bookings" variant="secondary" onPress={onClose} disabled={busy} />
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
        placeholder="Why are these bookings being cancelled?"
        multiline
        maxLength={CANCEL_REASON_MAX}
        error={error}
        hint={`Saved on each booking and in the activity log · ${trimmed.length}/${CANCEL_REASON_MAX}`}
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
