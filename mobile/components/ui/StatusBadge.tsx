import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, premium, surfaces } from '@/constants/theme';

export type BadgeTone = 'success' | 'info' | 'sky' | 'warning' | 'danger' | 'neutral' | 'gold';

const TONES: Record<BadgeTone, { bg: string; text: string }> = {
  success: { bg: surfaces.tintSuccess, text: surfaces.tintSuccessInk },
  info: { bg: surfaces.tintInfo, text: surfaces.tintInfoInk },
  sky: { bg: surfaces.tintInfo, text: surfaces.tintInfoInk },
  warning: { bg: surfaces.tintWarning, text: surfaces.tintWarningInk },
  danger: { bg: surfaces.tintDanger, text: surfaces.tintDangerInk },
  neutral: { bg: colors.greyBg, text: colors.muted },
  gold: { bg: premium.accentGoldBg, text: colors.amberInk },
};

/** Generic status/role/availability pill with a semantic tone. */
export function StatusBadge({ label, tone = 'neutral' }: { label: string; tone?: BadgeTone }) {
  const palette = TONES[tone];
  return (
    <View style={[styles.pill, { backgroundColor: palette.bg }]}>
      <Text style={[styles.text, { color: palette.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  text: { fontSize: 11, fontFamily: fonts.bodySemi, letterSpacing: 0.2 },
});
