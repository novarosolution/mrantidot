import { useCallback, useState } from 'react';
import { api, getApiErrorMessage } from '@/lib/api';
import { confirmAsync } from '@/lib/confirm';
import { haptic } from '@/lib/motion';
import { appToast } from '@/lib/toast';
import type { ReopenResult } from '@/types/adminOps';
import type { Booking } from '@/types/api';

function errorCode(err: unknown): string | undefined {
  const data = (err as { response?: { data?: { code?: unknown } } })?.response?.data;
  return typeof data?.code === 'string' ? data.code : undefined;
}

function outcome(r: ReopenResult): string {
  const coupon = r.couponDropped ? ' The coupon was removed.' : '';
  if (r.status === 'confirmed') {
    return `Confirmed for the same visit time${r.assigned ? ' · technician auto-assigned' : ''}. The customer has been told.${coupon}`;
  }
  if (!r.slotOpen) return `Back to pending — the old visit time has passed, so confirm a new one.${coupon}`;
  return `Back to pending — confirm the visit time when ready. The customer has been told.${coupon}`;
}

/**
 * Reopens a cancelled booking (POST /bookings/:id/reopen). Asks first (unless it's an Undo), and when the
 * coupon ran out meanwhile (409 COUPON_LIMIT) offers to reopen without it. Toasts + haptics included.
 */
export function useReopenBooking(onReopened: (booking: Booking, result: ReopenResult) => void | Promise<void>) {
  const [busy, setBusy] = useState(false);

  const reopen = useCallback(
    async (booking: Pick<Booking, 'id' | 'couponCode'>, opts: { undo?: boolean } = {}) => {
      if (busy) return;
      if (!opts.undo) {
        const ok = await confirmAsync({
          title: 'Reopen this booking?',
          message: [
            'It goes back to pending — or straight to confirmed when auto-confirm is on and the visit time is still open. The customer is notified.',
            booking.couponCode ? `Coupon ${booking.couponCode.toUpperCase()} is counted again.` : '',
            'The technician it had stays unassigned — assign one again (auto-assign does it when it’s on).',
          ]
            .filter(Boolean)
            .join('\n\n'),
          confirmLabel: 'Reopen booking',
          cancelLabel: 'Keep cancelled',
        });
        if (!ok) return;
      }
      setBusy(true);
      const run = (dropCoupon: boolean) =>
        api.post<{ booking: Booking; reopened: ReopenResult }>(
          `/bookings/${booking.id}/reopen`,
          dropCoupon ? { dropCoupon: true } : {},
          { skipErrorToast: true },
        );
      try {
        let res;
        try {
          res = await run(false);
        } catch (err) {
          if (errorCode(err) !== 'COUPON_LIMIT') throw err;
          haptic('warning');
          const drop = await confirmAsync({
            title: 'The coupon is used up',
            message: getApiErrorMessage(err),
            confirmLabel: 'Reopen without coupon',
            cancelLabel: 'Keep cancelled',
          });
          if (!drop) return;
          res = await run(true);
        }
        haptic('success');
        appToast({ type: 'success', title: opts.undo ? 'Cancel undone' : 'Booking reopened', message: outcome(res.data.reopened), duration: 4200 });
        await onReopened(res.data.booking, res.data.reopened);
      } catch (err) {
        haptic('error');
        appToast({ type: 'error', title: 'Could not reopen the booking', message: getApiErrorMessage(err) });
      } finally {
        setBusy(false);
      }
    },
    [busy, onReopened],
  );

  return { reopen, reopening: busy };
}
