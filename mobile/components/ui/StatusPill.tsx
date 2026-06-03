import { StyleSheet, Text, View } from 'react-native';
import type { BookingStatus } from '@/types/api';
import { fonts, statusColors } from '@/constants/theme';

const LABELS: Partial<Record<BookingStatus, string>> = {
  in_progress: 'In progress',
  awaiting_verification: 'Review',
};

export function StatusPill({ status }: { status: BookingStatus | string }) {
  const key = status as BookingStatus;
  const palette = statusColors[key] ?? statusColors.pending;
  const label = LABELS[key] ?? status.replace(/_/g, ' ');
  return (
    <View style={[styles.pill, { backgroundColor: palette.bg }]}>
      <Text style={[styles.text, { color: palette.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  text: { fontSize: 11, fontFamily: fonts.bodySemi, textTransform: 'capitalize' },
});
