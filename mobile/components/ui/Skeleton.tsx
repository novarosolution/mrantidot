import { useEffect, useRef } from 'react';
import { Animated, Easing, type StyleProp, type ViewStyle } from 'react-native';

const BASE = '#ECEFEC';

/** One pulsing value per group so neighbouring placeholders breathe in sync. */
export function useSkeletonPulse(): Animated.Value {
  const pulse = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 650, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.5, duration: 650, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return pulse;
}

/** Soft grey placeholder block shown while content loads (replaces spinners). */
export function Skeleton({
  width,
  height,
  radius = 12,
  pulse,
  style,
}: {
  width: number | `${number}%`;
  height: number;
  radius?: number;
  pulse: Animated.Value;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Animated.View
      style={[{ width, height, borderRadius: radius, backgroundColor: BASE, opacity: pulse }, style]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}
