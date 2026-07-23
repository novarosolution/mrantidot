import { useId } from 'react';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient as SvgLinear,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { Dimensions, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

const { width: W, height: H } = Dimensions.get('window');

/** Shared screen wash — keep in sync with `surfaces.glassScreenBase`. */
export const MESH_BASE = '#FAFCF8';
export const MESH_BASE_DEEP = '#F3F8EE';

type SphereTone = 'mint' | 'lime' | 'forest' | 'white' | 'deepLime';

const SPHERE: Record<SphereTone, { c0: string; c1: string; c2: string; c3: string; shadow: string }> = {
  mint: {
    c0: 'rgba(255,255,255,0.98)',
    c1: 'rgba(236,248,226,0.55)',
    c2: 'rgba(184,232,106,0.16)',
    c3: 'rgba(143,208,60,0)',
    shadow: 'rgba(10,100,35,0.06)',
  },
  lime: {
    c0: 'rgba(255,255,245,0.98)',
    c1: 'rgba(210,240,160,0.42)',
    c2: 'rgba(143,208,60,0.16)',
    c3: 'rgba(39,167,71,0)',
    shadow: 'rgba(10,100,35,0.07)',
  },
  forest: {
    c0: 'rgba(200,236,190,0.5)',
    c1: 'rgba(100,180,110,0.28)',
    c2: 'rgba(26,135,52,0.14)',
    c3: 'rgba(10,100,35,0)',
    shadow: 'rgba(2,24,12,0.1)',
  },
  white: {
    c0: 'rgba(255,255,255,0.98)',
    c1: 'rgba(255,255,255,0.55)',
    c2: 'rgba(244,248,241,0.16)',
    c3: 'rgba(255,255,255,0)',
    shadow: 'rgba(26,135,52,0.05)',
  },
  deepLime: {
    c0: 'rgba(240,255,210,0.65)',
    c1: 'rgba(168,224,74,0.32)',
    c2: 'rgba(39,167,71,0.14)',
    c3: 'rgba(10,100,35,0)',
    shadow: 'rgba(2,24,12,0.08)',
  },
};

/** Soft volumetric sphere — kept for optional accents; not used in screen mesh. */
export function VolumeSphere({
  size,
  tone = 'mint',
  style,
  opacity = 1,
  withShadow = true,
}: {
  size: number;
  tone?: SphereTone;
  style?: StyleProp<ViewStyle>;
  opacity?: number;
  withShadow?: boolean;
}) {
  const uid = useId().replace(/:/g, '');
  const id = `vs-${uid}`;
  const shadeId = `vss-${uid}`;
  const rimId = `vsr-${uid}`;
  const p = SPHERE[tone];
  const r = size / 2;
  const shadowH = size * 0.18;

  return (
    <View style={[{ width: size, height: size + (withShadow ? shadowH * 0.3 : 0), opacity }, style]} pointerEvents="none">
      <Svg width={size} height={size + (withShadow ? shadowH * 0.3 : 0)}>
        <Defs>
          <RadialGradient id={id} cx="34%" cy="30%" rx="66%" ry="66%" fx="28%" fy="24%">
            <Stop offset="0%" stopColor={p.c0} />
            <Stop offset="34%" stopColor={p.c1} />
            <Stop offset="70%" stopColor={p.c2} />
            <Stop offset="100%" stopColor={p.c3} />
          </RadialGradient>
          <RadialGradient id={shadeId} cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor={p.shadow} />
            <Stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </RadialGradient>
          <RadialGradient id={rimId} cx="72%" cy="74%" rx="56%" ry="56%">
            <Stop offset="60%" stopColor="rgba(0,0,0,0)" />
            <Stop offset="100%" stopColor="rgba(2,24,12,0.05)" />
          </RadialGradient>
        </Defs>
        {withShadow ? (
          <Ellipse cx={r} cy={size + shadowH * 0.03} rx={r * 0.52} ry={shadowH * 0.3} fill={`url(#${shadeId})`} />
        ) : null}
        <Circle cx={r} cy={r} r={r} fill={`url(#${id})`} />
        <Circle cx={r} cy={r} r={r} fill={`url(#${rimId})`} />
        <Ellipse cx={r * 0.56} cy={r * 0.46} rx={r * 0.28} ry={r * 0.15} fill="rgba(255,255,255,0.45)" />
      </Svg>
    </View>
  );
}

/**
 * Premium light-theme ambient background —
 * clean mint → white wash. No floating 3D orbs.
 */
export function PremiumMeshBg({
  variant = 'default',
}: {
  variant?: 'default' | 'deep' | 'auth' | 'hero';
}) {
  if (variant === 'auth' || variant === 'hero') {
    return <DarkMeshBg hero={variant === 'hero'} />;
  }

  return <LightPremiumWash deep={variant === 'deep'} />;
}

function LightPremiumWash({ deep }: { deep: boolean }) {
  const uid = useId().replace(/:/g, '');
  const base = deep ? MESH_BASE_DEEP : MESH_BASE;

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: base, overflow: 'hidden' }]} pointerEvents="none">
      <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgLinear id={`wash-${uid}`} x1="50%" y1="0%" x2="50%" y2="100%">
            <Stop offset="0%" stopColor={deep ? '#F0F7EA' : '#FFFFFF'} />
            <Stop offset="38%" stopColor={base} />
            <Stop offset="100%" stopColor="#FFFFFF" />
          </SvgLinear>
          <RadialGradient id={`cornerTR-${uid}`} cx="96%" cy="0%" rx="52%" ry="34%">
            <Stop offset="0%" stopColor="rgba(232,248,214,0.42)" />
            <Stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </RadialGradient>
          <RadialGradient id={`cornerTL-${uid}`} cx="4%" cy="6%" rx="44%" ry="28%">
            <Stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
            <Stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </RadialGradient>
          <RadialGradient id={`midGlow-${uid}`} cx="50%" cy="28%" rx="60%" ry="28%">
            <Stop offset="0%" stopColor="rgba(255,255,255,0.75)" />
            <Stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </RadialGradient>
          <RadialGradient id={`botGlow-${uid}`} cx="50%" cy="100%" rx="72%" ry="32%">
            <Stop offset="0%" stopColor="rgba(236,248,226,0.38)" />
            <Stop offset="100%" stopColor="rgba(236,248,226,0)" />
          </RadialGradient>
        </Defs>

        <Rect x={0} y={0} width={W} height={H} fill={`url(#wash-${uid})`} />
        <Rect x={0} y={0} width={W} height={H} fill={`url(#cornerTR-${uid})`} />
        <Rect x={0} y={0} width={W} height={H} fill={`url(#cornerTL-${uid})`} />
        <Rect x={0} y={0} width={W} height={H} fill={`url(#midGlow-${uid})`} />
        <Rect x={0} y={0} width={W} height={H} fill={`url(#botGlow-${uid})`} />
      </Svg>
    </View>
  );
}

/** Auth / dark hero wash — soft gradients only, no floating orbs. */
function DarkMeshBg({ hero }: { hero?: boolean }) {
  const uid = useId().replace(/:/g, '');
  const h = hero ? Math.min(H * 0.52, 440) : H;

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#02180C', overflow: 'hidden' }]} pointerEvents="none">
      <Svg width={W} height={h} style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgLinear id={`darkWash-${uid}`} x1="18%" y1="0%" x2="82%" y2="100%">
            <Stop offset="0%" stopColor="#1F9444" />
            <Stop offset="40%" stopColor="#0A6423" />
            <Stop offset="75%" stopColor="#043816" />
            <Stop offset="100%" stopColor="#02180C" />
          </SvgLinear>
          <RadialGradient id={`darkHot-${uid}`} cx="82%" cy="10%" rx="50%" ry="36%">
            <Stop offset="0%" stopColor="rgba(200,255,150,0.32)" />
            <Stop offset="100%" stopColor="rgba(143,208,60,0)" />
          </RadialGradient>
          <RadialGradient id={`darkSide-${uid}`} cx="8%" cy="68%" rx="46%" ry="36%">
            <Stop offset="0%" stopColor="rgba(48,184,79,0.2)" />
            <Stop offset="100%" stopColor="rgba(48,184,79,0)" />
          </RadialGradient>
          <RadialGradient id={`darkMid-${uid}`} cx="45%" cy="38%" rx="42%" ry="30%">
            <Stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
            <Stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </RadialGradient>
          <SvgLinear id={`darkFloor-${uid}`} x1="50%" y1="52%" x2="50%" y2="100%">
            <Stop offset="0%" stopColor="rgba(2,24,12,0)" />
            <Stop offset="100%" stopColor="rgba(2,24,12,0.5)" />
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
