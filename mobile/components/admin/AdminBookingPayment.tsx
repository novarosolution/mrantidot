import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { AdminBottomSheet } from '@/components/kit/AdminBottomSheet';
import { BookingPriceBreakdown } from '@/components/kit/BookingPriceBreakdown';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api';
import { useBusinessSettings } from '@/lib/businessSettings';
import { bookingServiceName } from '@/lib/booking-helpers';
import { confirmAsync } from '@/lib/confirm';
import { haptic } from '@/lib/motion';
import { activePaymentMethods, paymentLabel } from '@/lib/settingsLabels';
import { PAYMENT_REF_MAX } from '@/types/adminOps';
import type { Booking, BookingPaymentStatus } from '@/types/api';
import { colors, fonts, radii, spacing, ui } from '@/constants/theme';

const STATUS_LOOK: Record<BookingPaymentStatus, { label: string; bg: string; text: string }> = {
  unpaid: { label: 'Unpaid', bg: colors.amberBg, text: colors.amberInk },
  paid: { label: 'Paid', bg: colors.soft, text: colors.forest },
  refunded: { label: 'Refunded', bg: colors.blueBg, text: colors.blue },
};

const CASH = 'cash';

function when(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

type SheetMode = 'paid' | 'refunded' | null;

/**
 * Price breakdown plus the admin-tracked payment state.
 * Server: PATCH /bookings/:id/payment { status: 'unpaid' | 'paid' | 'refunded', via?, ref? } → { booking }.
 */
export function AdminBookingPayment({
  booking,
  onBookingChange,
}: {
  booking: Booking;
  onBookingChange: (next: Booking) => void;
}) {
  const settings = useBusinessSettings();
  const status: BookingPaymentStatus = booking.paymentStatus ?? 'unpaid';
  const look = STATUS_LOOK[status];
  const [sheet, setSheet] = useState<SheetMode>(null);
  const [via, setVia] = useState('');
  const [ref, setRef] = useState('');
  const [busy, setBusy] = useState(false);

  // Active methods from Business settings → Payments, plus cash on site; keeps a stored method that was switched off.
  const methods = useMemo(() => {
    const list = activePaymentMethods(settings).map((m) => ({ key: m.key, label: m.label }));
    if (!list.some((m) => m.key === CASH)) list.push({ key: CASH, label: 'Cash' });
    const current = booking.paidVia;
    if (current && !list.some((m) => m.key === current)) list.unshift({ key: current, label: paymentLabel(current, settings) });
    return list;
  }, [settings, booking.paidVia]);

  const methodName = (key?: string) => (key === CASH ? 'Cash' : paymentLabel(key, settings));

  function openSheet(mode: Exclude<SheetMode, null>) {
    const preferred = booking.paidVia || booking.paymentMethod;
    setVia(methods.some((m) => m.key === preferred) ? preferred : methods[0]?.key ?? CASH);
    setRef(mode === 'paid' ? booking.paymentRef ?? '' : '');
    setSheet(mode);
  }

  async function save(next: BookingPaymentStatus, body: { via?: string; ref?: string } = {}) {
    setBusy(true);
    try {
      const { data } = await api.patch<{ booking: Booking }>(`/bookings/${booking.id}/payment`, { status: next, ...body });
      haptic('success');
      Toast.show({
        type: 'success',
        text1: next === 'paid' ? 'Marked as paid' : next === 'refunded' ? 'Refund recorded' : 'Marked as unpaid',
      });
      setSheet(null);
      onBookingChange(data.booking);
    } catch {
      haptic('error');
    } finally {
      setBusy(false);
    }
  }

  async function markUnpaid() {
    const ok = await confirmAsync({
      title: 'Mark as unpaid?',
      message: 'Clears the payment method, reference and dates recorded for this booking.',
      confirmLabel: 'Mark unpaid',
      cancelLabel: 'Back',
      destructive: true,
    });
    if (ok) await save('unpaid');
  }

  const details: string[] = [];
  if (status === 'paid') {
    details.push(`Paid via ${methodName(booking.paidVia)}${booking.paidAt ? ` · ${when(booking.paidAt)}` : ''}`);
  } else if (status === 'refunded') {
    details.push(`Refunded${booking.refundedAt ? ` · ${when(booking.refundedAt)}` : ''}`);
    if (booking.paidVia) details.push(`Paid via ${methodName(booking.paidVia)}${booking.paidAt ? ` · ${when(booking.paidAt)}` : ''}`);
  } else {
    details.push(`Customer chose “${paymentLabel(booking.paymentMethod, settings)}” when booking.`);
  }

  return (
    <Card variant="premium" style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.title}>Payment</Text>
        <View style={[styles.pill, { backgroundColor: look.bg }]} accessibilityLabel={`Payment status: ${look.label}`}>
          <Text style={[styles.pillText, { color: look.text }]}>{look.label}</Text>
        </View>
      </View>

      <BookingPriceBreakdown
        amount={booking.amount}
        serviceName={bookingServiceName(booking)}
        serviceDesc={booking.service && typeof booking.service === 'object' ? booking.service.shortDesc : undefined}
      />

      <View style={styles.details}>
        {details.map((line) => (
          <Text key={line} style={styles.detail}>
            {line}
          </Text>
        ))}
        {booking.paymentRef ? (
          <Text style={styles.detail} selectable>
            Reference: <Text style={styles.ref}>{booking.paymentRef}</Text>
          </Text>
        ) : null}
      </View>

      <View style={styles.actions}>
        {status !== 'paid' ? (
          <Button
            title={status === 'refunded' ? 'Mark paid again' : 'Mark as paid'}
            variant={status === 'unpaid' ? 'premium' : 'secondary'}
            size="sm"
            onPress={() => openSheet('paid')}
            disabled={busy}
            fullWidth={false}
            style={styles.action}
          />
        ) : (
          <Button
            title="Record refund"
            variant="secondary"
            size="sm"
            onPress={() => openSheet('refunded')}
            disabled={busy}
            fullWidth={false}
            style={styles.action}
          />
        )}
        {status !== 'unpaid' ? (
          <Button
            title="Mark unpaid"
            variant="ghost"
            size="sm"
            onPress={() => void markUnpaid()}
            loading={busy && sheet === null}
            fullWidth={false}
            style={styles.action}
          />
        ) : null}
      </View>

      <AdminBottomSheet
        visible={sheet !== null}
        onClose={() => {
          if (!busy) setSheet(null);
        }}
        title={sheet === 'refunded' ? 'Record refund' : 'Mark as paid'}
        hint={
          sheet === 'refunded'
            ? 'Use this after the money has gone back to the customer.'
            : `Record how the customer paid ${booking.amount ? `₹${Math.round(booking.amount.total).toLocaleString('en-IN')}` : ''}.`
        }
        footer={
          <>
            <Button
              title={sheet === 'refunded' ? 'Save refund' : 'Save payment'}
              variant="premium"
              loading={busy}
              onPress={() =>
                void save(sheet === 'refunded' ? 'refunded' : 'paid', {
                  ...(sheet === 'paid' ? { via } : {}),
                  ref: ref.trim(),
                })
              }
            />
            <Button title="Close" variant="secondary" onPress={() => setSheet(null)} disabled={busy} />
          </>
        }
      >
        {sheet === 'paid' ? (
          <>
            <Text style={styles.label}>Paid with</Text>
            <View style={styles.chips}>
              {methods.map((m) => (
                <Chip key={m.key} label={m.label} compact selected={via === m.key} onPress={() => setVia(m.key)} />
              ))}
            </View>
          </>
        ) : null}
        <Input
          label={sheet === 'refunded' ? 'Refund reference (optional)' : 'Transaction / receipt reference (optional)'}
          value={ref}
          onChangeText={(t) => setRef(t.slice(0, PAYMENT_REF_MAX))}
          placeholder={sheet === 'refunded' ? 'e.g. UPI refund ID' : 'e.g. UPI ref, receipt no.'}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={PAYMENT_REF_MAX}
          accessibilityLabel="Payment reference"
        />
      </AdminBottomSheet>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: spacing.md, padding: spacing.md },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  title: { fontFamily: fonts.display, fontSize: 14, color: colors.ink },
  pill: { borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { fontFamily: fonts.bodySemi, fontSize: 12 },
  details: { marginTop: spacing.sm, gap: 4 },
  detail: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: colors.muted },
  ref: { fontFamily: fonts.bodySemi, color: colors.ink },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  action: { minWidth: 132 },
  label: { fontFamily: fonts.bodySemi, fontSize: 12, color: ui.textSecondary, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
});
