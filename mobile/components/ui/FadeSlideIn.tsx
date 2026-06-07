import { type ReactNode, useEffect, useRef } from 'react';
import { Animated, Easing, type ViewStyle } from 'react-native';

export function FadeSlideIn({
  children,
  delay = 0,
  slideFrom = 20,
  style,
  trigger,
}: {
  children: ReactNode;
  delay?: number;
  slideFrom?: number;
  style?: ViewStyle;
  /** Re-run animation when this value changes (e.g. wizard step). */
  trigger?: string | number;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(slideFrom)).current;

  useEffect(() => {
    opacity.setValue(0);
    translateY.setValue(slideFrom);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 340,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        delay,
        friction: 10,
        tension: 68,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, opacity, slideFrom, translateY, trigger]);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}

export function FadeSlideHorizontal({
  children,
  step,
  style,
}: {
  children: ReactNode;
  step: number;
  style?: ViewStyle;
}) {
  const opacity = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const prevStep = useRef(step);

  useEffect(() => {
    const dir = step >= prevStep.current ? 1 : -1;
    prevStep.current = step;
    opacity.setValue(0);
    translateX.setValue(dir * 28);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(translateX, {
        toValue: 0,
        friction: 11,
        tension: 72,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, step, translateX]);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateX }] }, style]}>
      {children}
    </Animated.View>
  );
}
