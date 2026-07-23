import { StyleSheet, Text } from 'react-native';
import { GlassChip } from '@/components/kit/GlassScreenKit';
import { adminType, colors, premiumType, surfaces } from '@/constants/theme';

export type BadgeTone = 'success' | 'info' | 'sky' | 'warning' | 'danger' | 'neutral' | 'gold';

const TONES: Record<BadgeTone, { bg: string; text: string; border: string }> = {
  success: { bg: 'rgba(220,252,231,0.72)', text: surfaces.tintSuccessInk, border: 'rgba(11,114,40,0.12)' },
  info: { bg: 'rgba(232,244,241,0.72)', text: surfaces.tintInfoInk, border: 'rgba(58,150,136,0.12)' },
  sky: { bg: 'rgba(232,244,241,0.72)', text: surfaces.tintInfoInk, border: 'rgba(58,150,136,0.12)' },
  warning: { bg: 'rgba(254,243,199,0.72)', text: surfaces.tintWarningInk, border: 'rgba(182,132,28,0.12)' },
  danger: { bg: 'rgba(254,226,226,0.72)', text: surfaces.tintDangerInk, border: 'rgba(185,28,28,0.12)' },
  neutral: { bg: 'rgba(238,242,238,0.72)', text: colors.muted, border: 'rgba(92,138,99,0.12)' },
  gold: { bg: 'rgba(238,248,230,0.72)', text: colors.forest, border: surfaces.glassBorderStrong },
};

/** Generic status/role/availability pill with a semantic tone. */
export function StatusBadge({ label, tone = 'neutral' }: { label: string; tone?: BadgeTone }) {
  const palette = TONES[tone];
  return (
    <GlassChip style={[styles.pill, { backgroundColor: palette.bg, borderColor: palette.border }]}>
      <Text style={[styles.text, { color: palette.text }]}>{label}</Text>
    </GlassChip>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
  },
  text: {
    ...premiumType.kicker,
    ...adminType.statLabel,
    fontSize: 10,
    letterSpacing: 0.45,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
});
