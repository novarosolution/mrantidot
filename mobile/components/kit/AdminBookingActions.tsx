import { Alert } from 'react-native';
import Toast from 'react-native-toast-message';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import type { Booking, BookingStatus } from '@/types/api';
import { spacing } from '@/constants/theme';

/** Admin controls to advance, complete, or cancel any live booking stage. */
export function AdminBookingActions({
  booking,
  onUpdated,
  busy,
  setBusy,
  onAssign,
}: {
  booking: Booking;
  onUpdated: () => Promise<void>;
  busy: string | null;
  setBusy: (v: string | null) => void;
  onAssign?: () => void;
}) {
  async function setStatus(status: BookingStatus) {
    setBusy(status);
    try {
      await api.patch(`/bookings/${booking.id}/status`, { status });
      Toast.show({ type: 'success', text1: 'Process updated' });
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

  async function cancelBooking() {
    setBusy('cancel');
    try {
      await api.patch(`/bookings/${booking.id}/cancel`);
      Toast.show({ type: 'success', text1: 'Booking cancelled' });
      await onUpdated();
    } finally {
      setBusy(null);
    }
  }

  const actions: {
    title: string;
    key: string;
    onPress: () => void;
    variant?: 'secondary' | 'sky' | 'premium';
  }[] = [];

  if (booking.status === 'confirmed') {
    if (onAssign) {
      actions.push({
        title: booking.technician ? 'Reassign technician' : 'Assign technician',
        key: 'assign',
        variant: 'premium',
        onPress: onAssign,
      });
    }
    actions.push({
      title: 'Force start job',
      key: 'in_progress',
      onPress: () => {
        Alert.alert('Start job?', 'Marks job in progress and skips start OTP.', [
          { text: 'Back', style: 'cancel' },
          { text: 'Start', onPress: () => void setStatus('in_progress') },
        ]);
      },
    });
  }

  if (booking.status === 'in_progress') {
    actions.push({
      title: 'Send for verification',
      key: 'awaiting_verification',
      onPress: () => {
        Alert.alert('Send for verification?', 'Customer will enter the completion code.', [
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
      variant: 'premium',
      onPress: () => {
        Alert.alert('Complete booking?', 'Overrides customer OTP and marks job done.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Complete', onPress: () => void markCompleted() },
        ]);
      },
    });
  }

  if (!['completed', 'cancelled'].includes(booking.status)) {
    actions.push({
      title: 'Cancel booking',
      key: 'cancel',
      variant: 'secondary',
      onPress: () => {
        Alert.alert('Cancel this booking?', 'Customer and technician will be notified.', [
          { text: 'Keep', style: 'cancel' },
          { text: 'Cancel booking', style: 'destructive', onPress: () => void cancelBooking() },
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
          loading={busy === a.key || busy === 'complete' || busy === 'cancel'}
          style={{ marginTop: spacing.sm }}
        />
      ))}
    </>
  );
}
