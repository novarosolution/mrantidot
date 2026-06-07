import type { ReactNode } from 'react';
import { Pressable, type PressableProps, StyleSheet, View } from 'react-native';
import { colors, design, premium, shadows } from '@/constants/theme';

type KitTabBarButtonProps = PressableProps & {
  children?: ReactNode;
  accessibilityState?: { selected?: boolean };
};

export function KitTabBarButton(props: KitTabBarButtonProps) {
  const { children, accessibilityState, style: _style, ...rest } = props;
  const focused = accessibilityState?.selected;

  return (
    <Pressable {...rest} style={styles.wrap}>
      {focused ? <View style={styles.indicatorWrap}><View style={styles.indicator} /></View> : null}
      <View style={styles.inner}>{children}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center' },
  indicatorWrap: {
    position: 'absolute',
    top: 4,
    ...shadows.card,
  },
  indicator: {
    width: 36,
    height: 4,
    borderRadius: 4,
    backgroundColor: premium.accentGold,
  },
  inner: { alignItems: 'center', paddingTop: 10 },
});
