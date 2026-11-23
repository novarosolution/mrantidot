import { Animated, Easing, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * One motion language for the customer app — every entrance, press and sheet uses these numbers
 * so screens feel like the same product. Keep animations short: they should guide, not wait.
 */
export const motion = {
  duration: { fast: 120, base: 220, slow: 340 },
  easing: {
    out: Easing.out(Easing.cubic),
    inOut: Easing.inOut(Easing.cubic),
  },
  /** Soft settle for things sliding into place. */
  spring: { friction: 10, tension: 68 },
  /** Snappier spring for taps and toggles. */
  springSnappy: { friction: 7, tension: 140 },
  /** Bottom sheets rising into place — a touch firmer than `spring` so they never feel floaty. */
  springSheet: { friction: 11, tension: 80 },
  /** Gap between staggered siblings, capped so long lists never feel slow. */
  staggerStep: 55,
  staggerMax: 6,
  /** Entrances: how far a section slides up while it fades in. */
  enterOffset: 18,
  /** Press feedback (PressableScale): quick dip in, soft spring back out. */
  press: {
    scale: 0.97,
    opacity: 0.94,
    /** Reduce-motion press: no scale, only a dim. */
    reducedOpacity: 0.7,
    in: { speed: 40, bounciness: 0 },
    out: { speed: 22, bounciness: 6 },
  },
  /** Attention shake (missing booking step): distance in px, one leg in ms. */
  shake: { distance: 8, leg: 45 },
} as const;

/** Entrance delay for the i-th item of a list or the i-th section of a page. */
export function stagger(i: number, base = 0): number {
  return base + Math.min(i, motion.staggerMax) * motion.staggerStep;
}

/**
 * Short horizontal "not yet" shake for a step or field the user still has to fill. Pair it with
 * `haptic('warning')` and a visible message; skip the shake itself when Reduce Motion is on.
 */
export function shakeAnimation(value: Animated.Value): Animated.CompositeAnimation {
  const { distance: d, leg } = motion.shake;
  value.setValue(0);
  return Animated.sequence(
    [d, -d, d * 0.6, -d * 0.6, 0].map((toValue) =>
      Animated.timing(value, { toValue, duration: leg, easing: Easing.linear, useNativeDriver: true }),
    ),
  );
}

type HapticKind = 'tap' | 'select' | 'success' | 'warning' | 'error';

/**
 * Light, fire-and-forget haptics. Silent where the device can't (Low Power Mode, web, simulators)
 * and never throws into UI code. Android uses the system haptic constants, which need no VIBRATE permission.
 */
export function haptic(kind: HapticKind = 'tap'): void {
  try {
    if (Platform.OS === 'android') {
      const map: Record<HapticKind, Haptics.AndroidHaptics> = {
        tap: Haptics.AndroidHaptics.Virtual_Key,
        select: Haptics.AndroidHaptics.Segment_Tick,
        success: Haptics.AndroidHaptics.Confirm,
        warning: Haptics.AndroidHaptics.Reject,
        error: Haptics.AndroidHaptics.Reject,
      };
      void Haptics.performAndroidHapticsAsync(map[kind]).catch(() => undefined);
      return;
    }
    if (Platform.OS !== 'ios') return;
    const run =
      kind === 'tap'
        ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        : kind === 'select'
          ? Haptics.selectionAsync()
          : Haptics.notificationAsync(
              kind === 'success'
                ? Haptics.NotificationFeedbackType.Success
                : kind === 'warning'
                  ? Haptics.NotificationFeedbackType.Warning
                  : Haptics.NotificationFeedbackType.Error,
            );
    void run.catch(() => undefined);
  } catch {
    // Haptics are a nicety — never break a tap over them.
  }
}
