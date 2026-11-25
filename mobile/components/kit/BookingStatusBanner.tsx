import { StyleSheet, Text, View } from 'react-native';
import { bookingStatusLabel, bookingStatusMessage } from '@/lib/booking-helpers';
import type { BookingStatus } from '@/types/api';
import { fonts, premium, spacing, statusColors } from '@/constants/theme';

export function BookingStatusBanner({
  status,
  audience = 'customer',
  flush = false,
  message: messageOverride,
}: {
  status: BookingStatus;
  audience?: 'customer' | 'technician' | 'staff';
  /** Drop the side gutter when the parent scroll view already pads its content. */
  flush?: boolean;
  /** Replaces the default status copy (e.g. when the next step depends on more than status). */
  message?: string;
}) {
  const palette = statusColors[status] ?? statusColors.pending;
  const message = messageOverride ?? bookingStatusMessage(status, audience);

  return (
    <View style={[styles.wrap, flush && styles.flush, { backgroundColor: palette.bg }]}>
      <View style={[styles.accent, { backgroundColor: palette.text }]} />
      <View style={styles.content}>
        <Text style={[styles.label, { color: palette.text }]}>{bookingStatusLabel(status)}</Text>
        {message ? <Text style={[styles.message, { color: palette.text }]}>{message}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: premium.radiusCard,
    overflow: 'hidden',
  },
  flush: { marginHorizontal: 0 },
  accent: { width: 4 },
  content: { flex: 1, padding: spacing.md },
  label: { fontFamily: fonts.bodyBold, fontSize: 14.5 },
  message: { fontFamily: fonts.body, fontSize: 13, marginTop: 3, lineHeight: 18, opacity: 0.9 },
});
