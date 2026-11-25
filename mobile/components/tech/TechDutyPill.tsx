import { StyleSheet, Text, View } from 'react-native';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { dutyLabel, type DutyState } from '@/lib/techLabels';
import { colors, fonts, radii, ui } from '@/constants/theme';

const TONE: Record<DutyState, { bg: string; dot: string; text: string }> = {
  on: { bg: ui.brandSoft, dot: colors.green, text: ui.brand },
  checkedOut: { bg: ui.surfaceMuted, dot: ui.textTertiary, text: ui.textSecondary },
  leave: { bg: colors.blueBg, dot: colors.blue, text: colors.blue },
  absent: { bg: colors.errorBg, dot: colors.error, text: colors.error },
  pending: { bg: colors.amberBg, dot: colors.amber, text: colors.amberInk },
};

/** Today's duty status as a tinted pill (jobs header, profile card). */
export function TechDutyPill({ state, size = 'md' }: { state: DutyState; size?: 'sm' | 'md' }) {
  const copy = useCustomerUiCopy();
  const tone = TONE[state];
  const label = dutyLabel(copy, state);
  return (
    <View
      style={[styles.pill, size === 'sm' && styles.pillSm, { backgroundColor: tone.bg }]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={label}
    >
      <View style={[styles.dot, { backgroundColor: tone.dot }]} />
      <Text style={[styles.text, size === 'sm' && styles.textSm, { color: tone.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
  },
  pillSm: { gap: 5, paddingHorizontal: 9, paddingVertical: 4 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  text: { fontFamily: fonts.bodyBold, fontSize: 12 },
  textSm: { fontFamily: fonts.bodySemi, fontSize: 11.5 },
});
