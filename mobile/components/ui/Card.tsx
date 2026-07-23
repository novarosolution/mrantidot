import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { colors, premium, radius, shadows, spacing, surfaces } from '@/constants/theme';

interface CardProps extends PressableProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'premium' | 'glass' | 'classic';
}

function GlassFill({ accent }: { accent?: 'gold' | 'lime' | null }) {
  return (
    <>
      <View style={[styles.glassTint, { backgroundColor: 'rgba(255,255,255,0.96)' }]} pointerEvents="none" />
      <LinearGradient
        colors={['rgba(255,255,255,0.7)', 'rgba(255,255,255,0.08)', 'rgba(234,246,227,0.2)']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        pointerEvents="none"
      />
      {accent ? (
        <LinearGradient
          colors={accent === 'gold' ? ['#27A747', '#1A8734'] : ['#8FD03C', '#27A747']}
          style={styles.accentBar}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          pointerEvents="none"
        />
      ) : null}
    </>
  );
}

export function Card({ children, style, variant = 'glass', onPress, ...props }: CardProps) {
  const isGlass = variant === 'glass' || variant === 'premium' || variant === 'classic';
  const accent = variant === 'premium' ? 'gold' : variant === 'classic' ? 'lime' : null;
  const baseStyle = [isGlass ? styles.glassShell : styles.card, style];

  const body = (
    <>
      {isGlass ? <GlassFill accent={accent} /> : null}
      {children}
    </>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [...baseStyle, pressed && styles.pressed]} {...props}>
        {body}
      </Pressable>
    );
  }
  return <View style={baseStyle}>{body}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...premium.shadowSoft,
  },
  glassShell: {
    borderRadius: premium.radiusCard,
    padding: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
    backgroundColor: 'transparent',
    ...shadows.card,
  },
  glassTint: {
    ...StyleSheet.absoluteFill,
    backgroundColor: surfaces.glassPanelTint,
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    zIndex: 2,
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.995 }] },
});
