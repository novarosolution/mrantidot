import { StyleSheet, Text, View } from 'react-native';
import type { BookingStatus } from '@/types/api';
import { colors, radii, surfaces, typeScale } from '@/constants/theme';
import { bookingStatusLabel } from '@/lib/booking-helpers';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';

/** Distinct, quiet tints per status — readable at a glance on white cards. */
const PILL_COLORS: Record<BookingStatus, { bg: string; text: string }> = {
  pending: { bg: colors.amberBg, text: colors.amberInk },
  confirmed: { bg: colors.blueBg, text: colors.blue },
  in_progress: { bg: colors.soft, text: colors.forest },
  awaiting_verification: { bg: surfaces.tintInfo, text: colors.secondaryInk },
  completed: { bg: colors.greyBg, text: colors.muted },
  cancelled: { bg: colors.errorBg, text: colors.error },
};

/** Compact booking status pill; the label comes from the admin-editable status copy. */
export function StatusPill({ status }: { status: BookingStatus | string }) {
  const copy = useCustomerUiCopy();
  const key = status as BookingStatus;
  const palette = PILL_COLORS[key] ?? PILL_COLORS.pending;
  const label = bookingStatusLabel(key, copy);

  return (
    <View style={[styles.pill, { backgroundColor: palette.bg }]}>
      <Text style={[styles.text, { color: palette.text }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { alignSelf: 'flex-start', borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 4 },
  text: { ...typeScale.micro, fontFamily: typeScale.button.fontFamily },
});
