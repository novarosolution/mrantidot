import type { ReactNode } from 'react';
import { Pressable, type PressableProps, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type KitTabBarButtonProps = PressableProps & {
  children?: ReactNode;
  accessibilityState?: { selected?: boolean };
};

/** Premium tab press target with lime active indicator. */
export function KitTabBarButton(props: KitTabBarButtonProps) {
  const { children, accessibilityState, style: _style, ...rest } = props;
  const focused = accessibilityState?.selected;

  return (
    <Pressable
      {...rest}
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}
    >
      {focused ? (
        <LinearGradient
          colors={['#B6E86A', '#8FD03C', '#27A747']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.indicator}
        />
      ) : (
        <View style={styles.indicatorSpacer} />
      )}
      <View style={styles.inner}>{children}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 4,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.94 }],
  },
  indicator: {
    width: 18,
    height: 3.5,
    borderRadius: 3,
    marginBottom: 4,
  },
  indicatorSpacer: {
    width: 18,
    height: 3.5,
    marginBottom: 4,
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
