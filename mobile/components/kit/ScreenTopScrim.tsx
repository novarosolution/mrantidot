import { LinearGradient } from 'expo-linear-gradient';
import { Animated, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Forest tint matching the top of HeroDarkSlice so the scrim blends into the hero. */
const SCRIM_TOP = 'rgba(6,58,26,0.94)';
const SCRIM_MID = 'rgba(6,58,26,0.72)';
const SCRIM_FADE = 'rgba(6,58,26,0)';

/**
 * Status-bar scrim for long scrolling screens.
 *
 * Screens open on a dark hero, so the clock reads fine at rest — but once the
 * hero scrolls away, light cards and chips slide under the clock / Dynamic
 * Island with nothing behind them. This fades a forest strip in exactly as the
 * hero clears the status bar, keeping the light status glyphs legible and the
 * top edge from ever colliding with content.
 */
export function ScreenTopScrim({
  scrollY,
  revealAt,
}: {
  scrollY: Animated.Value;
  /** Scroll offset at which the hero's bottom edge meets the status bar. */
  revealAt: number;
}) {
  const insets = useSafeAreaInsets();

  // Fade tightly around the crossover so the scrim never washes the hero itself.
  const opacity =
    revealAt > 0
      ? scrollY.interpolate({
          inputRange: [Math.max(revealAt - 28, 0), Math.max(revealAt, 1)],
          outputRange: [0, 1],
          extrapolate: 'clamp',
        })
      : 0;

  return (
    <Animated.View
      style={[styles.wrap, { height: insets.top + 10, opacity }]}
      pointerEvents="none"
    >
      <LinearGradient
        colors={[SCRIM_TOP, SCRIM_MID, SCRIM_FADE]}
        locations={[0, 0.72, 1]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
});
