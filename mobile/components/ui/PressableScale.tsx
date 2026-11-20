import { type ReactNode, useRef } from 'react';
import { Animated, Platform, Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { useReducedMotion } from '@/lib/a11yPrefs';
import { haptic as playHaptic } from '@/lib/motion';

const IS_WEB = Platform.OS === 'web';
/** Web only: a soft dip while the mouse is over the card (react-native-web already sets cursor: pointer). */
const HOVER_OPACITY = 0.9;

/**
 * Pressable with a short spring "give" (scale ~0.97) — the shared press feedback for cards and tiles.
 * Falls back to a plain opacity dip when the OS asks for reduced motion.
 */
export function PressableScale({
  children,
  style,
  containerStyle,
  scaleTo = 0.97,
  haptic,
  ...rest
}: Omit<PressableProps, 'style' | 'children'> & {
  children: ReactNode;
  /** Styles the animated card (background, radius, padding…). */
  style?: StyleProp<ViewStyle>;
  /** Styles the outer touch target (flex sizing in rows / grids). */
  containerStyle?: StyleProp<ViewStyle>;
  scaleTo?: number;
  /** Optional haptic on press — 'tap' for actions, 'select' for choices. */
  haptic?: 'tap' | 'select';
}) {
  const reduced = useReducedMotion();
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const hovered = useRef(false);

  const to = (s: number, o: number, fast: boolean) =>
    Animated.parallel([
      Animated.spring(scale, { toValue: s, speed: fast ? 40 : 22, bounciness: fast ? 0 : 6, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: o, duration: fast ? 90 : 160, useNativeDriver: true }),
    ]).start();

  return (
    <Pressable
      {...rest}
      style={containerStyle}
      onPressIn={(e) => {
        to(reduced ? 1 : scaleTo, reduced ? 0.7 : 0.94, true);
        rest.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        to(1, hovered.current ? HOVER_OPACITY : 1, false);
        rest.onPressOut?.(e);
      }}
      {...(IS_WEB
        ? {
            onHoverIn: (e: Parameters<NonNullable<PressableProps['onHoverIn']>>[0]) => {
              hovered.current = true;
              if (!rest.disabled) to(1, HOVER_OPACITY, true);
              rest.onHoverIn?.(e);
            },
            onHoverOut: (e: Parameters<NonNullable<PressableProps['onHoverOut']>>[0]) => {
              hovered.current = false;
              to(1, 1, false);
              rest.onHoverOut?.(e);
            },
          }
        : null)}
      onPress={(e) => {
        if (haptic) playHaptic(haptic);
        rest.onPress?.(e);
      }}
    >
      <Animated.View style={[style, { opacity, transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}
