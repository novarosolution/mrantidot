import { type ReactNode, useEffect, useRef } from 'react';
import { Animated, Easing, type ViewStyle } from 'react-native';

/**
 * Entrance fade/slide. Safe inside ScrollViews:
 * - Does not re-flash to opacity 0 on remount unless `trigger` changes
 * - Uses a stable “already shown” latch so clipped-view remounts stay visible
 */
export function FadeSlideIn({
  children,
  delay = 0,
  slideFrom = 20,
  style,
  trigger,
  disabled = false,
}: {
  children: ReactNode;
  delay?: number;
  slideFrom?: number;
  style?: ViewStyle;
  /** Re-run animation when this value changes (e.g. wizard step). */
  trigger?: string | number;
  /** Skip animation — render children statically (preferred in long scroll screens). */
  disabled?: boolean;
}) {
  const opacity = useRef(new Animated.Value(disabled ? 1 : 0)).current;
  const translateY = useRef(new Animated.Value(disabled ? 0 : slideFrom)).current;
  const shown = useRef(disabled);
  const lastTrigger = useRef(trigger);

  useEffect(() => {
    if (disabled) {
      opacity.setValue(1);
      translateY.setValue(0);
      shown.current = true;
      return;
    }

    const triggerChanged = lastTrigger.current !== trigger;
    lastTrigger.current = trigger;

    // Remount / re-render after first play: stay visible (fixes scroll flash/ghost).
    if (shown.current && !triggerChanged) {
      opacity.setValue(1);
      translateY.setValue(0);
      return;
    }

    opacity.setValue(0);
    translateY.setValue(slideFrom);
    const anim = Animated.parallel([
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
    ]);
    anim.start(({ finished }) => {
      if (finished) shown.current = true;
    });
    return () => anim.stop();
  }, [delay, disabled, opacity, slideFrom, translateY, trigger]);

  if (disabled) {
    return <>{children}</>;
  }

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]} collapsable={false}>
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
    <Animated.View style={[{ opacity, transform: [{ translateX }] }, style]} collapsable={false}>
      {children}
    </Animated.View>
  );
}
