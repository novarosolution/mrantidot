import { useCallback, useRef } from 'react';
import { Animated, StyleSheet, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReducedMotion } from '@/lib/a11yPrefs';

/** Content has to scroll this far (pt) before any of it can slide under the status bar. */
const EDGE = 4;
/** Soft fade below the status bar, so text is eased out instead of being cut by a hard line. */
const FEATHER = 14;

export type ScrimScrollHandler = (e: NativeSyntheticEvent<NativeScrollEvent>) => void;

/**
 * Wires a scroll view to a {@link StatusBarScrim}: put `onScroll` on the ScrollView / FlatList
 * (with `scrollEventThrottle={16}`) and hand `opacity` to the scrim. Only crossing the edge does any work,
 * and the fade runs on the native driver, so the screen never re-renders while scrolling.
 */
export function useStatusBarScrim() {
  const opacity = useRef(new Animated.Value(0)).current;
  const shown = useRef(false);
  const reduced = useReducedMotion();

  const onScroll = useCallback<ScrimScrollHandler>(
    (e) => {
      const next = e.nativeEvent.contentOffset.y > EDGE;
      if (next === shown.current) return;
      shown.current = next;
      Animated.timing(opacity, {
        toValue: next ? 1 : 0,
        duration: reduced ? 0 : 180,
        useNativeDriver: true,
      }).start();
    },
    [opacity, reduced],
  );

  return { opacity, onScroll };
}

/**
 * Frosted white wash over the status bar for screens whose header scrolls away with the content —
 * without it the title slides up under the clock and the two overprint. Hidden at rest, fades in once the
 * page scrolls, and feathers out below the status bar. No live blur: BlurView over scrolling content
 * ghosts (see GlassScreenKit), and the tint reads as frosted glass on the app's light canvas anyway.
 * Render it last in the screen root so it paints above the scroll view.
 */
export function StatusBarScrim({ opacity }: { opacity: Animated.Value }) {
  const insets = useSafeAreaInsets();
  if (insets.top <= 0) return null;
  const height = insets.top + FEATHER;

  return (
    <Animated.View pointerEvents="none" style={[styles.wrap, { height, opacity }]}>
      <LinearGradient
        colors={['rgba(255,255,255,0.99)', 'rgba(255,255,255,0.975)', 'rgba(255,255,255,0)']}
        locations={[0, insets.top / height, 1]}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
});
