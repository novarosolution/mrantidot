import { useEffect, useId, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useReducedMotion } from '@/lib/a11yPrefs';

/** Deep emerald the dark aurora starts from — also fills the status-bar strip above the home header. */
export const AURORA_DEEP_TOP = '#06361B';
/** Top of the calm brand-green header (home) — also the status-bar strip colour above it. */
export const AURORA_BRAND_TOP = '#0F8C40';

type Tone = 'dark' | 'light' | 'brand';

type BlobSpec = {
  /** Centre, as % of the container. */
  x: number;
  y: number;
  size: number;
  color: string;
  alpha: number;
  /** Drift in px along each axis (there and back). */
  dx: number;
  dy: number;
  scaleTo: number;
  /** One full there-and-back, ms. Different per blob so the motion never visibly repeats in sync. */
  duration: number;
};

const DARK_BLOBS: BlobSpec[] = [
  // Champagne gold — warm highlight, top right.
  { x: 88, y: 16, size: 300, color: '#F4D98C', alpha: 0.34, dx: -46, dy: 30, scaleTo: 1.18, duration: 15000 },
  // Fresh mint — lower left.
  { x: 6, y: 78, size: 320, color: '#4FE08A', alpha: 0.3, dx: 52, dy: -26, scaleTo: 1.12, duration: 19000 },
  // Deep teal — slow undertow through the middle.
  { x: 56, y: 52, size: 280, color: '#13B7A0', alpha: 0.22, dx: -60, dy: -20, scaleTo: 1.22, duration: 23000 },
];

/** Barely-there motion for the home header: reads as a flat brand colour with a little depth. */
const BRAND_BLOBS: BlobSpec[] = [
  { x: 90, y: 20, size: 300, color: '#F4D98C', alpha: 0.1, dx: -40, dy: 26, scaleTo: 1.14, duration: 18000 },
  { x: 8, y: 80, size: 320, color: '#6BE6A0', alpha: 0.16, dx: 46, dy: -22, scaleTo: 1.1, duration: 22000 },
  { x: 55, y: 45, size: 280, color: '#19C2A6', alpha: 0.1, dx: -50, dy: -18, scaleTo: 1.18, duration: 26000 },
];

const LIGHT_BLOBS: BlobSpec[] = [
  { x: 92, y: 10, size: 240, color: '#F6E2A8', alpha: 0.5, dx: -34, dy: 18, scaleTo: 1.15, duration: 17000 },
  { x: 4, y: 40, size: 260, color: '#B7E6C4', alpha: 0.62, dx: 40, dy: 14, scaleTo: 1.12, duration: 21000 },
  { x: 60, y: 90, size: 230, color: '#BDEBE0', alpha: 0.45, dx: -44, dy: -14, scaleTo: 1.18, duration: 25000 },
];

function Blob({ spec, animated }: { spec: BlobSpec; animated: boolean }) {
  const id = useId().replace(/:/g, '');
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1, duration: spec.duration / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(t, { toValue: 0, duration: spec.duration / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [animated, spec.duration, t]);

  const r = spec.size / 2;
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: `${spec.x}%`,
        top: `${spec.y}%`,
        width: spec.size,
        height: spec.size,
        marginLeft: -r,
        marginTop: -r,
        transform: [
          { translateX: t.interpolate({ inputRange: [0, 1], outputRange: [0, spec.dx] }) },
          { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, spec.dy] }) },
          { scale: t.interpolate({ inputRange: [0, 1], outputRange: [1, spec.scaleTo] }) },
        ],
      }}
    >
      <Svg width={spec.size} height={spec.size}>
        <Defs>
          <RadialGradient id={`b-${id}`} cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor={spec.color} stopOpacity={spec.alpha} />
            <Stop offset="55%" stopColor={spec.color} stopOpacity={spec.alpha * 0.32} />
            <Stop offset="100%" stopColor={spec.color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={r} cy={r} r={r} fill={`url(#b-${id})`} />
      </Svg>
    </Animated.View>
  );
}

/** A soft diagonal glint that crosses the header every few seconds. */
function Sheen({ animated }: { animated: boolean }) {
  const { width } = useWindowDimensions();
  const x = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(5200),
        Animated.timing(x, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
        Animated.timing(x, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [animated, x]);

  const band = Math.max(120, width * 0.34);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: '-30%',
        height: '160%',
        width: band,
        left: 0,
        transform: [
          { translateX: x.interpolate({ inputRange: [0, 1], outputRange: [-band * 1.4, width + band * 0.4] }) },
          { rotate: '16deg' },
        ],
      }}
    >
      <LinearGradient
        colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.11)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

/**
 * Premium animated backdrop for headers and heroes.
 *
 * `dark`  — emerald depth with drifting gold / mint / teal light, a periodic glint and fine rings.
 *           Sits behind white type; children draw on top of it.
 * `light` — the same drifting light in pale mint / champagne over a white wash, for white headers
 *           with dark type.
 *
 * Fills its parent (override with `style`). Motion is native-driven and switches off entirely when the
 * OS asks to reduce motion, leaving the static composition.
 */
export function PremiumAurora({
  tone = 'dark',
  style,
  rings = true,
  base = true,
  topFade,
}: {
  tone?: Tone;
  style?: StyleProp<ViewStyle>;
  /** Paint the tone's own base gradient. Pass false to lay just the drifting light over a parent's background. */
  base?: boolean;
  /** Fine concentric rings in the top-right (dark tone only). */
  rings?: boolean;
  /**
   * Melt the top edge into the strip above it: AURORA_DEEP_TOP for `dark` (default on), white for `light`
   * (default off — turn on when the header starts below a white status-bar strip).
   */
  topFade?: boolean;
}) {
  const reduced = useReducedMotion();
  const dark = tone === 'dark';
  const brand = tone === 'brand';
  const blobs = brand ? BRAND_BLOBS : dark ? DARK_BLOBS : LIGHT_BLOBS;

  return (
    <View style={[styles.fill, style]} pointerEvents="none">
      {!base ? null : brand ? (
        <LinearGradient
          colors={[AURORA_BRAND_TOP, '#0B7C38', '#086A2F']}
          locations={[0, 0.5, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : dark ? (
        <LinearGradient
          colors={[AURORA_DEEP_TOP, '#0A5A2B', '#0C7A39']}
          locations={[0, 0.5, 1]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <LinearGradient
          colors={['#FFFFFF', '#F3FAF5', '#EAF4EC']}
          locations={[0, 0.55, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}

      {blobs.map((b, i) => (
        <Blob key={i} spec={b} animated={!reduced} />
      ))}

      {dark && rings ? (
        <>
          <View style={styles.ring} />
          <View style={[styles.ring, styles.ring2]} />
        </>
      ) : null}

      {dark ? <Sheen animated={!reduced} /> : null}

      {/* Top edge melts into the status-bar strip so the header has no seam under the clock. */}
      {(topFade ?? dark) ? (
        <LinearGradient
          colors={dark ? [AURORA_DEEP_TOP, 'rgba(6,54,27,0)'] : ['#FFFFFF', 'rgba(255,255,255,0)']}
          style={dark ? styles.topFade : styles.topFadeLight}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFill, overflow: 'hidden' },
  ring: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    right: -70,
    top: -40,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  ring2: { width: 170, height: 170, right: -24, top: 6, borderColor: 'rgba(255,255,255,0.07)' },
  topFade: { position: 'absolute', top: 0, left: 0, right: 0, height: 70 },
  topFadeLight: { position: 'absolute', top: 0, left: 0, right: 0, height: 34 },
});
