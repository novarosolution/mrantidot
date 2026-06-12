import { StyleSheet, Text, View } from 'react-native';
import { bookingStatusLabel } from '@/lib/booking-helpers';
import type { BookingStatus } from '@/types/api';
import { colors, fonts, premium, shadows, spacing, statusColors } from '@/constants/theme';

export function BookingStatusBanner({
  status,
}: {
  status: BookingStatus;
  audience?: 'customer' | 'technician' | 'staff';
}) {
  const palette = statusColors[status] ?? statusColors.pending;

  return (
    <View style={[styles.wrap, { backgroundColor: palette.bg }, shadows.floating]}>
      <View style={[styles.accent, { backgroundColor: palette.text }]} />
      <View style={styles.content}>
        <Text style={[styles.label, { color: palette.text }]}>{bookingStatusLabel(status)}</Text>
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
});
