import { Pressable, StyleSheet, View, type PressableProps, type ViewStyle } from 'react-native';
import { classic, colors, premium, radius, shadows, spacing, surfaces } from '@/constants/theme';

interface CardProps extends PressableProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'premium' | 'glass' | 'classic';
}

export function Card({ children, style, variant = 'default', onPress, ...props }: CardProps) {
  const variantStyle =
    variant === 'premium'
      ? styles.premium
      : variant === 'classic'
        ? styles.classic
        : variant === 'glass'
          ? styles.glass
          : styles.card;
  const baseStyle = [variantStyle, style];
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
    ...premium.shadowSoft,
  },
  premium: {
    backgroundColor: colors.white,
    borderRadius: premium.radiusCard,
    padding: spacing.md,
    ...premium.shadowSoft,
  },
  classic: {
    backgroundColor: colors.white,
    borderRadius: premium.radiusCard,
    padding: spacing.md,
    borderTopWidth: 3,
    borderTopColor: premium.accentGold,
    ...premium.shadowSoft,
  },
  glass: {
    backgroundColor: surfaces.glass,
    borderRadius: premium.radiusCard,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: surfaces.glassBorder,
    ...shadows.card,
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.995 }] },
});
