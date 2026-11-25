import { useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import { AppImage } from '@/components/ui/AppImage';
import { colors } from '@/constants/theme';
import { useAmbientLoop } from '@/lib/a11yPrefs';

const LOGO = require('../assets/logo.png');

/** App mark with an optional slow float (paused off-screen and with Reduce Motion). */
export function BrandLogo({ size = 96, animate = true }: { size?: number; animate?: boolean }) {
  const float = useRef(new Animated.Value(0)).current;

  useAmbientLoop(
    () =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(float, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(float, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      ),
    [float],
    animate,
  );

  const translateY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });

  return (
    <Animated.View style={[animate && styles.wrap, animate && { transform: [{ translateY }] }]}>
      <AppImage
        source={LOGO}
        style={{ width: size, height: size, borderRadius: size * 0.225 }}
        contentFit="contain"
        transition={0}
        placeholderColor="transparent"
        showFallbackIcon={false}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 8,
  },
});
