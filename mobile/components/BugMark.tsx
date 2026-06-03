import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

export function BugMark({ size = 34, color = '#1E8E4E' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Ellipse cx="16" cy="18" rx="6.5" ry="8.5" fill={color} />
      <Circle cx="16" cy="8.5" r="3.6" fill={color} />
      <Path
        d="M7 13l-4-2M7 18H2.5M7 23l-4 2M25 13l4-2M25 18h4.5M25 23l4 2"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
      <Circle cx="20.5" cy="6.5" r="2" fill="#A8E04E" />
    </Svg>
  );
}
