import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, surfaces } from '@/constants/theme';

export type BadgeTone = 'success' | 'info' | 'sky' | 'warning' | 'danger' | 'neutral' | 'gold';

const TONES: Record<BadgeTone, { bg: string; text: string }> = {
  success: { bg: surfaces.tintSuccess, text: surfaces.tintSuccessInk },
  info: { bg: surfaces.tintInfo, text: surfaces.tintInfoInk },
  sky: { bg: surfaces.tintInfo, text: surfaces.tintInfoInk },
  warning: { bg: surfaces.tintWarning, text: surfaces.tintWarningInk },
  danger: { bg: surfaces.tintDanger, text: surfaces.tintDangerInk },
  neutral: { bg: colors.greyBg, text: colors.muted },
  gold: { bg: colors.soft, text: colors.forest },
};

/** Generic status/role/availability badge with a semantic tone — compact, same shape as StatusPill. */
export function StatusBadge({ label, tone = 'neutral' }: { label: string; tone?: BadgeTone }) {
  const palette = TONES[tone];
  return (
    <View style={[styles.pill, { backgroundColor: palette.bg }]}>
      <Text style={[styles.text, { color: palette.text }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  text: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 0.1,
  },
});
