import { StyleSheet, Text, View } from 'react-native';
import type { BookingStatus } from '@/types/api';
import { colors, fonts, surfaces } from '@/constants/theme';

const LABELS: Partial<Record<BookingStatus, string>> = {
  in_progress: 'In progress',
  awaiting_verification: 'Awaiting code',
};

/** Distinct, quiet tints per status — readable at a glance on white cards. */
const PILL_COLORS: Record<BookingStatus, { bg: string; text: string }> = {
  pending: { bg: colors.amberBg, text: colors.amberInk },
  confirmed: { bg: colors.blueBg, text: colors.blue },
  in_progress: { bg: colors.soft, text: colors.forest },
  awaiting_verification: { bg: surfaces.tintInfo, text: colors.secondaryInk },
  completed: { bg: colors.greyBg, text: colors.muted },
  cancelled: { bg: colors.errorBg, text: colors.error },
};

/** Compact booking status badge. */
export function StatusPill({ status }: { status: BookingStatus | string }) {
  const key = status as BookingStatus;
  const palette = PILL_COLORS[key] ?? PILL_COLORS.pending;
  const label = LABELS[key] ?? status.replace(/_/g, ' ');

  return (
    <View style={[styles.pill, { backgroundColor: palette.bg }]}>
      <Text style={[styles.text, { color: palette.text }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  text: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 0.1,
    textTransform: 'capitalize',
  },
});
