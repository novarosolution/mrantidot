import { useId } from 'react';
import Svg, {
  Defs,
  LinearGradient as SvgLinear,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

/**
 * Soft mint screen wash — keep in sync with `colors.bg` / `surfaces.glassScreenBase`.
 * No 3D models. Cards stay white on top of this.
 */
export const MESH_BASE = '#F6FAF2';
export const MESH_BASE_DEEP = '#EEF6E8';

/**
 * Screen ambient background.
 * Light screens: brand mint — no mesh glows, no 3D orbs.
 * Auth / hero: dark forest gradient (no 3D models).
 */
export function PremiumMeshBg({
  variant = 'default',
}: {
  variant?: 'default' | 'deep' | 'auth' | 'hero';
}) {
  if (variant === 'auth' || variant === 'hero') {
    return <DarkMeshBg hero={variant === 'hero'} />;
  }

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: variant === 'deep' ? MESH_BASE_DEEP : MESH_BASE },
      ]}
      pointerEvents="none"
    />
  );
}

/** Auth / dark hero wash — forest gradient only, no 3D orbs. */
function DarkMeshBg({ hero }: { hero?: boolean }) {
  const uid = useId().replace(/:/g, '');
  const { width: W, height: H } = useWindowDimensions();
  const h = hero ? Math.min(H * 0.52, 440) : H;

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#02180C', overflow: 'hidden' }]} pointerEvents="none">
      <Svg width={W} height={h} style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgLinear id={`darkWash-${uid}`} x1="18%" y1="0%" x2="82%" y2="100%">
            <Stop offset="0%" stopColor="#27A747" />
            <Stop offset="28%" stopColor="#1B873E" />
            <Stop offset="55%" stopColor="#0A6423" />
            <Stop offset="82%" stopColor="#043816" />
            <Stop offset="100%" stopColor="#02180C" />
          </SvgLinear>
          <RadialGradient id={`darkHot-${uid}`} cx="86%" cy="6%" rx="52%" ry="40%">
            <Stop offset="0%" stopColor="rgba(220,255,150,0.42)" />
            <Stop offset="100%" stopColor="rgba(143,208,60,0)" />
          </RadialGradient>
          <RadialGradient id={`darkSide-${uid}`} cx="6%" cy="72%" rx="50%" ry="40%">
            <Stop offset="0%" stopColor="rgba(48,184,79,0.28)" />
            <Stop offset="100%" stopColor="rgba(48,184,79,0)" />
          </RadialGradient>
          <RadialGradient id={`darkMid-${uid}`} cx="45%" cy="38%" rx="44%" ry="32%">
            <Stop offset="0%" stopColor="rgba(255,255,255,0.14)" />
            <Stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </RadialGradient>
          <SvgLinear id={`darkFloor-${uid}`} x1="50%" y1="48%" x2="50%" y2="100%">
            <Stop offset="0%" stopColor="rgba(2,24,12,0)" />
            <Stop offset="100%" stopColor="rgba(2,24,12,0.58)" />
          </SvgLinear>
        </Defs>
        <Rect x={0} y={0} width={W} height={h} fill={`url(#darkWash-${uid})`} />
        <Rect x={0} y={0} width={W} height={h} fill={`url(#darkHot-${uid})`} />
        <Rect x={0} y={0} width={W} height={h} fill={`url(#darkSide-${uid})`} />
        <Rect x={0} y={0} width={W} height={h} fill={`url(#darkMid-${uid})`} />
        <Rect x={0} y={0} width={W} height={h} fill={`url(#darkFloor-${uid})`} />
      </Svg>
    </View>
  );
}
