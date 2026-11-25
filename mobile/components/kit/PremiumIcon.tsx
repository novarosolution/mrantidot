import { LinearGradient } from 'expo-linear-gradient';
import {
  Image,
  StyleSheet,
  View,
  type ColorValue,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { IconGradients } from '@/constants/appIcons';
import { colors, ui } from '@/constants/theme';

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

function hexToRgb(hex: string): [number, number, number] | null {
  if (!hex.startsWith('#')) return null;
  const h = hex.length === 4 ? hex.slice(1).split('').map((c) => c + c).join('') : hex.slice(1, 7);
  if (h.length !== 6) return null;
  const n = Number.parseInt(h, 16);
  return Number.isFinite(n) ? [(n >> 16) & 255, (n >> 8) & 255, n & 255] : null;
}

/** Mix a hex colour toward white — `amt` 0 = colour, 1 = white. */
function tint(hex: string, amt: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#F2F5F2';
  const mix = (c: number) => Math.round(c + (255 - c) * amt).toString(16).padStart(2, '0');
  return `#${mix(rgb[0])}${mix(rgb[1])}${mix(rgb[2])}`;
}

function luminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0.5;
  const [r, g, b] = rgb.map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Readable accent from a legacy gradient — the stop closest to a mid-dark tone. */
function accentFromGradient(stops: readonly string[]): string {
  return [...stops].sort((a, b) => Math.abs(luminance(a) - 0.15) - Math.abs(luminance(b) - 0.15))[0];
}

function isLightInk(color: ColorValue): boolean {
  return typeof color === 'string' && (color.toLowerCase() === '#ffffff' || color.toLowerCase() === '#fff' || color === 'white');
}

/** Flat tinted icon tile — the premium, Urban-style replacement for glossy gradient tiles. */
function FlatTile({
  Icon,
  px,
  accent,
  bg,
  box,
  style,
  onDark,
}: {
  Icon: LucideIcon;
  px: number;
  accent: string;
  bg?: string;
  box: number;
  style?: StyleProp<ViewStyle>;
  onDark?: boolean;
}) {
  const r = tileRadius(box);
  return (
    <View
      style={[
        styles.flatTile,
        { width: box, height: box, borderRadius: r, backgroundColor: onDark ? 'rgba(255,255,255,0.16)' : (bg ?? tint(accent, 0.88)) },
        style,
      ]}
    >
      <Glyph Icon={Icon} px={px} color={accent} stroke={opticalStroke(px, 'medium')} fill={onDark ? 'rgba(255,255,255,0.22)' : softFill(accent, '26')} />
    </View>
  );
}

/** Auto soft body fill for plain glyphs — richer silhouette at small sizes. */
function plainSoftFill(color: ColorValue, fill?: string): string | undefined {
  /** 'none' = crisp outline only (premium line icons). */
  if (fill === 'none') return 'transparent';
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

export function PremiumIcon({
  icon: Icon,
  image,
  variant = 'plain',
  size = 'md',
  color = colors.forest,
  strokeWidth,
  focused,
  bg,
  /** Accepted for older call sites — flat tiles use a single tint. */
  bgTo: _bgTo,
  gradient,
  boxSize,
  fill,
  style,
}: {
  icon?: LucideIcon;
  /** Generated mint-tile asset — preferred for content icons when set. */
  image?: ImageSourcePropType;
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

  /** Full generated mint tile — skip Lucide chrome when asset is present. */
  if (image && variant !== 'tab' && variant !== 'chevron') {
    const box =
      boxSize ??
      (variant === 'plain' ? px + 8 : variant === 'premium' ? 52 : variant === 'gradient' ? 48 : 50);
    const r = Math.round(box * 0.3);
    // The generated JPG tiles have mismatched white/mint backgrounds; a vector icon on one tint stays uniform.
    if (Icon) {
      return (
        <View style={[styles.mintTile, { width: box, height: box, borderRadius: r }, style]}>
          <Icon size={Math.round(box * 0.46)} color={colors.forest} strokeWidth={2} />
        </View>
      );
    }
    return (
      <View style={[{ width: box, height: box, borderRadius: r, overflow: 'hidden' }, style]}>
        <Image source={image} style={{ width: box, height: box }} resizeMode="cover" />
      </View>
    );
  }

  if (!Icon) return null;

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
        <Glyph Icon={Icon} px={px} color={color} stroke={opticalStroke(px, 'bold')} fill="transparent" />
      </View>
    );
  }

  if (variant === 'tab') {
    return (
      <View style={[styles.tabWrap, style]}>
        {focused ? (
          <View style={styles.tabActiveShell}>
            <LinearGradient
              colors={['#A8E04A', colors.greenBright, colors.forest]}
              style={styles.tabActive}
              start={{ x: 0.15, y: 0 }}
              end={{ x: 0.88, y: 1 }}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.28)', 'rgba(255,255,255,0.06)', 'rgba(0,0,0,0.08)']}
                locations={[0, 0.42, 1]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                pointerEvents="none"
              />
              <View style={styles.tabActiveRim} pointerEvents="none" />
              <Glyph
                Icon={Icon}
                px={px}
                color={colors.white}
                stroke={opticalStroke(px, 'bold')}
                fill="rgba(255,255,255,0.4)"
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
            colors={[colors.white, '#F7FCF4', '#EEF8E8']}
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
    const stops = gradient ?? (variant === 'premium' ? IconGradients.lime : IconGradients.forest);
    return <FlatTile Icon={Icon} px={px} accent={accentFromGradient(stops)} bg={bg} box={box} style={style} />;
  }

  // glass / soft / mint — flat tile in the glyph's own tint (translucent white on dark surfaces).
  const box = boxSize ?? 50;
  const accent = typeof color === 'string' ? color : colors.forest;
  return (
    <FlatTile
      Icon={Icon}
      px={px}
      accent={accent}
      bg={bg ?? (variant === 'mint' ? ui.brandSoft : undefined)}
      box={box}
      style={style}
      onDark={isLightInk(color)}
    />
  );
}

/** Docked tab icon — outline when idle, softly filled + heavier stroke when active. */
export function KitTabBarIcon({
  icon: Icon,
  color,
  focused,
}: {
  icon: LucideIcon;
  color: ColorValue;
  focused?: boolean;
}) {
  const tint = typeof color === 'string' ? color : colors.forest;
  return (
    <View style={[styles.tabWrap, focused && styles.tabWrapOn]}>
      <Icon
        size={22}
        color={tint}
        strokeWidth={focused ? 2.2 : 1.8}
        fill={focused ? softFill(tint, '2E') : 'transparent'}
        absoluteStrokeWidth={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mintTile: { alignItems: 'center', justifyContent: 'center', backgroundColor: ui.brandSoft },
  softShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '52%',
  },
  chevron: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: colors.white,
  },
  flatTile: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 30,
    borderRadius: 15,
  },
  /** Active tab is shown by its filled icon and tint — no capsule behind it. */
  tabWrapOn: {},
  tabActiveShell: {
    borderRadius: 13,
    shadowColor: colors.forest,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 9,
    elevation: 8,
  },
  tabActive: {
    width: 46,
    height: 34,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tabActiveRim: {
    ...StyleSheet.absoluteFill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: 13,
  },
  tabIdle: {
    width: 46,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringOuter: {
    padding: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.forest,
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
