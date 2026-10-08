import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, type PressableProps, StyleSheet } from 'react-native';

type KitTabBarButtonProps = PressableProps & {
  children?: ReactNode;
  accessibilityState?: { selected?: boolean };
};

/** Premium floating tab press target — soft press + active lift. */
export function KitTabBarButton(props: KitTabBarButtonProps) {
  const { children, accessibilityState, style: _style, ...rest } = props;
  const focused = Boolean(accessibilityState?.selected);
  const focusAnim = useRef(new Animated.Value(focused ? 1 : 0)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(focusAnim, {
      toValue: focused ? 1 : 0,
      friction: 7,
      tension: 120,
      useNativeDriver: true,
    }).start();
  }, [focused, focusAnim]);

  return (
    <Pressable
      {...rest}
      onPressIn={(e) => {
        Animated.timing(pressAnim, {
          toValue: 0.94,
          duration: 90,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }).start();
        rest.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        Animated.timing(pressAnim, {
          toValue: 1,
          duration: 140,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
        rest.onPressOut?.(e);
      }}
      style={styles.wrap}
    >
      <Animated.View
        style={[
          styles.inner,
          {
            transform: [
              { scale: pressAnim },
              {
                translateY: focusAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -1.5] }),
              },
            ],
          },
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 2,
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
