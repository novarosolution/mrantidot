import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BrandLogo } from '@/components/BrandLogo';
import { useReducedMotion } from '@/lib/a11yPrefs';
import { fonts, ui } from '@/constants/theme';

const CLOSING_IMAGE = require('@/assets/home-closing.webp');
/** Source artwork is 1806×2000 — keep its ratio so nothing is cropped. */
const IMAGE_RATIO = 1806 / 2000;

/** "Safe homes, happy families" → script "Safe homes," over bold "happy families". */
function splitHeadline(line: string): { script?: string; bold: string } {
  const text = line.trim();
  const i = text.indexOf(',');
  if (i <= 0 || i === text.length - 1) return { bold: text };
  return { script: text.slice(0, i + 1).trim(), bold: text.slice(i + 1).trim() };
}

/**
 * Feed sign-off — logo lockup, a script + bold headline, then the full-width "technician at the
 * door" artwork that fades in from the page background.
 */
export function HomeBrandClosing({ brandName, line }: { brandName: string; line: string }) {
  const reduced = useReducedMotion();
  const { width: screenW } = useWindowDimensions();
  const imageH = Math.round(screenW / IMAGE_RATIO);
  const { script, bold } = splitHeadline(line);

  const enter = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  useEffect(() => {
    if (reduced) return;
    Animated.timing(enter, { toValue: 1, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [enter, reduced]);
  const rise = {
    opacity: enter,
    transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
  };

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.head, rise]}>
        <View style={styles.lockup}>
          <View style={styles.logo}>
            <BrandLogo size={30} animate={false} />
          </View>
          <Text style={styles.brand}>{brandName}</Text>
        </View>

        <View style={styles.headline} accessible accessibilityRole="header" accessibilityLabel={line}>
          {script ? <Text style={styles.script}>{script}</Text> : null}
          <Text style={[styles.bold, script ? styles.boldAfterScript : null]}>{bold}</Text>
        </View>
      </Animated.View>

      <Animated.View style={[{ width: screenW, height: imageH }, rise]}>
        <Image
          source={CLOSING_IMAGE}
          style={{ width: screenW, height: imageH }}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
          accessibilityLabel="A Mr Antidot technician being welcomed at a customer's front door"
        />
        {/* Sky dissolves into the white page above, so the art feels poured into the feed. */}
        <LinearGradient
          colors={['#FFFFFF', 'rgba(255,255,255,0.85)', 'rgba(255,255,255,0)']}
          locations={[0, 0.35, 1]}
          style={styles.fade}
          pointerEvents="none"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: '#FFFFFF', marginTop: 8, paddingTop: 36, overflow: 'hidden' },
  head: { alignItems: 'center' },
  lockup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...ui.shadow,
  },
  brand: { fontFamily: fonts.displayExtra, fontSize: 18, letterSpacing: -0.3, color: ui.text },
  headline: { alignItems: 'center', marginTop: 26, paddingHorizontal: 24 },
  script: {
    fontFamily: fonts.script,
    fontSize: 46,
    lineHeight: 56,
    color: ui.text,
    textAlign: 'center',
    // Dancing Script's swashes overhang the line box; a little padding stops them clipping.
    paddingHorizontal: 8,
  },
  bold: {
    fontFamily: fonts.displayExtra,
    fontSize: 38,
    lineHeight: 44,
    letterSpacing: -1.2,
    color: ui.text,
    textAlign: 'center',
  },
  /** Tuck the bold line under the script so the two read as one lock-up. */
  boldAfterScript: { marginTop: -2 },
  fade: { position: 'absolute', top: 0, left: 0, right: 0, height: '42%' },
});
