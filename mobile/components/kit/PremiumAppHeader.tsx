import { LinearGradient } from 'expo-linear-gradient';
import { type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HeroDarkSlice } from '@/components/kit/HeroDarkSlice';
import { FocusStatusBar } from '@/components/ui/FocusStatusBar';
import { colors, fonts, headerTopPad, ui } from '@/constants/theme';

/** Shared premium forest header for admin + technician tab roots. */
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
  sliceColor?: string;
}) {
  const insets = useSafeAreaInsets();

  return (
    <HeroDarkSlice
      style={styles.shell}
      sliceHeight={18}
      sliceColor={sliceColor}
      contentStyle={[styles.content, { paddingTop: headerTopPad(insets.top) }]}
    >
      <FocusStatusBar style="light" />
      <View style={styles.row}>
        <View style={styles.textCol}>
          <View style={styles.eyebrowRow}>
            <LinearGradient
              colors={['#D4F28A', colors.limeBright]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.eyebrowBar}
            />
            <Text style={styles.eyebrow}>{eyebrow}</Text>
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
    </HeroDarkSlice>
  );
}

const styles = StyleSheet.create({
  shell: { marginBottom: -2 },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 16,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  textCol: { flex: 1, minWidth: 0 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 7 },
  eyebrowBar: { width: 20, height: 3, borderRadius: 2 },
  eyebrow: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    letterSpacing: 1.35,
    color: 'rgba(255,255,255,0.9)',
  },
  title: {
    fontFamily: fonts.displayExtra,
    fontSize: 28,
    lineHeight: 33,
    letterSpacing: -0.7,
    color: colors.white,
  },
  sub: {
    marginTop: 5,
    fontFamily: fonts.body,
    fontSize: 13.5,
    lineHeight: 19,
    color: 'rgba(255,255,255,0.84)',
  },
});
