import { StyleSheet, Text, View } from 'react-native';
import { bookingStatusLabel, bookingStatusMessage } from '@/lib/booking-helpers';
import type { BookingStatus } from '@/types/api';
import { colors, fonts, premium, shadows, spacing, statusColors } from '@/constants/theme';

export function BookingStatusBanner({
  status,
  audience = 'customer',
}: {
  status: BookingStatus;
  audience?: 'customer' | 'technician' | 'staff';
}) {
  const palette = statusColors[status] ?? statusColors.pending;
  const message = bookingStatusMessage(status, audience);

  return (
    <View style={[styles.wrap, { backgroundColor: palette.bg }, shadows.floating]}>
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
  accent: { width: 4 },
  content: { flex: 1, padding: spacing.md },
  label: { fontFamily: fonts.display, fontSize: 14 },
  message: { fontFamily: fonts.body, fontSize: 12, marginTop: 4, lineHeight: 17, opacity: 0.9 },
});
