import Toast from 'react-native-toast-message';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { haptic } from '@/lib/motion';
import type { Booking, BookingStatus } from '@/types/api';
import { spacing } from '@/constants/theme';
import { confirmAsync } from '@/lib/confirm';

/**
 * Admin controls to advance, complete, or cancel any live booking stage.
 * Cancelling needs a reason, so it opens the screen's cancel sheet (`onCancel`); without it the button is hidden.
 */
export function AdminBookingActions({
  booking,
  onUpdated,
  busy,
  setBusy,
  onAssign,
  onCancel,
}: {
  booking: Booking;
  onUpdated: () => Promise<void>;
  busy: string | null;
  setBusy: (v: string | null) => void;
  onAssign?: () => void;
  /** Opens the cancel-with-reason sheet. */
  onCancel?: () => void;
}) {
  async function setStatus(status: BookingStatus) {
    setBusy(status);
    try {
      await api.patch(`/bookings/${booking.id}/status`, { status });
      haptic('success');
      Toast.show({ type: 'success', text1: 'Process updated' });
      await onUpdated();
    } catch {
      // error toast shown by the api interceptor
      haptic('error');
    } finally {
      setBusy(null);
    }
  }

  async function markCompleted() {
    setBusy('complete');
    try {
      await api.patch(`/bookings/${booking.id}/complete`);
      haptic('success');
      Toast.show({ type: 'success', text1: 'Booking completed' });
      await onUpdated();
    } catch {
      // error toast shown by the api interceptor
      haptic('error');
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
    if (booking.technician) {
      actions.push({
        title: 'Force start job',
        key: 'in_progress',
        onPress: () => {
          void confirmAsync({
            title: 'Start job?',
            message: 'Marks job in progress and skips start OTP.',
            confirmLabel: 'Start',
            cancelLabel: 'Back',
          }).then((ok) => {
            if (ok) void setStatus('in_progress');
          });
        },
      });
    }
  }

  if (booking.status === 'in_progress') {
    actions.push({
      title: 'Send for verification',
      key: 'awaiting_verification',
      onPress: () => {
        void confirmAsync({
          title: 'Send for verification?',
          message: 'Customer will enter the completion code.',
          confirmLabel: 'Continue',
        }).then((ok) => {
          if (ok) void setStatus('awaiting_verification');
        });
      },
    });
  }

  if (booking.status === 'awaiting_verification') {
    actions.push({
      title: 'Mark completed',
      key: 'complete',
      variant: 'premium',
      onPress: () => {
        void confirmAsync({
          title: 'Complete booking?',
          message: 'Overrides customer OTP and marks job done.',
          confirmLabel: 'Complete',
        }).then((ok) => {
          if (ok) void markCompleted();
        });
      },
    });
  }

  if (onCancel && !['completed', 'cancelled'].includes(booking.status)) {
    actions.push({
      title: 'Cancel booking',
      key: 'cancel',
      variant: 'secondary',
      onPress: onCancel,
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
