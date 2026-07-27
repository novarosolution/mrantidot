import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type ColorValue, type StyleProp, type ViewStyle } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { IconGradients } from '@/constants/appIcons';
import { colors } from '@/constants/theme';

export const IconSize = {
  xs: 14,
  sm: 16,
  md: 18,
  lg: 20,
  xl: 22,
  tab: 22,
  hero: 28,
} as const;

export const IconStroke = {
  light: 1.65,
  regular: 1.9,
  medium: 2.1,
  bold: 2.35,
  tab: 2.05,
  tabActive: 2.35,
} as const;

type IconSizeKey = keyof typeof IconSize;
type IconWeight = 'light' | 'regular' | 'medium' | 'bold';
type IconVariant =
  | 'plain'
  | 'soft'
  | 'mint'
  | 'glass'
  | 'gradient'
  | 'premium'
  | 'tab'
  | 'chevron'
  | 'ring';

function resolveSize(size: IconSizeKey | number): number {
  return typeof size === 'number' ? size : IconSize[size];
}

/** Optical stroke — keeps glyphs crisp and readable from 12–36px. */
export function opticalStroke(px: number, weight: IconWeight = 'regular'): number {
  const mult = { light: 0.92, regular: 1.05, medium: 1.18, bold: 1.32 }[weight];
  const raw = Math.max(1.65, Math.min(2.85, px * 0.112 * mult));
  return Math.round(raw * 20) / 20;
}

function tileRadius(box: number): number {
  return Math.round(box * 0.34);
}

function softFill(color: ColorValue, alphaHex = '4A'): string {
  if (typeof color !== 'string' || !color.startsWith('#')) return 'transparent';
  if (color.length === 9) return color;
  if (color.length === 4) {
    const r = color[1];
    const g = color[2];
    const b = color[3];
    return `#${r}${r}${g}${g}${b}${b}${alphaHex}`;
  }
  if (color.length === 7) return `${color}${alphaHex}`;
  return 'transparent';
}

/** Auto soft body fill for plain glyphs — richer silhouette at small sizes. */
function plainSoftFill(color: ColorValue, fill?: string): string | undefined {
  if (fill && fill !== 'transparent') return fill;
  if (typeof color !== 'string') return undefined;
  const c = color.toLowerCase();
  if (c === '#ffffff' || c === '#fff') return 'rgba(255,255,255,0.34)';
  if (color.startsWith('#') && color.length === 7) return `${color}55`;
  return undefined;
}

function Glyph({
  Icon,
  px,
  color,
  stroke,
  fill,
}: {
  Icon: LucideIcon;
  px: number;
  color: ColorValue;
  stroke: number;
  fill?: string;
}) {
  const tint = typeof color === 'string' ? color : colors.forest;
  return (
    <Icon
      size={px}
      color={tint}
      strokeWidth={stroke}
      fill={fill ?? 'transparent'}
      absoluteStrokeWidth={false}
    />
  );
}

function TileShine() {
  return (
    <LinearGradient
      colors={['rgba(255,255,255,0.72)', 'rgba(255,255,255,0.18)', 'rgba(255,255,255,0)']}
      locations={[0, 0.45, 1]}
      style={styles.softShine}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      pointerEvents="none"
    />
  );
}

function TileRim({ light = true }: { light?: boolean }) {
  return (
    <View
      style={[styles.tileRim, { borderColor: light ? 'rgba(255,255,255,0.5)' : 'rgba(11,114,40,0.1)' }]}
      pointerEvents="none"
    />
  );
}

export function PremiumIcon({
  icon: Icon,
  variant = 'plain',
  size = 'md',
  color = colors.forest,
  strokeWidth,
  focused,
  bg,
  bgTo,
  gradient,
  boxSize,
  fill,
  style,
}: {
  icon: LucideIcon;
  variant?: IconVariant;
  size?: IconSizeKey | number;
  color?: ColorValue;
  strokeWidth?: number;
  focused?: boolean;
  bg?: string;
  bgTo?: string;
  gradient?: readonly [string, string] | readonly [string, string, string];
  boxSize?: number;
  fill?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const px = resolveSize(size);
  const weight: IconWeight =
    strokeWidth != null
      ? 'regular'
      : variant === 'tab'
        ? focused
          ? 'bold'
          : 'medium'
        : variant === 'gradient' || variant === 'premium'
          ? 'bold'
          : variant === 'mint' || variant === 'soft' || variant === 'glass' || variant === 'ring'
            ? 'medium'
            : 'regular';
  const stroke = strokeWidth ?? opticalStroke(px, weight);

  if (variant === 'plain') {
    const glyph = (
      <Glyph Icon={Icon} px={px} color={color} stroke={stroke} fill={plainSoftFill(color, fill)} />
    );
    if (style) {
      return <View style={style}>{glyph}</View>;
    }
    return glyph;
  }

  if (variant === 'chevron') {
    return (
      <View style={[styles.chevron, style]}>
        <LinearGradient
          colors={['#FFFFFF', '#F2FAEE', '#EAF6E3']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <TileShine />
        <Glyph Icon={Icon} px={px} color={color} stroke={opticalStroke(px, 'bold')} fill={softFill(color, '4A')} />
      </View>
    );
  }

  if (variant === 'tab') {
    return (
      <View style={[styles.tabWrap, style]}>
        {focused ? (
          <View style={styles.tabActiveShell}>
            <LinearGradient
              colors={['#8FD03C', '#30B84F', '#0A6423']}
              style={styles.tabActive}
              start={{ x: 0.12, y: 0 }}
              end={{ x: 0.9, y: 1 }}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.42)', 'rgba(255,255,255,0.08)', 'rgba(0,0,0,0.08)']}
                locations={[0, 0.45, 1]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                pointerEvents="none"
              />
              <View style={styles.tabActiveRim} pointerEvents="none" />
              <Glyph
                Icon={Icon}
                px={px}
                color="#FFFFFF"
                stroke={opticalStroke(px, 'bold')}
                fill="rgba(255,255,255,0.38)"
              />
            </LinearGradient>
          </View>
        ) : (
          <View style={styles.tabIdle}>
            <Glyph
              Icon={Icon}
              px={px}
              color={color}
              stroke={opticalStroke(px, 'bold')}
              fill={plainSoftFill(color)}
            />
          </View>
        )}
      </View>
    );
  }

  if (variant === 'ring') {
    const box = boxSize ?? 56;
    const r = tileRadius(box);
    return (
      <LinearGradient
        colors={[...IconGradients.ring]}
        style={[styles.ringOuter, { width: box, height: box, borderRadius: r }, style]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={[styles.ringInner, { borderRadius: Math.max(8, r - 3) }]}>
          <LinearGradient
            colors={['#FFFFFF', '#F7FCF4', '#EEF8E8']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <TileShine />
          <Glyph
            Icon={Icon}
            px={px}
            color={colors.forest}
            stroke={opticalStroke(px, 'medium')}
            fill="rgba(27,135,62,0.14)"
          />
        </View>
      </LinearGradient>
    );
  }

  if (variant === 'gradient' || variant === 'premium') {
    const box = boxSize ?? (variant === 'premium' ? 52 : 48);
    const r = tileRadius(box);
    const colorsPair = gradient ?? (variant === 'premium' ? IconGradients.lime : IconGradients.forest);
    return (
      <View style={[styles.gradShell, { width: box, height: box, borderRadius: r }, style]}>
        <LinearGradient
          colors={[...colorsPair]}
          style={[styles.gradBox, { borderRadius: r }]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.92, y: 1 }}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.42)', 'rgba(255,255,255,0.08)', 'rgba(0,0,0,0.1)']}
            locations={[0, 0.42, 1]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            pointerEvents="none"
          />
          <View style={styles.gradHighlight} pointerEvents="none" />
          <View style={styles.gradRim} pointerEvents="none" />
          <Glyph
            Icon={Icon}
            px={px}
            color="#FFFFFF"
            stroke={opticalStroke(px, 'bold')}
            fill="rgba(255,255,255,0.28)"
          />
        </LinearGradient>
      </View>
    );
  }

  if (variant === 'glass') {
    const box = boxSize ?? 50;
    const r = tileRadius(box);
    return (
      <View style={[styles.glassBox, { width: box, height: box, borderRadius: r }, style]}>
        <LinearGradient
          colors={['rgba(255,255,255,0.98)', 'rgba(240,250,234,0.92)', 'rgba(200,240,122,0.55)']}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <LinearGradient
          colors={['rgba(255,255,255,0.7)', 'rgba(255,255,255,0)', 'rgba(10,100,35,0.06)']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          pointerEvents="none"
        />
        <TileShine />
        <TileRim />
        <Glyph
          Icon={Icon}
          px={px}
          color={color}
          stroke={opticalStroke(px, 'medium')}
          fill={softFill(color, '4A')}
        />
      </View>
    );
  }

  const box = boxSize ?? 50;
  const r = tileRadius(box);
  const softFrom = bg ?? (variant === 'mint' ? '#EAF6E3' : '#FFFFFF');
  const softTo = bgTo ?? (variant === 'mint' ? '#CDEAC4' : '#F2FAEE');

  return (
    <View style={[styles.softShell, { width: box, height: box, borderRadius: r }, style]}>
      <LinearGradient
        colors={[softFrom, softTo]}
        style={[
          styles.softBox,
          {
            borderRadius: r,
            borderColor: variant === 'mint' ? 'rgba(143,208,60,0.35)' : 'rgba(198,236,180,0.9)',
          },
        ]}
        start={{ x: 0.08, y: 0 }}
        end={{ x: 0.95, y: 1 }}
      >
        <TileShine />
        <TileRim />
        <Glyph
          Icon={Icon}
          px={px}
          color={color}
          stroke={opticalStroke(px, 'medium')}
          fill={softFill(color, '4A')}
        />
      </LinearGradient>
    </View>
  );
}

export function KitTabBarIcon({
  icon,
  color,
  focused,
}: {
  icon: LucideIcon;
  color: ColorValue;
  focused?: boolean;
}) {
  return (
    <PremiumIcon
      icon={icon}
      variant="tab"
      size={focused ? 21 : 20}
      color={focused ? '#FFFFFF' : color}
      focused={focused}
    />
  );
}

const styles = StyleSheet.create({
  softShell: {
    shadowColor: '#06180B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 5,
  },
  softBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
  softShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '52%',
  },
  tileRim: {
    ...StyleSheet.absoluteFill,
    borderWidth: 1,
  },
  glassBox: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(180,220,165,0.95)',
    shadowColor: '#06180B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 6,
  },
  gradShell: {
    shadowColor: '#043813',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.38,
    shadowRadius: 16,
    elevation: 10,
  },
  gradBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  gradHighlight: {
    position: 'absolute',
    top: 3,
    left: '18%',
    right: '18%',
    height: '28%',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  gradRim: {
    ...StyleSheet.absoluteFill,
    borderWidth: 1.2,
    borderColor: 'rgba(255,255,255,0.42)',
  },
  chevron: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(180,220,165,0.98)',
    shadowColor: '#06180B',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  tabWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
  },
  tabActiveShell: {
    borderRadius: 16,
    shadowColor: '#0A6423',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.36,
    shadowRadius: 14,
    elevation: 10,
  },
  tabActive: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tabActiveRim: {
    ...StyleSheet.absoluteFill,
    borderWidth: 1.2,
    borderColor: 'rgba(255,255,255,0.42)',
    borderRadius: 16,
  },
  tabIdle: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(234,246,227,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(143,208,60,0.35)',
  },
  ringOuter: {
    padding: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0B7228',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  ringInner: {
    flex: 1,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
