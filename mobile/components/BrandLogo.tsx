import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PestMascot } from '@/components/PestMascot';
import { colors, premium, shadows } from '@/constants/theme';

export function BrandLogo({ size = 96, animate = true }: { size?: number; animate?: boolean }) {
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animate) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [animate, float]);

  const translateY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });
  const tile = size * 0.92;
  const mascot = size * 0.55;

  return (
    <Animated.View style={{ transform: [{ translateY }] }}>
      <LinearGradient
        colors={['#2BB563', '#14532D']}
        style={[styles.tile, { width: tile, height: tile, borderRadius: tile * 0.28 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.shine} />
        <PestMascot size={mascot} />
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    ...shadows.hero,
  },
  shine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
});
