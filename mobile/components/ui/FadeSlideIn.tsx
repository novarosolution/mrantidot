import { type ReactNode, useEffect, useRef } from 'react';
import { Animated, type StyleProp, type ViewStyle } from 'react-native';
import { getReducedMotion, useReducedMotion } from '@/lib/a11yPrefs';
import { motion } from '@/lib/motion';

/**
 * Entrance fade + slide up (motion tokens: `duration.slow`, `spring`, `enterOffset`). Safe inside ScrollViews:
 * - plays once per mount; re-renders and clipped-view remounts stay visible unless `trigger` changes
 * - the wrapper never changes shape, so Reduce Motion resolving late can't remount the children
 * - with Reduce Motion the content is simply shown
 */
export function FadeSlideIn({
  children,
  delay = 0,
  slideFrom = motion.enterOffset,
  style,
  trigger,
  disabled: disabledProp = false,
}: {
  children: ReactNode;
  delay?: number;
  slideFrom?: number;
  style?: StyleProp<ViewStyle>;
  /** Re-run animation when this value changes (e.g. wizard step). */
  trigger?: string | number;
  /** Skip animation — render children statically (preferred in long scroll screens). */
  disabled?: boolean;
}) {
  const reducedMotion = useReducedMotion();
  const still = disabledProp || reducedMotion;
  const startHidden = !disabledProp && !getReducedMotion();
  const opacity = useRef(new Animated.Value(startHidden ? 0 : 1)).current;
  const translateY = useRef(new Animated.Value(startHidden ? slideFrom : 0)).current;
  const shown = useRef(!startHidden);
  const lastTrigger = useRef(trigger);

  useEffect(() => {
    const triggerChanged = lastTrigger.current !== trigger;
    lastTrigger.current = trigger;

    if (still || (shown.current && !triggerChanged)) {
      opacity.setValue(1);
      translateY.setValue(0);
      shown.current = true;
      return;
    }

    opacity.setValue(0);
    translateY.setValue(slideFrom);
    const anim = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: motion.duration.slow,
        delay,
        easing: motion.easing.out,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, { toValue: 0, delay, ...motion.spring, useNativeDriver: true }),
    ]);
    anim.start(({ finished }) => {
      if (finished) shown.current = true;
    });
    return () => {
      anim.stop();
      // Interrupted (unmount, trigger change): land on the final frame rather than freezing mid-way.
      opacity.setValue(1);
      translateY.setValue(0);
    };
  }, [delay, still, opacity, slideFrom, translateY, trigger]);

  if (disabledProp) {
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
  style?: StyleProp<ViewStyle>;
}) {
  const reduced = useReducedMotion();
  const opacity = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const prevStep = useRef(step);

  useEffect(() => {
    const dir = step >= prevStep.current ? 1 : -1;
    prevStep.current = step;
    if (reduced) return;
    opacity.setValue(0);
    translateX.setValue(dir * 28);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: motion.duration.slow,
        easing: motion.easing.out,
        useNativeDriver: true,
      }),
      Animated.spring(translateX, { toValue: 0, ...motion.spring, useNativeDriver: true }),
    ]).start();
  }, [opacity, reduced, step, translateX]);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateX }] }, style]} collapsable={false}>
      {children}
    </Animated.View>
  );
}
