import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { type ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, surfaces } from '@/constants/theme';

const BLUR_IOS = Platform.OS === 'ios';

export function StickyActionBar({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.shell}>
      {Platform.OS !== 'web' ? (
        <BlurView intensity={BLUR_IOS ? 58 : 74} tint="light" style={StyleSheet.absoluteFill} />
      ) : null}
      <View style={styles.tint} pointerEvents="none" />
      <LinearGradient
        colors={['rgba(255,255,255,0.72)', 'rgba(246,250,242,0.28)', 'rgba(255,255,255,0.18)']}
        locations={[0, 0.45, 1]}
        style={styles.sheen}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        pointerEvents="none"
      />
      <View style={styles.rim} pointerEvents="none" />
      <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: surfaces.glassBorderStrong,
    shadowColor: '#03170B',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 12,
  },
  tint: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255,255,255,0.42)',
  },
  sheen: {
    ...StyleSheet.absoluteFill,
  },
  rim: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  bar: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
});
