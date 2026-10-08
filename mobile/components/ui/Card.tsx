import { Pressable, StyleSheet, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { colors, premium, radius, spacing, ui } from '@/constants/theme';

interface CardProps extends PressableProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** All variants share the white premium card; kept for older call sites. */
  variant?: 'default' | 'premium' | 'glass' | 'classic';
}

/** White card with a hairline border — the premium (Urban-style) surface used across screens. */
export function Card({ children, style, variant = 'glass', onPress, ...props }: CardProps) {
  const baseStyle = [variant === 'default' ? styles.card : styles.outlined, style];

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [...baseStyle, pressed && styles.pressed]} {...props}>
        {children}
      </Pressable>
    );
  }
  return <View style={baseStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...ui.shadow,
  },
  outlined: {
    borderRadius: premium.radiusCard,
    padding: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: ui.hairline,
    backgroundColor: colors.white,
  },
  pressed: { opacity: 0.88 },
});
