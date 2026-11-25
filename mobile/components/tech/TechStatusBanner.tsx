import { StyleSheet, Text, View } from 'react-native';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { jobGuidance, jobStatusLabel } from '@/lib/techLabels';
import type { BookingStatus } from '@/types/api';
import { fonts, radii, spacing, statusColors } from '@/constants/theme';

/** Job status with the technician's next step, tinted by status (admin-editable copy). */
export function TechStatusBanner({ status }: { status: BookingStatus }) {
  const copy = useCustomerUiCopy();
  const palette = statusColors[status] ?? statusColors.pending;
  const label = jobStatusLabel(copy, status);
  const guidance = jobGuidance(copy, status);
  return (
    <View
      style={[styles.wrap, { backgroundColor: palette.bg }]}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`${label}. ${guidance}`}
    >
      <View style={[styles.accent, { backgroundColor: palette.text }]} />
      <View style={styles.body}>
        <Text style={[styles.label, { color: palette.text }]}>{label}</Text>
        <Text style={[styles.message, { color: palette.text }]}>{guidance}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', borderRadius: radii.card, overflow: 'hidden' },
  accent: { width: 4 },
  body: { flex: 1, padding: spacing.md },
  label: { fontFamily: fonts.bodyBold, fontSize: 15 },
  message: { marginTop: 3, fontFamily: fonts.body, fontSize: 13, lineHeight: 18 },
});
