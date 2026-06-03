import { LinearGradient } from 'expo-linear-gradient';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, fonts, gradients, premium, radius, shadows, spacing } from '@/constants/theme';

interface ButtonProps extends PressableProps {
  title: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'sky' | 'premium' | 'gold';
  style?: StyleProp<ViewStyle>;
}

export function Button({
  title,
  loading,
  variant = 'primary',
  disabled,
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  if (variant === 'premium') {
    return (
      <Pressable disabled={isDisabled} style={[styles.wrap, style]} {...props}>
        {({ pressed }) => (
          <View style={[styles.premiumWrap, isDisabled && styles.disabled]}>
            <LinearGradient
              colors={[...gradients.premiumHero]}
              style={[
                styles.premium,
                pressed && !isDisabled && styles.pressed,
              ]}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.primaryText}>{title}</Text>
              )}
            </LinearGradient>
          </View>
        )}
      </Pressable>
    );
  }

  if (variant === 'gold') {
    return (
      <Pressable disabled={isDisabled} style={[styles.wrap, style]} {...props}>
        {({ pressed }) => (
          <LinearGradient
            colors={[...gradients.goldCta]}
            style={[
              styles.gold,
              pressed && !isDisabled && styles.pressed,
              isDisabled && styles.disabled,
            ]}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.goldTextLight}>{title}</Text>
            )}
          </LinearGradient>
        )}
      </Pressable>
    );
  }

  if (variant === 'primary') {
    return (
      <Pressable disabled={isDisabled} style={[styles.wrap, style]} {...props}>
        {({ pressed }) => (
          <LinearGradient
            colors={[...gradients.primary]}
            style={[styles.primary, pressed && !isDisabled && styles.pressed, isDisabled && styles.disabled]}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.primaryText}>{title}</Text>
            )}
          </LinearGradient>
        )}
      </Pressable>
    );
  }

  if (variant === 'secondary') {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.base,
          styles.secondary,
          pressed && !isDisabled ? styles.pressed : null,
          isDisabled ? styles.disabled : null,
          style,
        ]}
        disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <ActivityIndicator color={colors.secondaryDark} />
        ) : (
          <Text style={styles.textSecondary}>{title}</Text>
        )}
      </Pressable>
    );
  }

  if (variant === 'sky') {
    return (
      <Pressable disabled={isDisabled} style={[styles.wrap, style]} {...props}>
        {({ pressed }) => (
          <LinearGradient
            colors={[...gradients.secondary]}
            style={[
              styles.primary,
              variant === 'sky' && styles.sky,
              pressed && !isDisabled && styles.pressed,
              isDisabled && styles.disabled,
            ]}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.primaryText}>{title}</Text>
            )}
          </LinearGradient>
        )}
      </Pressable>
    );
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        variant === 'danger' && styles.danger,
        pressed && !isDisabled ? styles.pressed : null,
        isDisabled ? styles.disabled : null,
        style,
      ]}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={colors.white} />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  primary: {
    minHeight: 54,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...shadows.card,
  },
  sky: { minHeight: 46, borderRadius: radius.md, paddingVertical: spacing.sm },
  premiumWrap: {
    borderRadius: radius.lg + 2,
    borderWidth: 2,
    borderColor: 'rgba(182,132,28,0.35)',
    ...shadows.hero,
  },
  premium: {
    minHeight: 56,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  gold: {
    minHeight: 54,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...shadows.elevated,
  },
  goldTextLight: { color: colors.white, fontSize: 15, fontFamily: fonts.display },
  base: {
    minHeight: 54,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondary: {
    backgroundColor: colors.secondarySoft,
    borderWidth: 1.5,
    borderColor: colors.secondaryDark,
    ...shadows.card,
  },
  danger: { backgroundColor: colors.error },
  pressed: { opacity: 0.92, transform: [{ scale: 0.985 }] },
  disabled: { opacity: 0.5 },
  primaryText: {
    color: colors.white,
    fontSize: 15,
    fontFamily: fonts.display,
    letterSpacing: 0.2,
  },
  text: { color: colors.white, fontSize: 15, fontFamily: fonts.bodySemi },
  textSecondary: { color: colors.secondaryInk, fontFamily: fonts.display, fontSize: 15 },
});
