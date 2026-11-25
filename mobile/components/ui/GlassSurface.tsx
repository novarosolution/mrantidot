import { type ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { useReduceTransparency } from '@/lib/a11yPrefs';
import { ui } from '@/constants/theme';

/**
 * Frosted glass for small floating chrome (search bar, tab bar, sticky headers, sheets).
 * ≈ rgba(255,255,255,.72) + 20px blur, soft white edge and a low green-tinted shadow.
 * Falls back to near-solid white on Android (no cheap native blur) and when iOS
 * "Reduce Transparency" is on, so text stays readable everywhere.
 * Keep it off large scrolling areas — blur is only cheap on small surfaces.
 */
export function GlassSurface({
  children,
  style,
  intensity = 40,
  tintOpacity = 0.62,
  edge = true,
  float = false,
}: {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** expo-blur intensity (0–100). */
  intensity?: number;
  /** White wash over the blur — higher = more opaque, better contrast. */
  tintOpacity?: number;
  /** Light inner edge (rgba white 0.65). */
  edge?: boolean;
  /** Lifted shadow for floating elements. */
  float?: boolean;
}) {
  const solid = useReduceTransparency() || Platform.OS !== 'ios';
  const radius = StyleSheet.flatten(style)?.borderRadius;

  return (
    <View style={[float && ui.shadowFloat, style, styles.shell]}>
      <View style={[StyleSheet.absoluteFill, styles.clip, radius != null && { borderRadius: radius }]} pointerEvents="none">
        {solid ? (
          <View style={[StyleSheet.absoluteFill, styles.solid]} />
        ) : (
          <>
            <BlurView intensity={intensity} tint="light" style={StyleSheet.absoluteFill} />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: `rgba(255,255,255,${tintOpacity})` }]} />
          </>
        )}
        {edge ? (
          <View
            style={[StyleSheet.absoluteFill, styles.edge, radius != null && { borderRadius: radius }]}
          />
        ) : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  /** The shell keeps caller layout/radius; the clip layer holds blur + tint so shadows aren't cut off. */
  shell: { backgroundColor: 'transparent' },
  clip: { overflow: 'hidden' },
  solid: { backgroundColor: 'rgba(255,255,255,0.97)' },
  edge: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.65)' },
});
