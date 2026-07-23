import { LinearGradient } from 'expo-linear-gradient';
import { type ReactNode } from 'react';
import { Dimensions, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { MESH_BASE } from '@/components/kit/PremiumMeshBg';

const SCREEN_W = Dimensions.get('window').width;

/**
 * Clean premium dark header —
 * soft forest wash + angled bottom cut into the light body.
 * No beams / floating orbs.
 */
export function HeroDarkSlice({
  children,
  style,
  contentStyle,
  sliceColor = MESH_BASE,
  sliceHeight = 22,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  sliceColor?: string;
  sliceHeight?: number;
}) {
  const w = SCREEN_W;
  const h = sliceHeight;
  const d = `M0 0 L${w} ${h * 0.65} L${w} ${h} L0 ${h} Z`;

  return (
    <View style={[styles.shell, style]}>
      <LinearGradient
        colors={['#1A8A3C', '#0B6B28', '#053A16']}
        locations={[0, 0.55, 1]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['rgba(255,255,255,0.16)', 'rgba(255,255,255,0.04)', 'rgba(255,255,255,0)']}
        locations={[0, 0.4, 1]}
        style={styles.topSheen}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        pointerEvents="none"
      />
      <View style={styles.glowTR} pointerEvents="none">
        <LinearGradient
          colors={['rgba(184,232,106,0.28)', 'rgba(143,208,60,0)']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.2, y: 0.15 }}
          end={{ x: 1, y: 1 }}
        />
      </View>

      <View style={[styles.content, contentStyle]}>{children}</View>

      <Svg width={w} height={h} style={styles.slice} pointerEvents="none">
        <Path d={d} fill={sliceColor} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    overflow: 'hidden',
    position: 'relative',
  },
  content: {
    zIndex: 2,
  },
  topSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 110,
  },
  glowTR: {
    position: 'absolute',
    top: -70,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: 'hidden',
    opacity: 0.85,
  },
  slice: {
    position: 'absolute',
    left: 0,
    bottom: -0.5,
    zIndex: 3,
  },
});
