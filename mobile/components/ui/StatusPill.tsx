import { StyleSheet, Text } from 'react-native';
import type { BookingStatus } from '@/types/api';
import { GlassChip } from '@/components/kit/GlassScreenKit';
import { adminType, colors, surfaces } from '@/constants/theme';

const LABELS: Partial<Record<BookingStatus, string>> = {
  in_progress: 'In progress',
  awaiting_verification: 'Review',
};

const PILL_COLORS: Record<BookingStatus, { bg: string; text: string }> = {
  pending: { bg: 'rgba(238,248,230,0.72)', text: colors.forest },
  confirmed: { bg: 'rgba(234,246,227,0.72)', text: colors.green },
  in_progress: { bg: 'rgba(238,248,230,0.72)', text: colors.forest },
  awaiting_verification: { bg: 'rgba(238,248,230,0.72)', text: colors.forest },
  completed: { bg: 'rgba(238,242,238,0.72)', text: colors.muted },
  cancelled: { bg: 'rgba(251,231,225,0.72)', text: colors.error },
};

/** Translucent glass booking status pill. */
export function StatusPill({ status }: { status: BookingStatus | string }) {
  const key = status as BookingStatus;
  const palette = PILL_COLORS[key] ?? PILL_COLORS.pending;
  const label = LABELS[key] ?? status.replace(/_/g, ' ');

  return (
    <GlassChip style={[styles.pill, { backgroundColor: palette.bg, borderColor: surfaces.glassBorderStrong }]}>
      <Text style={[styles.text, { color: palette.text }]}>{label}</Text>
    </GlassChip>
  );
}

const styles = StyleSheet.create({
  pill: { alignSelf: 'flex-start', borderRadius: 999 },
  text: {
    ...adminType.statLabel,
    fontSize: 10,
    letterSpacing: 0.35,
    textTransform: 'capitalize',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
});
