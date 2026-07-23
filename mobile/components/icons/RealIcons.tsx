import { memo, type ReactNode } from 'react';
import Svg, { Circle, Ellipse, G, Path, Rect, type SvgProps } from 'react-native-svg';
import type { LucideIcon } from 'lucide-react-native';

/** Lucide-compatible props so custom icons work inside PremiumIcon. */
export type RealIconProps = {
  size?: number | string;
  color?: string;
  strokeWidth?: number | string;
  fill?: string;
  absoluteStrokeWidth?: boolean;
} & Omit<SvgProps, 'width' | 'height' | 'color' | 'fill'>;

function toNum(v: number | string | undefined, fallback: number): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = Number.parseFloat(v);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

function softBody(color: string, fill: string): string {
  if (fill && fill !== 'transparent') return fill;
  /** Stronger soft fill so silhouettes stay readable on light + dark. */
  if (color.startsWith('#') && color.length === 7) return `${color}5C`;
  if (color.startsWith('#') && color.length === 9) return color;
  if (color.startsWith('rgb')) return color;
  return 'transparent';
}

function softStrong(color: string, fill: string): string {
  if (fill && fill !== 'transparent') return fill;
  if (color.startsWith('#') && color.length === 7) return `${color}7A`;
  return softBody(color, fill);
}

function createRealIcon(
  name: string,
  draw: (p: { color: string; stroke: number; fill: string; soft: string; strong: string }) => ReactNode,
): LucideIcon {
  const Icon = memo(function RealIcon({
    size = 24,
    color = '#0B7228',
    strokeWidth = 2,
    fill = 'transparent',
    absoluteStrokeWidth: _abs,
    ...rest
  }: RealIconProps) {
    const px = toNum(size, 24);
    /** Clamp stroke so silhouettes stay crisp from 14–36px. */
    const stroke = Math.max(1.4, Math.min(2.7, toNum(strokeWidth, 2) * (px < 18 ? 1.08 : 1)));
    const tint = String(color);
    const fillColor = fill && fill !== 'transparent' ? fill : 'transparent';
    return (
      <Svg width={px} height={px} viewBox="0 0 24 24" fill="none" accessibilityLabel={name} {...rest}>
        {draw({
          color: tint,
          stroke,
          fill: fillColor,
          soft: softBody(tint, fillColor),
          strong: softStrong(tint, fillColor),
        })}
      </Svg>
    );
  });
  Icon.displayName = name;
  return Icon as unknown as LucideIcon;
}

/* ─── Pest silhouettes ─────────────────────────────────────────────── */

export const CockroachIcon = createRealIcon('Cockroach', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Ellipse cx="12" cy="14.4" rx="4.8" ry="6.6" fill={strong} />
    <Ellipse cx="12" cy="8.4" rx="3.4" ry="2.6" fill={soft} />
    <Path d="M10.4 6.4C9.8 4.4 8.8 3 7.4 2" />
    <Path d="M13.6 6.4C14.2 4.4 15.2 3 16.6 2" />
    <Path d="M8 10.2 3.8 7.8" />
    <Path d="M7.5 13.6 3.2 13.9" />
    <Path d="M8.1 17.2 4.2 19.6" />
    <Path d="M16 10.2 20.2 7.8" />
    <Path d="M16.5 13.6 20.8 13.9" />
    <Path d="M15.9 17.2 19.8 19.6" />
    <Path d="M9.8 11.4h4.4M9.6 14.4h4.8M10 17.2h4" opacity={0.45} />
    <Path d="M12 6.8v1.8" opacity={0.4} />
    <Circle cx="10.6" cy="8" r="0.35" fill={color} stroke="none" />
    <Circle cx="13.4" cy="8" r="0.35" fill={color} stroke="none" />
  </G>
));

export const MosquitoIcon = createRealIcon('Mosquito', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Ellipse cx="12" cy="13.6" rx="1.7" ry="5.2" fill={strong} />
    <Path d="M12 8.2V2.8" />
    <Path d="M12 8.8C8.8 7 6.2 8.2 5.2 10.6c1.6.4 3.2 1.2 4.2 2.4" />
    <Path d="M12 8.8C15.2 7 17.8 8.2 18.8 10.6c-1.6.4-3.2 1.2-4.2 2.4" />
    <Path d="M10.3 11.2 5.8 8.2" />
    <Path d="M10.1 14.4 5 15.4" />
    <Path d="M10.3 17.4 6.6 20.6" />
    <Path d="M13.7 11.2 18.2 8.2" />
    <Path d="M13.9 14.4 19 15.4" />
    <Path d="M13.7 17.4 17.4 20.6" />
    <Circle cx="12" cy="7.8" r="1.35" fill={soft} />
    <Circle cx="12" cy="7.7" r="0.4" fill={color} stroke="none" />
  </G>
));

export const AntIcon = createRealIcon('Ant', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="6.2" cy="12" r="2.7" fill={strong} />
    <Ellipse cx="11.5" cy="12" rx="2.2" ry="2.7" fill={soft} />
    <Ellipse cx="17.8" cy="12" rx="3.1" ry="3.5" fill={strong} />
    <Path d="M4.2 9.6 2.2 7" />
    <Path d="M4.2 14.4 2.2 17" />
    <Path d="M11.5 9.2V6.6" />
    <Path d="M9.6 14.4 7.4 17.6" />
    <Path d="M13.4 14.4 15.6 17.6" />
    <Path d="M16.8 8.8 18.8 6" />
    <Path d="M16.8 15.2 18.8 18" />
    <Path d="M8.9 12h1.4M13.7 12h1.6" opacity={0.35} />
    <Circle cx="5.2" cy="11.1" r="0.4" fill={color} stroke="none" />
  </G>
));

export const SpiderIcon = createRealIcon('Spider', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="10.6" r="2.85" fill={soft} />
    <Ellipse cx="12" cy="16.2" rx="3.7" ry="3.2" fill={strong} />
    <Path d="M9.5 9.4 4.6 5.8" />
    <Path d="M9 11.6 3.8 10.6" />
    <Path d="M9.2 14.2 4.4 16.8" />
    <Path d="M9.8 17 6.2 20.4" />
    <Path d="M14.5 9.4 19.4 5.8" />
    <Path d="M15 11.6 20.2 10.6" />
    <Path d="M14.8 14.2 19.6 16.8" />
    <Path d="M14.2 17 17.8 20.4" />
    <Path d="M10.8 9.8h.2M13 9.8h.2" strokeWidth={stroke * 1.6} />
  </G>
));

export const TermiteIcon = createRealIcon('Termite', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Ellipse cx="12" cy="13.8" rx="3.9" ry="6.2" fill={strong} />
    <Circle cx="12" cy="7" r="2.5" fill={soft} />
    <Path d="M10.2 5.2 8.2 3" />
    <Path d="M13.8 5.2 15.8 3" />
    <Path d="M8.4 10.8 5 8.8" />
    <Path d="M8.3 14.2 4.8 15.2" />
    <Path d="M8.8 17.8 6 20" />
    <Path d="M15.6 10.8 19 8.8" />
    <Path d="M15.7 14.2 19.2 15.2" />
    <Path d="M15.2 17.8 18 20" />
    <Path d="M10.2 12.2h3.6M10 15.2h4" opacity={0.4} />
  </G>
));

export const WoodBorerIcon = createRealIcon('WoodBorer', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Ellipse cx="11" cy="13.4" rx="5.2" ry="4" fill={strong} />
    <Ellipse cx="16.8" cy="12.4" rx="2.4" ry="2.2" fill={soft} />
    <Path d="M19 12.2h3.4" />
    <Path d="M17.8 10.6 19.4 8.4" />
    <Path d="M17.8 14.4 19.6 16.4" />
    <Path d="M7.8 10.4 5 8" />
    <Path d="M7.2 13.4 3.8 13.8" />
    <Path d="M8 16.2 5.2 18.6" />
    <Path d="M8.8 11.2h4.6M8.6 14.2h5" opacity={0.45} />
    <Circle cx="17.4" cy="11.8" r="0.35" fill={color} stroke="none" />
  </G>
));

export const BedBugIcon = createRealIcon('BedBug', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Ellipse cx="12" cy="13.6" rx="5.8" ry="6.4" fill={strong} />
    <Ellipse cx="12" cy="6.8" rx="2.3" ry="1.9" fill={soft} />
    <Path d="M10.4 5.4 8.6 3.2" />
    <Path d="M13.6 5.4 15.4 3.2" />
    <Path d="M6.8 10.2 3.8 8.4" />
    <Path d="M6.4 13.8 3.4 14.2" />
    <Path d="M7 17.2 4.2 19.4" />
    <Path d="M17.2 10.2 20.2 8.4" />
    <Path d="M17.6 13.8 20.6 14.2" />
    <Path d="M17 17.2 19.8 19.4" />
    <Path d="M9.4 11.4h5.2M9 14.6h6" opacity={0.4} />
  </G>
));

export const FleaIcon = createRealIcon('Flea', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Ellipse cx="11" cy="13.4" rx="5" ry="3.7" fill={strong} />
    <Circle cx="16.8" cy="11" r="2.15" fill={soft} />
    <Path d="M18.4 9.6 20.4 7.2" />
    <Path d="M7.4 11.4 3.8 8.8" />
    <Path d="M7.2 14.6 3.6 17.2" />
    <Path d="M11.8 16.8 10.2 20.6" />
    <Path d="M14.6 16.2 17.6 20.4" />
    <Path d="M9 12.2h3.8" opacity={0.4} />
    <Circle cx="17.4" cy="10.6" r="0.35" fill={color} stroke="none" />
  </G>
));

export const BeeIcon = createRealIcon('Bee', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Ellipse cx="8.6" cy="9.2" rx="2.8" ry="1.5" fill={soft} />
    <Ellipse cx="14.8" cy="9.2" rx="2.8" ry="1.5" fill={soft} />
    <Ellipse cx="11.2" cy="13.6" rx="5.2" ry="3.9" fill={strong} />
    <Circle cx="17.8" cy="12.4" r="2.05" fill={soft} />
    <Path d="M19.4 11 21.2 9" />
    <Path d="M19.4 14 21.4 15.6" />
    <Path d="M8 12.6h6.4M8.2 14.8h6M8.4 16.8h5.6" />
    <Path d="M6.4 15.4 3.8 18.4" />
    <Circle cx="18.3" cy="11.9" r="0.35" fill={color} stroke="none" />
  </G>
));

export const LizardIcon = createRealIcon('Lizard', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Path
      d="M3.2 15.2c2.8-2.2 5.4-3.2 8-2.6 2 .4 3.6.1 5.4-1 1.6-1 3-.1 5.2.4l.4 2.2c-2.2-.2-3.8.4-5.4 1.4-1.8 1.1-3.6 1.4-5.6 1-2.4-.4-4.8.2-7.2 2.2z"
      fill={strong}
    />
    <Path d="M8.6 13.8 6 18.6" />
    <Path d="M11.6 13 10.4 18.8" />
    <Path d="M14.8 12.2 16.6 17.6" />
    <Path d="M7.6 12.8 5.4 9.2" />
    <Circle cx="20.6" cy="12" r="1.85" fill={soft} />
    <Circle cx="21.1" cy="11.5" r="0.35" fill={color} stroke="none" />
    <Path d="M21.8 12.6c1.2.6 2 1.8 2.2 3.2" />
  </G>
));

export const RodentIcon = createRealIcon('Rodent', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Ellipse cx="10.6" cy="13.8" rx="6" ry="4.8" fill={strong} />
    <Circle cx="17" cy="11.2" r="2.8" fill={soft} />
    <Circle cx="7.2" cy="8.6" r="2.25" fill={soft} />
    <Circle cx="13.4" cy="8.2" r="2.25" fill={soft} />
    <Path d="M19.4 12.6c1.7 1 3.2 3 3.3 5.1" />
    <Circle cx="17.9" cy="10.7" r="0.4" fill={color} stroke="none" />
    <Path d="M19.2 12.1h1" />
    <Path d="M6.8 15.6 4.2 18.4" />
    <Path d="M11 18.4v2.4" />
  </G>
));

export const BirdIcon = createRealIcon('Bird', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Path
      d="M3.6 15.4c3.4-2 6.2-2.4 8.8-.6 1.6 1.1 3.2 1.2 5.2.4l1.2 2.2c-2.4 1-4.4.8-6.4-.4-2.2-1.4-4.6-1.2-7.2.4z"
      fill={strong}
    />
    <Path d="M12.2 14.6c.4-3 2-5.4 4.6-6.4" fill={soft} />
    <Path d="M17.2 14.6c1.8-.2 3.4.4 4.8 1.8L23.2 13" />
    <Path d="M9.2 15.8 7.4 19.8" />
    <Path d="M12.8 16.2 13.8 20" />
    <Circle cx="17.8" cy="12.8" r="1.9" fill={soft} />
    <Circle cx="18.3" cy="12.3" r="0.35" fill={color} stroke="none" />
  </G>
));

export const SnailIcon = createRealIcon('Snail', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="10" cy="12" r="5" fill={strong} />
    <Path d="M10 12c1.7 0 3.1 1.4 3.1 3.1" />
    <Path d="M10 12c0-1.9 1.5-3.3 3.3-3.3" />
    <Path d="M13 12.8c1.2 0 2.1 1 2.1 2.1" opacity={0.5} />
    <Path
      d="M14.8 16.4c2.5.2 4.8-.3 6.6-2 .5 1.9.2 3.4-.9 4.6H6.4c-1.4-1.2-1.6-3-.6-4.4 1.2 1 2.8 1.5 4.6 1.5z"
      fill={soft}
    />
    <Path d="M19.4 13.6 21.2 10.6" />
    <Path d="M17.8 13.4 18.8 10.4" />
  </G>
));

/* ─── Service / brand tools ────────────────────────────────────────── */

export const SprayIcon = createRealIcon('Spray', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Path
      d="M8 9h7v10.8c0 1-.8 1.7-1.7 1.7H9.7c-1 0-1.7-.7-1.7-1.7V9z"
      fill={strong}
    />
    <Path d="M10 9V7.2c0-.9.6-1.5 1.4-1.5h.4c.8 0 1.4.6 1.4 1.5V9" />
    <Path d="M12.1 5.7V3.6" />
    <Path d="M14.6 5.2c1.5-.8 3.1-1 4.6-.6" />
    <Path d="M15 7.2c1.3-.3 2.6-.2 3.9.4" />
    <Path d="M15.2 9c.9.1 1.8.3 2.6.8" opacity={0.5} />
    <Path d="M9.6 12.4h3.8M9.6 15.2h3.8M9.6 18h2.8" opacity={0.45} />
    <Rect x="9.2" y="9.8" width="4.6" height="1.2" rx="0.4" fill={soft} stroke="none" opacity={0.5} />
  </G>
));

export const FumigationIcon = createRealIcon('Fumigation', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Path
      d="M7.8 17.2c-2.4 0-4.3-1.8-4.3-4.1 0-1.6 1-3 2.4-3.6.2-2.6 2.4-4.6 5-4.6 1.6 0 3.1.7 4 1.9.7-.5 1.6-.7 2.6-.7 2.4 0 4.3 1.8 4.3 4.1 0 .4 0 .7-.1 1.1 1.5.5 2.5 1.8 2.5 3.4 0 2-1.7 3.5-3.7 3.5H7.8z"
      fill={strong}
    />
    <Path d="M9 10.4c.8-1.2 2-2 3.4-2" opacity={0.45} />
    <Circle cx="10.8" cy="13.6" r="0.75" fill={color} stroke="none" opacity={0.35} />
    <Circle cx="14.6" cy="14.4" r="0.55" fill={color} stroke="none" opacity={0.28} />
    <Circle cx="12.6" cy="11.8" r="0.45" fill={soft} stroke="none" />
  </G>
));

export const CleanIcon = createRealIcon('Clean', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="4.4" fill={strong} />
    <Path d="M12 2.2v2.8M12 19v2.8M2.2 12h2.8M19 12h2.8" />
    <Path d="M5.2 5.2l2 2M16.8 16.8l2 2M18.8 5.2l-2 2M7.2 16.8l-2 2" />
    <Circle cx="12" cy="12" r="1.6" fill={soft} stroke="none" />
  </G>
));

export const HomeRealIcon = createRealIcon('Home', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3.8 11.2 12 3.8l8.2 7.4" />
    <Path d="M5.8 10.4V19.6h12.4V10.4" fill={strong} />
    <Path d="M9.8 19.6v-5.8h4.4v5.8" fill={soft} />
  </G>
));

export const ShieldRealIcon = createRealIcon('Shield', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Path
      d="M12 2.8 4.8 5.8v5.6c0 4.6 3.2 8 7.2 9.6 4-1.6 7.2-5 7.2-9.6V5.8L12 2.8z"
      fill={strong}
    />
    <Path d="M9 12.2 11.2 14.6 15.4 9.8" />
  </G>
));

export const InspectIcon = createRealIcon('Inspect', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="10.6" cy="10.6" r="6" fill={strong} />
    <Path d="M15.2 15.2 20.6 20.6" />
    <Path d="M7.6 10.6h6M10.6 7.6v6" opacity={0.6} />
  </G>
));

export const BuildingRealIcon = createRealIcon('Building', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M5 20.4V5.8h14v14.6" fill={strong} />
    <Path d="M5 20.4h14" />
    <Path d="M8.4 8.8h2M13.6 8.8h2M8.4 12.4h2M13.6 12.4h2M8.4 16h2M13.6 16h2" />
    <Path d="M10.2 20.4v-3.6h3.6v3.6" fill={soft} />
  </G>
));

export const WarehouseRealIcon = createRealIcon('Warehouse', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3.2 10.6 12 3.8l8.8 6.8V20.4H3.2V10.6z" fill={strong} />
    <Path d="M7.6 20.4v-6.2h8.8v6.2" fill={soft} />
    <Path d="M3.2 10.6h17.6" />
  </G>
));

export const ClipboardRealIcon = createRealIcon('Clipboard', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M7.6 4.8h8.8v15.2H7.6z" fill={strong} />
    <Path d="M9.4 3.2h5.2v3H9.4z" fill={soft} />
    <Path d="M9.8 10.4h4.4M9.8 13.6h4.4M9.8 16.8h2.8" />
  </G>
));

/** Ticket / offers. */
export const OfferRealIcon = createRealIcon('Offer', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Path
      d="M3.6 8.4c0-.9.7-1.6 1.6-1.6h13.6c.9 0 1.6.7 1.6 1.6v2.2a1.8 1.8 0 0 0 0 3.6v2.2c0 .9-.7 1.6-1.6 1.6H5.2c-.9 0-1.6-.7-1.6-1.6v-2.2a1.8 1.8 0 0 0 0-3.6V8.4z"
      fill={strong}
    />
    <Path d="M14.2 8.2v1.6M14.2 14.2v1.6" opacity={0.45} />
    <Circle cx="9.2" cy="12" r="1.6" fill={soft} />
    <Path d="M11.4 9.6 16.2 14.4" />
  </G>
));

/** Calendar with day mark. */
export const CalendarRealIcon = createRealIcon('Calendar', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M4.4 7.2h15.2v12.4c0 .9-.7 1.6-1.6 1.6H6c-.9 0-1.6-.7-1.6-1.6V7.2z" fill={strong} />
    <Path d="M4.4 7.2h15.2V10H4.4z" fill={soft} />
    <Path d="M8 4.8v3.2M16 4.8v3.2" />
    <Path d="M8.4 13.4h2M11.9 13.4h2M15.4 13.4h2M8.4 16.6h2M11.9 16.6h2" />
  </G>
));

/** Support / lifebuoy. */
export const SupportRealIcon = createRealIcon('Support', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="8.2" fill={soft} />
    <Circle cx="12" cy="12" r="3.4" fill={strong} />
    <Path d="M12 3.8v2.4M12 17.8v2.4M3.8 12h2.4M17.8 12h2.4" />
    <Path d="M6.4 6.4l1.7 1.7M15.9 15.9l1.7 1.7M17.6 6.4l-1.7 1.7M8.1 15.9l-1.7 1.7" />
  </G>
));

/** Leaf / eco. */
export const LeafRealIcon = createRealIcon('Leaf', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Path
      d="M5.2 18.4C5.2 10.8 10.4 4.4 19.2 4.4c0 8.8-6.4 14-14 14z"
      fill={strong}
    />
    <Path d="M5.2 18.4 12.6 11" />
    <Path d="M10.4 14.2c1.6-1.2 3.4-2 5.4-2.4" opacity={0.5} />
  </G>
));

/** User silhouette. */
export const UserRealIcon = createRealIcon('User', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="8" r="3.6" fill={soft} />
    <Path d="M5 19.4c.8-3.8 3.4-5.8 7-5.8s6.2 2 7 5.8" fill={strong} />
  </G>
));

/** Phone handset. */
export const PhoneRealIcon = createRealIcon('Phone', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Path
      d="M7.2 3.8h3.2l1.2 3.2-1.8 1.4a12.4 12.4 0 0 0 5.8 5.8l1.4-1.8 3.2 1.2v3.2c0 .9-.7 1.6-1.6 1.6A15.6 15.6 0 0 1 5.6 5.4c0-.9.7-1.6 1.6-1.6z"
      fill={strong}
    />
  </G>
));

/** Bell. */
export const BellRealIcon = createRealIcon('Bell', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Path
      d="M6.2 16.4h11.6c-.4-1.2-.8-2.4-.8-4.2V10c0-2.8-1.8-5.2-4.4-5.9V3.6a1.2 1.2 0 0 0-2.4 0v.5C7.6 4.8 5.8 7.2 5.8 10v2.2c0 1.8-.4 3-.8 4.2z"
      fill={strong}
    />
    <Path d="M10.2 18.4a1.8 1.8 0 0 0 3.6 0" />
  </G>
));

/** Lock. */
export const LockRealIcon = createRealIcon('Lock', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M7 10.4h10v8.4c0 .9-.7 1.6-1.6 1.6H8.6c-.9 0-1.6-.7-1.6-1.6v-8.4z" fill={strong} />
    <Path d="M9 10.4V7.6a3 3 0 0 1 6 0v2.8" />
    <Circle cx="12" cy="14.6" r="1.2" fill={soft} />
  </G>
));

/** Mail. */
export const MailRealIcon = createRealIcon('Mail', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3.6 6.8h16.8v11.2c0 .9-.7 1.6-1.6 1.6H5.2c-.9 0-1.6-.7-1.6-1.6V6.8z" fill={strong} />
    <Path d="M3.6 7.4 12 13.2l8.4-5.8" />
  </G>
));

/** Search. */
export const SearchRealIcon = createRealIcon('Search', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="10.6" cy="10.6" r="6" fill={strong} />
    <Path d="M15.2 15.2 20.6 20.6" />
  </G>
));

/** Map pin. */
export const PinRealIcon = createRealIcon('Pin', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Path
      d="M12 2.8c-3.6 0-6.4 2.8-6.4 6.4 0 4.4 6.4 11.2 6.4 11.2s6.4-6.8 6.4-11.2c0-3.6-2.8-6.4-6.4-6.4z"
      fill={strong}
    />
    <Circle cx="12" cy="9.2" r="2.2" fill={soft} />
  </G>
));

/** Saved address — pin with mini home. */
export const AddressRealIcon = createRealIcon('Address', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Path
      d="M12 2.6c-3.5 0-6.2 2.7-6.2 6.2 0 4.2 6.2 11 6.2 11s6.2-6.8 6.2-11c0-3.5-2.7-6.2-6.2-6.2z"
      fill={strong}
    />
    <Path d="M9.2 10.2 12 7.8l2.8 2.4v3.6H9.2v-3.6z" fill={soft} />
    <Path d="M11 13.8v-2h2v2" />
  </G>
));

/** FAQ / guide book. */
export const FaqBookRealIcon = createRealIcon('FaqBook', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M5 4.6h6.2c.9 0 1.6.7 1.6 1.6v13c0-.7-.6-1.2-1.3-1.2H5V4.6z" fill={strong} />
    <Path d="M19 4.6h-6.2c-.9 0-1.6.7-1.6 1.6v13c0-.7.6-1.2 1.3-1.2H19V4.6z" fill={soft} />
    <Path d="M12.8 5.4v12.8" opacity={0.45} />
    <Path d="M7.2 8.4h3M7.2 11h3M7.2 13.6h2.2" />
  </G>
));

/** WhatsApp-style chat bubble (support chat). */
export const ChatRealIcon = createRealIcon('Chat', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Path
      d="M5.2 4.8h13.6c1 0 1.8.8 1.8 1.8v8.2c0 1-.8 1.8-1.8 1.8H10.4L6.2 19.8V16.6H5.2c-1 0-1.8-.8-1.8-1.8V6.6c0-1 .8-1.8 1.8-1.8z"
      fill={strong}
    />
    <Path d="M8.2 9.4h7.6M8.2 12.2h5.2" />
  </G>
));

/** Star. */
export const StarRealIcon = createRealIcon('Star', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Path
      d="M12 3.2 14.4 9h6l-4.8 3.6 1.8 6L12 15.4 6.6 18.6l1.8-6L3.6 9h6L12 3.2z"
      fill={strong}
    />
  </G>
));

/** Hard hat / technician. */
export const TechRealIcon = createRealIcon('Tech', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M5.2 14.2h13.6v2.4c0 .8-.6 1.4-1.4 1.4H6.6c-.8 0-1.4-.6-1.4-1.4v-2.4z" fill={soft} />
    <Path d="M6 14.2C6.4 9.6 8.8 6.8 12 6.8s5.6 2.8 6 7.4" fill={strong} />
    <Path d="M12 6.8V5" />
    <Path d="M4.4 14.2h15.2" />
  </G>
));

/** Percent badge. */
export const PercentRealIcon = createRealIcon('Percent', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="8.4" fill={strong} />
    <Circle cx="9.2" cy="9.4" r="1.3" fill={soft} />
    <Circle cx="14.8" cy="14.6" r="1.3" fill={soft} />
    <Path d="M9 15.4 15 8.6" />
  </G>
));

/** Credit / debit card. */
export const CardRealIcon = createRealIcon('Card', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3.4 7.2h17.2v10.4c0 .9-.7 1.6-1.6 1.6H5c-.9 0-1.6-.7-1.6-1.6V7.2z" fill={strong} />
    <Path d="M3.4 10h17.2" />
    <Path d="M3.4 7.2h17.2V10H3.4z" fill={soft} />
    <Path d="M6.4 14.4h4.8M14.4 14.4h3.2" opacity={0.55} />
  </G>
));

/** Wallet. */
export const WalletRealIcon = createRealIcon('Wallet', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3.6 7.6h14.2c1 0 1.8.8 1.8 1.8v8.2c0 1-.8 1.8-1.8 1.8H5.4c-1 0-1.8-.8-1.8-1.8V7.6z" fill={strong} />
    <Path d="M3.6 7.6V6.2c0-.9.7-1.6 1.6-1.6h11.2" />
    <Path d="M14.8 13.4h5.2v2.8h-5.2a1.4 1.4 0 0 1 0-2.8z" fill={soft} />
    <Circle cx="16.6" cy="14.8" r="0.7" fill={color} stroke="none" />
  </G>
));

/** Tag / label. */
export const TagsRealIcon = createRealIcon('Tags', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Path
      d="M4.2 4.2h6.4L19 12.6a2 2 0 0 1 0 2.8l-3.6 3.6a2 2 0 0 1-2.8 0L4.2 10.6V4.2z"
      fill={strong}
    />
    <Circle cx="8.2" cy="8.2" r="1.35" fill={soft} />
  </G>
));

/** Settings gear. */
export const SettingsRealIcon = createRealIcon('Settings', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="3" fill={soft} />
    <Path
      d="M12 3.2 13.2 5.4l2.4-.4 1.2 2.2 2.2.8-.4 2.4 1.8 1.6-1.8 1.6.4 2.4-2.2.8-1.2 2.2-2.4-.4L12 20.8l-1.2-2.2-2.4.4-1.2-2.2-2.2-.8.4-2.4L3.6 12l1.8-1.6-.4-2.4 2.2-.8 1.2-2.2 2.4.4L12 3.2z"
      fill={strong}
    />
    <Circle cx="12" cy="12" r="2.2" />
  </G>
));

/** Clock. */
export const ClockRealIcon = createRealIcon('Clock', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="8.4" fill={strong} />
    <Path d="M12 7.2v5.2l3.4 2" />
  </G>
));

/** Chat bubble. */
export const MessageRealIcon = createRealIcon('Message', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Path
      d="M4.2 5.4h15.6c.9 0 1.6.7 1.6 1.6v8.4c0 .9-.7 1.6-1.6 1.6H9.2L4.2 20.4V5.4z"
      fill={strong}
    />
    <Path d="M8 10.2h8M8 13.4h5.2" opacity={0.55} />
  </G>
));

/** Check circle success. */
export const CheckRealIcon = createRealIcon('Check', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="8.4" fill={strong} />
    <Path d="M8.2 12.2 10.8 14.8 15.8 9.2" />
  </G>
));

/** Gift box. */
export const GiftRealIcon = createRealIcon('Gift', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M4.4 10.4h15.2v9.2c0 .9-.7 1.6-1.6 1.6H6c-.9 0-1.6-.7-1.6-1.6v-9.2z" fill={strong} />
    <Path d="M3.6 7.2h16.8v3.2H3.6z" fill={soft} />
    <Path d="M12 7.2v13.6" />
    <Path d="M12 7.2C10.2 4.8 8 4.8 7.2 6.2c-.6 1 .2 2.2 2.2 2.6" />
    <Path d="M12 7.2c1.8-2.4 4-2.4 4.8-1 .6 1-.2 2.2-2.2 2.6" />
  </G>
));

/** Admin dashboard grid. */
export const DashboardRealIcon = createRealIcon('Dashboard', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3.6 3.6h7.2v7.2H3.6z" fill={strong} />
    <Path d="M13.2 3.6h7.2v4.4H13.2z" fill={soft} />
    <Path d="M13.2 10.4h7.2v10H13.2z" fill={strong} />
    <Path d="M3.6 13.2h7.2v7.2H3.6z" fill={soft} />
  </G>
));

/** Bar chart / reports. */
export const ChartRealIcon = createRealIcon('Chart', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M4 20.2h16.4" />
    <Path d="M6.2 20.2V11.4h3.2V20.2z" fill={soft} />
    <Path d="M10.6 20.2V6.8h3.2V20.2z" fill={strong} />
    <Path d="M15 20.2v-5.6h3.2v5.6z" fill={soft} />
  </G>
));

/** Package / jobs. */
export const PackageRealIcon = createRealIcon('Package', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3.6 8.2 12 3.8l8.4 4.4v9.2L12 21.6 3.6 17.4V8.2z" fill={strong} />
    <Path d="M12 12.2v9.4" />
    <Path d="M3.6 8.2 12 12.2l8.4-4" />
    <Path d="M8.2 5.8 15.8 9.8" opacity={0.45} />
  </G>
));

/** Hotel / lodging. */
export const HotelRealIcon = createRealIcon('Hotel', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3.6 20.4V7.2h16.8v13.2" fill={strong} />
    <Path d="M3.6 20.4h16.8" />
    <Path d="M7.2 10.4h2M11 10.4h2M14.8 10.4h2M7.2 14h2M11 14h2M14.8 14h2" />
    <Path d="M8.8 20.4v-3.2h6.4v3.2" fill={soft} />
    <Path d="M9.6 7.2V5.2h4.8v2" />
  </G>
));

/** Store / shopfront. */
export const StoreRealIcon = createRealIcon('Store', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M4.4 10.4h15.2V20H4.4z" fill={strong} />
    <Path d="M3.6 6.4h16.8l-1.2 4H4.8L3.6 6.4z" fill={soft} />
    <Path d="M9.2 20v-5.2h5.6V20" fill={soft} />
    <Path d="M7.2 6.4V4.8h9.6v1.6" opacity={0.55} />
  </G>
));

/** Factory. */
export const FactoryRealIcon = createRealIcon('Factory', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3.4 20.4V11.2l5.2 3.2V11.2l5.2 3.2V8.4h6.8v12" fill={strong} />
    <Path d="M3.4 20.4h17.2" />
    <Path d="M15.6 8.4V4.8h2.4v3.6" />
    <Path d="M7.2 16.4h2M11.2 16.4h2M15.2 16.4h2" />
    <Path d="M15.8 11.6h4.4v3.2h-4.4z" fill={soft} />
  </G>
));

/** Smartphone / UPI. */
export const PhoneDeviceRealIcon = createRealIcon('PhoneDevice', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Path
      d="M7.2 2.8h9.6c1 0 1.8.8 1.8 1.8v14.8c0 1-.8 1.8-1.8 1.8H7.2c-1 0-1.8-.8-1.8-1.8V4.6c0-1 .8-1.8 1.8-1.8z"
      fill={strong}
    />
    <Path d="M9.2 5.2h5.6" />
    <Circle cx="12" cy="18.2" r="0.9" fill={soft} stroke="none" />
    <Path d="M8.6 7.6h6.8v8.2H8.6z" fill={soft} />
  </G>
));

/** Users group. */
export const UsersRealIcon = createRealIcon('Users', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="9" cy="8.2" r="2.8" fill={soft} />
    <Path d="M3.6 19c.7-3.2 2.8-4.8 5.4-4.8s4.7 1.6 5.4 4.8" fill={strong} />
    <Circle cx="16.4" cy="9" r="2.2" fill={soft} />
    <Path d="M13.2 19c.4-2.2 1.8-3.4 3.6-3.4 1.9 0 3.3 1.2 3.6 3.4" fill={soft} />
  </G>
));

/** Add user. */
export const UserPlusRealIcon = createRealIcon('UserPlus', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="9.2" cy="8" r="3.2" fill={soft} />
    <Path d="M3.4 19.2c.7-3.4 3-5.2 5.8-5.2s5.1 1.8 5.8 5.2" fill={strong} />
    <Path d="M17.2 9.2v5.2M14.6 11.8h5.2" />
  </G>
));

/** Document / file. */
export const FileRealIcon = createRealIcon('File', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Path
      d="M6.4 3.6h7.2L17.6 7.6v12.4c0 .9-.7 1.6-1.6 1.6H6.4c-.9 0-1.6-.7-1.6-1.6V5.2c0-.9.7-1.6 1.6-1.6z"
      fill={strong}
    />
    <Path d="M13.6 3.6v4h4" fill={soft} />
    <Path d="M8.6 12h6.8M8.6 15.2h6.8M8.6 18.2h4.4" />
  </G>
));

/** Logout / exit. */
export const LogoutRealIcon = createRealIcon('Logout', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M10.4 4.4H6.8c-.9 0-1.6.7-1.6 1.6v12c0 .9.7 1.6 1.6 1.6h3.6" />
    <Path d="M14 8.2 18.4 12 14 15.8" />
    <Path d="M18.4 12H9.2" />
    <Path d="M5.2 8.4h3.2v7.2H5.2z" fill={soft} opacity={0.35} />
  </G>
));

/** Warning triangle. */
export const AlertRealIcon = createRealIcon('Alert', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 3.6 21.2 19.6H2.8L12 3.6z" fill={strong} />
    <Path d="M12 9.4v4.4" />
    <Circle cx="12" cy="16.4" r="0.75" fill={color} stroke="none" />
  </G>
));

/** Info circle. */
export const InfoRealIcon = createRealIcon('Info', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="8.2" fill={strong} />
    <Path d="M12 11.2v5" />
    <Circle cx="12" cy="8.2" r="0.85" fill={color} stroke="none" />
  </G>
));

/** Offline / wifi off. */
export const OfflineRealIcon = createRealIcon('Offline', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M4.2 9.2c4.4-3.6 11.2-3.6 15.6 0" />
    <Path d="M7 12.4c2.8-2.2 7.2-2.2 10 0" fill={soft} />
    <Path d="M9.8 15.4c1.4-1 3-1 4.4 0" />
    <Circle cx="12" cy="18.6" r="1.1" fill={strong} />
    <Path d="M5 5 19 19" />
  </G>
));

/** Briefcase. */
export const BriefcaseRealIcon = createRealIcon('Briefcase', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3.6 8.4h16.8v10.4c0 .9-.7 1.6-1.6 1.6H5.2c-.9 0-1.6-.7-1.6-1.6V8.4z" fill={strong} />
    <Path d="M8.4 8.4V6.4c0-.9.7-1.6 1.6-1.6h4c.9 0 1.6.7 1.6 1.6v2" />
    <Path d="M3.6 12.4h16.8" />
    <Path d="M10.4 12.4v1.6h3.2v-1.6" fill={soft} />
  </G>
));

/** Rupee. */
export const RupeeRealIcon = createRealIcon('Rupee', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="8.4" fill={strong} />
    <Path d="M8.4 8.2h7.2M8.4 11h7.2" />
    <Path d="M10.2 8.2c2.4 0 4 1.4 4 3.4 0 2.4-2 3.6-4.6 3.6" />
    <Path d="M9.6 14.6 14.8 18" />
  </G>
));

/** Sun / morning slot. */
export const SunRealIcon = createRealIcon('Sun', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="4" fill={strong} />
    <Path d="M12 2.8v2.2M12 19v2.2M2.8 12h2.2M19 12h2.2" />
    <Path d="M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6" />
  </G>
));

/** Afternoon / cloud sun. */
export const CloudSunRealIcon = createRealIcon('CloudSun', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="8.4" cy="8.2" r="2.8" fill={soft} />
    <Path d="M8.4 3.6v1.4M4.2 8.2H2.8M4.8 4.6l1 1M12 4.6l-1 1" opacity={0.7} />
    <Path
      d="M7.2 18.4c-2.2 0-4-1.6-4-3.6 0-1.4.9-2.7 2.2-3.2.2-2.2 2.1-4 4.4-4 1.4 0 2.7.6 3.5 1.6.6-.4 1.4-.6 2.2-.6 2.1 0 3.8 1.6 3.8 3.6 0 .3 0 .6-.1 1 1.3.4 2.2 1.6 2.2 3 0 1.7-1.5 3.2-3.3 3.2H7.2z"
      fill={strong}
    />
  </G>
));

/** Error / cancel circle. */
export const ErrorRealIcon = createRealIcon('Error', ({ color, stroke, soft, strong }) => (
  <G stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="8.2" fill={strong} />
    <Path d="M9 9l6 6M15 9l-6 6" />
  </G>
));

/** Map of key → realistic icon. */
export const REAL_SERVICE_ICONS = {
  spray: SprayIcon,
  bug: CockroachIcon,
  bugoff: CockroachIcon,
  cockroach: CockroachIcon,
  mosq: MosquitoIcon,
  mosquito: MosquitoIcon,
  wind: MosquitoIcon,
  mouse: RodentIcon,
  rodent: RodentIcon,
  bed: BedBugIcon,
  bed_bug: BedBugIcon,
  termite: TermiteIcon,
  tree: TermiteIcon,
  wood_borer: WoodBorerIcon,
  cloud: FumigationIcon,
  fumigation: FumigationIcon,
  bird: BirdIcon,
  ant: AntIcon,
  spider: SpiderIcon,
  flea: FleaIcon,
  bee: BeeIcon,
  lizard: LizardIcon,
  snail: SnailIcon,
  inspect: InspectIcon,
  general: SprayIcon,
  sparkles: CleanIcon,
  clean: CleanIcon,
  deep_cleaning: CleanIcon,
  brush: CleanIcon,
  droplets: CleanIcon,
  flask: FumigationIcon,
  home: HomeRealIcon,
  building: BuildingRealIcon,
  warehouse: WarehouseRealIcon,
  silo: WarehouseRealIcon,
  hotel: HotelRealIcon,
  store: StoreRealIcon,
  factory: FactoryRealIcon,
  shield: ShieldRealIcon,
  clipboard: ClipboardRealIcon,
  offer: OfferRealIcon,
  calendar: CalendarRealIcon,
  support: SupportRealIcon,
  leaf: LeafRealIcon,
  user: UserRealIcon,
  phone: PhoneRealIcon,
  bell: BellRealIcon,
  lock: LockRealIcon,
  mail: MailRealIcon,
  search: SearchRealIcon,
  pin: PinRealIcon,
  address: AddressRealIcon,
  faqBook: FaqBookRealIcon,
  chat: ChatRealIcon,
  star: StarRealIcon,
  tech: TechRealIcon,
  percent: PercentRealIcon,
  card: CardRealIcon,
  wallet: WalletRealIcon,
  tags: TagsRealIcon,
  settings: SettingsRealIcon,
  clock: ClockRealIcon,
  message: MessageRealIcon,
  check: CheckRealIcon,
  gift: GiftRealIcon,
  dashboard: DashboardRealIcon,
  chart: ChartRealIcon,
  package: PackageRealIcon,
  users: UsersRealIcon,
  alert: AlertRealIcon,
  info: InfoRealIcon,
  briefcase: BriefcaseRealIcon,
  rupee: RupeeRealIcon,
  sun: SunRealIcon,
} as const satisfies Record<string, LucideIcon>;

export type RealServiceIconKey = keyof typeof REAL_SERVICE_ICONS;
