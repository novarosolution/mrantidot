import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, View, type ImageSourcePropType, type StyleProp, type ViewStyle } from 'react-native';
import { PremiumAurora } from '@/components/kit/PremiumAurora';
import { SERVICE_TYPE_IMAGES } from '@/constants/serviceImages';
import { getReducedMotion, useAmbientLoop } from '@/lib/a11yPrefs';

/** Brand hero wash — deep forest, lighter at the top-left. */
export const AUTH_HERO_GRADIENT = ['#159447', '#087B35', '#075C2B'] as const;

/** One 3D pest illustration on a soft glass disc that slowly bobs. */
export function FloatingPest({
  source,
  size,
  style,
  delay = 0,
  tilt = 0,
}: {
  source: ImageSourcePropType;
  size: number;
  style?: StyleProp<ViewStyle>;
  delay?: number;
  tilt?: number;
}) {
  const bob = useRef(new Animated.Value(0)).current;
  const enter = useRef(new Animated.Value(getReducedMotion() ? 1 : 0)).current;

  useEffect(() => {
    if (getReducedMotion()) {
      enter.setValue(1);
      return;
    }
    const anim = Animated.timing(enter, {
      toValue: 1,
      duration: 620,
      delay,
      easing: Easing.out(Easing.back(1.4)),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [delay, enter]);

  useAmbientLoop(
    () =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(bob, { toValue: 1, duration: 2400 + delay, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(bob, { toValue: 0, duration: 2400 + delay, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      ),
    [bob, delay],
  );

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.disc,
        { width: size, height: size, borderRadius: size / 2 },
        style,
        {
          opacity: enter,
          transform: [
            { translateY: bob.interpolate({ inputRange: [0, 1], outputRange: [0, -7] }) },
            { scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) },
            { rotate: `${tilt}deg` },
          ],
        },
      ]}
    >
      <Image source={source} style={{ width: size * 0.78, height: size * 0.78 }} resizeMode="contain" />
    </Animated.View>
  );
}

/**
 * Brand backdrop for auth heroes — forest gradient, two quiet light discs and
 * 3D pest illustrations floating at the edges (what we protect homes from).
 */
export function AuthHeroBackdrop({ height, dense = false }: { height: number; dense?: boolean }) {
  return (
    <View style={[StyleSheet.absoluteFill, { height }]} pointerEvents="none">
      <PremiumAurora topFade={false} rings={false} />
      <FloatingPest source={SERVICE_TYPE_IMAGES.cockroach} size={dense ? 70 : 64} delay={80} tilt={-12} style={{ top: height * 0.2, right: 18 }} />
      <FloatingPest source={SERVICE_TYPE_IMAGES.mosquito} size={52} delay={220} tilt={10} style={{ top: height * 0.5, right: 92 }} />
      <FloatingPest source={SERVICE_TYPE_IMAGES.termite} size={46} delay={360} tilt={-6} style={{ bottom: 44, right: 22 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  disc: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  glow: { position: 'absolute', borderRadius: 999 },
  glowA: {
    width: 260,
    height: 260,
    top: -110,
    right: -80,
    backgroundColor: 'rgba(185,229,138,0.16)',
  },
  glowB: {
    width: 200,
    height: 200,
    bottom: -90,
    left: -70,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
});
