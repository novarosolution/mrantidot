import Svg, { Circle, G, Line, Path, Rect } from 'react-native-svg';
import { colors } from '@/constants/theme';

const LIME = colors.limeOnDark;
const DEEP = colors.headerDeep;

/** Protected-home illustration for the booking banner — house, shield badge, leaf. */
export function HomeShieldArt({ size = 120 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" accessibilityElementsHidden>
      <Circle cx="60" cy="64" r="52" fill="rgba(255,255,255,0.06)" />
      <Circle cx="60" cy="64" r="38" fill="rgba(255,255,255,0.07)" />
      <Path d="M18 96 C18 80 31 73 42 76 C42 89 31 98 18 96 Z" fill="rgba(185,229,138,0.5)" />
      <Path d="M21 93 C27 87 32 83 38 80" stroke="rgba(11,74,38,0.35)" strokeWidth={1.6} strokeLinecap="round" fill="none" />
      <Path
        d="M38 56 V88 a4 4 0 0 0 4 4 H78 a4 4 0 0 0 4 -4 V56"
        stroke="#FFFFFF"
        strokeWidth={4}
        strokeLinejoin="round"
        fill="rgba(255,255,255,0.1)"
      />
      <Path d="M30 62 L60 36 L90 62" stroke="#FFFFFF" strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Rect x="53" y="70" width="14" height="22" rx="3" fill="rgba(255,255,255,0.24)" />
      <G transform="translate(70 66)">
        <Path
          d="M16 0 L30 5 V15 C30 24 24 30 16 33 C8 30 2 24 2 15 V5 Z"
          fill={LIME}
          stroke={DEEP}
          strokeWidth={2.5}
          strokeLinejoin="round"
        />
        <Path d="M10 16 L15 21 L23 11" stroke={DEEP} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </G>
    </Svg>
  );
}

/** Coupon illustration for the offer banner — tilted ticket with a percent mark. */
export function CouponArt({ size = 120 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" accessibilityElementsHidden>
      <Circle cx="60" cy="62" r="52" fill="rgba(255,255,255,0.06)" />
      <Circle cx="60" cy="62" r="38" fill="rgba(255,255,255,0.07)" />
      <G rotation={-14} origin="60, 60">
        <Path
          d="M28 38 H40 A6 6 0 0 0 52 38 H92 a10 10 0 0 1 10 10 V72 a10 10 0 0 1 -10 10 H52 A6 6 0 0 0 40 82 H28 a10 10 0 0 1 -10 -10 V48 a10 10 0 0 1 10 -10 Z"
          fill={LIME}
        />
        <Line x1="46" y1="48" x2="46" y2="72" stroke={DEEP} strokeWidth={2} strokeDasharray="4 4" strokeLinecap="round" />
        <Circle cx="66" cy="52" r="5" fill="none" stroke={DEEP} strokeWidth={3} />
        <Circle cx="86" cy="68" r="5" fill="none" stroke={DEEP} strokeWidth={3} />
        <Line x1="88" y1="48" x2="64" y2="72" stroke={DEEP} strokeWidth={3} strokeLinecap="round" />
        <Rect x="26" y="52" width="10" height="16" rx="2" fill="rgba(11,74,38,0.18)" />
      </G>
    </Svg>
  );
}
