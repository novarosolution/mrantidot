import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

/** Pest mascot — shield bug (transparent, for tiles & animation). */
export function PestMascot({ size = 64 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <Circle cx="40" cy="28" r="11" fill="#1E8E4E" />
      <Ellipse cx="40" cy="46" rx="13" ry="15" fill="#A8E04E" />
      <Ellipse cx="40" cy="46" rx="13" ry="15" fill="#1E8E4E" opacity={0.15} />
      <Circle cx="36" cy="27" r="2.2" fill="#FFFFFF" />
      <Circle cx="44" cy="27" r="2.2" fill="#FFFFFF" />
      <Circle cx="36.5" cy="27.5" r="1" fill="#14532D" />
      <Circle cx="44.5" cy="27.5" r="1" fill="#14532D" />
      <Path d="M36 31 Q40 34 44 31" stroke="#14532D" strokeWidth="1.4" strokeLinecap="round" />
      <Path d="M27 24 L18 19 M27 40 H16 M27 56 L18 61" stroke="#1E8E4E" strokeWidth="2.5" strokeLinecap="round" />
      <Path d="M53 24 L62 19 M53 40 H64 M53 56 L62 61" stroke="#1E8E4E" strokeWidth="2.5" strokeLinecap="round" />
      <Path d="M34 22 L32 14 M46 22 L48 14" stroke="#1E8E4E" strokeWidth="2" strokeLinecap="round" />
      <Circle cx="32" cy="14" r="2" fill="#A8E04E" />
      <Circle cx="48" cy="14" r="2" fill="#A8E04E" />
      <G transform="translate(52, 44) rotate(-8)">
        <Path d="M0 -8 L10 -10 L10 8 L0 12 L-10 8 L-10 -10 Z" fill="#14532D" />
        <Path d="M0 -8 L10 -10 L10 8 L0 12 L-10 8 L-10 -10 Z" fill="#1E8E4E" opacity={0.85} />
        <Path d="M-10 0 H10 M0 -10 V10" stroke="#A8E04E" strokeWidth="1.5" />
      </G>
    </Svg>
  );
}
