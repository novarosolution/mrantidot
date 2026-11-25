import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useReducedMotion } from '@/lib/a11yPrefs';

const BASE = '#ECEFEC';
const SWEEP_W = 140;

/**
 * One shimmer clock for the whole app, so every placeholder on screen sweeps in step.
 * The loop only runs while at least one skeleton is mounted.
 */
const sweep = new Animated.Value(0);
let users = 0;
let loop: Animated.CompositeAnimation | null = null;

function useSharedSweep(enabled: boolean): Animated.Value {
  useEffect(() => {
    if (!enabled) return;
    users += 1;
    if (users === 1) {
      sweep.setValue(0);
      loop = Animated.loop(
        Animated.timing(sweep, { toValue: 1, duration: 1250, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      );
      loop.start();
    }
    return () => {
      users -= 1;
      if (users === 0) {
        loop?.stop();
        loop = null;
      }
    };
  }, [enabled]);
  return sweep;
}

/** Kept for existing callers: a gentle opacity breath shared by a group of placeholders. */
export function useSkeletonPulse(): Animated.Value {
  const pulse = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const l = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 650, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.5, duration: 650, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    l.start();
    return () => l.stop();
  }, [pulse]);
  return pulse;
}

/**
 * Grey placeholder block shaped like the content it stands in for, with a soft light sweep across it.
 * `pulse` is optional and only kept so older call sites still compile; the sweep replaces it.
 * Reduce-motion users get a still block.
 */
export function Skeleton({
  width,
  height,
  radius = 12,
  style,
}: {
  width: number | `${number}%`;
  height: number;
  radius?: number;
  pulse?: Animated.Value;
  style?: StyleProp<ViewStyle>;
}) {
  const reduced = useReducedMotion();
  const progress = useSharedSweep(!reduced);
  const { width: screenW } = useWindowDimensions();
  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [-SWEEP_W, screenW] });

  return (
    <View
      style={[{ width, height, borderRadius: radius, backgroundColor: BASE, overflow: 'hidden' }, style]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {reduced ? null : (
        <Animated.View style={[styles.sweep, { transform: [{ translateX }] }]}>
          <LinearGradient
            colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.7)', 'rgba(255,255,255,0)']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sweep: { position: 'absolute', top: 0, bottom: 0, width: SWEEP_W },
});
