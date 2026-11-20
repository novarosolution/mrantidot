import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { colors, fonts, gradients } from '@/constants/theme';

/** Tablet / desktop browser windows show the sign-in as a centred card instead of a stretched phone screen. */
const FRAME_MIN_WIDTH = 768;

function WebAuthFrameWeb({ children }: { children: ReactNode }) {
  const { width } = useWindowDimensions();
  if (width < FRAME_MIN_WIDTH) return <>{children}</>;
  return (
    <View style={styles.page}>
      <LinearGradient colors={gradients.premiumHero} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      <View style={styles.card}>{children}</View>
      <Text style={styles.caption}>Mr Antidot · Admin panel</Text>
    </View>
  );
}

function WebAuthFrameNative({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

/** Web-only frame around auth screens; renders its children untouched on iOS / Android. */
export const WebAuthFrame = Platform.OS === 'web' ? WebAuthFrameWeb : WebAuthFrameNative;

const styles = StyleSheet.create({
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: colors.forestDeep,
  },
  card: {
    width: '100%',
    maxWidth: 460,
    flex: 1,
    maxHeight: 780,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: colors.white,
    shadowColor: '#02180C',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.35,
    shadowRadius: 48,
  },
  caption: {
    marginTop: 18,
    fontFamily: fonts.bodySemi,
    fontSize: 12.5,
    letterSpacing: 0.2,
    color: 'rgba(255,255,255,0.72)',
  },
});
