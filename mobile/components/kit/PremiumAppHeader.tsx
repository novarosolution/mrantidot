import { type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FocusStatusBar } from '@/components/ui/FocusStatusBar';
import { PremiumAurora } from '@/components/kit/PremiumAurora';
import { fonts, headerTopPad, ui } from '@/constants/theme';

/**
 * Shared header for admin + technician tab roots — the same white → mint wash as
 * the customer home, fading into the page canvas so there is no visible seam.
 */
export function PremiumAppHeader({
  eyebrow,
  title,
  subtitle,
  right,
  sliceColor = ui.surfaceMuted,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  /** Page canvas colour the header fades into. */
  sliceColor?: string;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.shell, { paddingTop: headerTopPad(insets.top) }]}>
      <FocusStatusBar style="dark" />
      <LinearGradient
        colors={['#FFFFFF', '#EAF4EC', sliceColor]}
        locations={[0, 0.62, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <PremiumAurora tone="light" base={false} />
      <View style={styles.row}>
        <View style={styles.textCol}>
          <View style={styles.eyebrowRow}>
            <View style={styles.eyebrowDot} />
            <Text style={styles.eyebrow} numberOfLines={1}>
              {eyebrow}
            </Text>
          </View>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.sub} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { paddingHorizontal: 18, paddingBottom: 18, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  textCol: { flex: 1, minWidth: 0 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  eyebrowDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: ui.brandBright },
  eyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 10.5,
    letterSpacing: 1.2,
    color: ui.brand,
  },
  title: {
    fontFamily: fonts.displayExtra,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.55,
    color: ui.text,
  },
  sub: {
    marginTop: 4,
    fontFamily: fonts.bodyMedium,
    fontSize: 13.5,
    lineHeight: 19,
    color: ui.textSecondary,
  },
});
