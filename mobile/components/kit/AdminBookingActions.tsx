import { Alert } from 'react-native';
import Toast from 'react-native-toast-message';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import type { Booking, BookingStatus } from '@/types/api';
import { spacing } from '@/constants/theme';

export function AdminBookingActions({
  booking,
  onUpdated,
  busy,
  setBusy,
}: {
  booking: Booking;
  onUpdated: () => Promise<void>;
  busy: string | null;
  setBusy: (v: string | null) => void;
}) {
  async function setStatus(status: BookingStatus) {
    setBusy(status);
    try {
      await api.patch(`/bookings/${booking.id}/status`, { status });
      Toast.show({ type: 'success', text1: 'Status updated' });
      await onUpdated();
    } finally {
      setBusy(null);
    }
  }

  async function markCompleted() {
    setBusy('complete');
    try {
      await api.patch(`/bookings/${booking.id}/complete`);
      Toast.show({ type: 'success', text1: 'Booking completed' });
      await onUpdated();
    } finally {
      setBusy(null);
    }
  }

  const actions: { title: string; key: string; onPress: () => void; variant?: 'secondary' | 'sky' }[] = [];

  if (booking.status === 'confirmed') {
    actions.push({
      title: 'Start job',
      key: 'in_progress',
      onPress: () => void setStatus('in_progress'),
    });
  }
  if (booking.status === 'in_progress') {
    actions.push({
      title: 'Send for verification',
      key: 'awaiting_verification',
      onPress: () => {
        Alert.alert('Send for verification?', 'Customer will verify in their app.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: () => void setStatus('awaiting_verification') },
        ]);
      },
    });
  }
  if (booking.status === 'awaiting_verification') {
    actions.push({
      title: 'Mark completed',
      key: 'complete',
      onPress: () => {
        Alert.alert('Complete booking?', 'Marks job as completed without customer verify.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Complete', onPress: () => void markCompleted() },
        ]);
      },
    });
  }

  if (actions.length === 0) return null;

  return (
    <>
      {actions.map((a) => (
        <Button
          key={a.key}
          title={a.title}
          variant={a.variant ?? 'sky'}
          onPress={a.onPress}
          loading={busy === a.key || busy === 'complete'}
          style={{ marginTop: spacing.sm }}
        />
      ))}
    </>
  );
}
