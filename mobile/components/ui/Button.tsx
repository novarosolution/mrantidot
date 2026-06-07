import { LinearGradient } from 'expo-linear-gradient';
import { type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { colors, fonts, gradients, premium, spacing, buttonTokens } from '@/constants/theme';

interface ButtonProps extends PressableProps {
  title: string;
  loading?: boolean;
  /** @default premium */
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'sky' | 'premium' | 'gold' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const SIZE = {
  sm: { minH: buttonTokens.heightSm, padH: spacing.md, font: 14, radius: 14 },
  md: { minH: buttonTokens.heightMd, padH: spacing.lg, font: 14, radius: buttonTokens.radius },
  lg: { minH: buttonTokens.heightLg, padH: spacing.lg, font: 15, radius: buttonTokens.radius },
};

function ButtonLabel({
  title,
  loading,
  color,
  fontSize,
  textStyle,
}: {
  title: string;
  loading?: boolean;
  color: string;
  fontSize: number;
  textStyle?: StyleProp<TextStyle>;
}) {
  if (loading) return <ActivityIndicator color={color} />;
  return (
    <Text style={[styles.label, { color, fontSize }, textStyle]} numberOfLines={1}>
      {title}
    </Text>
  );
}

function ButtonShell({
  children,
  pressed,
  disabled,
  style,
}: {
  children: ReactNode;
  pressed: boolean;
  disabled: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[style, pressed && !disabled && styles.pressed, disabled && styles.disabled]}>
      {children}
    </View>
  );
}

export function Button({
  title,
  loading,
  variant = 'premium',
  size = 'lg',
  fullWidth = true,
  disabled,
  style,
  textStyle,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const sz = SIZE[size];
  const shellStyle: StyleProp<ViewStyle> = [fullWidth ? styles.full : styles.inline, style];

  const frame = {
    minHeight: sz.minH,
    borderRadius: sz.radius,
    paddingVertical: size === 'sm' ? 10 : 13,
    paddingHorizontal: sz.padH,
  };

  const label = (color: string) => (
    <ButtonLabel title={title} loading={loading} color={color} fontSize={sz.font} textStyle={textStyle} />
  );

  if (variant === 'premium' || variant === 'primary') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        disabled={isDisabled}
        style={shellStyle}
        {...props}
      >
        {({ pressed }) => (
          <ButtonShell pressed={pressed} disabled={!!isDisabled} style={[styles.shadow, { borderRadius: sz.radius }]}>
            <LinearGradient
              colors={['#33C76A', '#1E8E4E', '#14532D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.fill, frame]}
            >
              <View style={styles.sheen} pointerEvents="none" />
              {label(colors.white)}
            </LinearGradient>
          </ButtonShell>
        )}
      </Pressable>
    );
  }

  if (variant === 'gold') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        disabled={isDisabled}
        style={shellStyle}
        {...props}
      >
        {({ pressed }) => (
          <ButtonShell pressed={pressed} disabled={!!isDisabled} style={[styles.shadow, { borderRadius: sz.radius }]}>
            <LinearGradient
              colors={[...gradients.goldCta]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.fill, frame]}
            >
              {label(colors.white)}
            </LinearGradient>
          </ButtonShell>
        )}
      </Pressable>
    );
  }

  if (variant === 'sky') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        disabled={isDisabled}
        style={shellStyle}
        {...props}
      >
        {({ pressed }) => (
          <ButtonShell pressed={pressed} disabled={!!isDisabled}>
            <LinearGradient
              colors={[...gradients.secondary]}
              style={[styles.fill, frame, styles.shadow, { borderRadius: sz.radius }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {label(colors.white)}
            </LinearGradient>
          </ButtonShell>
        )}
      </Pressable>
    );
  }

  if (variant === 'secondary') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        disabled={isDisabled}
        style={shellStyle}
        {...props}
      >
        {({ pressed }) => (
          <ButtonShell
            pressed={pressed}
            disabled={!!isDisabled}
            style={[styles.secondary, frame, pressed && !isDisabled && styles.secondaryPressed]}
          >
            {label(colors.forest)}
          </ButtonShell>
        )}
      </Pressable>
    );
  }

  if (variant === 'outline') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        disabled={isDisabled}
        style={shellStyle}
        {...props}
      >
        {({ pressed }) => (
          <ButtonShell
            pressed={pressed}
            disabled={!!isDisabled}
            style={[styles.outline, frame, pressed && !isDisabled && styles.outlinePressed]}
          >
            {label(colors.forest)}
          </ButtonShell>
        )}
      </Pressable>
    );
  }

  if (variant === 'ghost') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        disabled={isDisabled}
        style={({ pressed }) => [
          fullWidth ? styles.full : styles.inline,
          styles.ghost,
          frame,
          pressed && !isDisabled && styles.ghostPressed,
          isDisabled && styles.disabled,
          style,
        ]}
        {...props}
      >
        {label(colors.forest)}
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={shellStyle}
      {...props}
    >
      {({ pressed }) => (
        <ButtonShell
          pressed={pressed}
          disabled={!!isDisabled}
          style={[styles.danger, frame, styles.shadow, { borderRadius: sz.radius }]}
        >
          {label(colors.white)}
        </ButtonShell>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  full: { width: '100%' },
  inline: { alignSelf: 'flex-start' },
  label: {
    fontFamily: fonts.bodySemi,
    letterSpacing: 0.15,
    textAlign: 'center',
  },
  fill: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '42%',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  shadow: {
    ...premium.shadowSoft,
  },
  secondary: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.soft,
  },
  secondaryPressed: {
    backgroundColor: '#DCEEDE',
  },
  outline: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  outlinePressed: {
    backgroundColor: colors.soft,
  },
  ghost: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  ghostPressed: {
    backgroundColor: 'rgba(20,83,45,0.06)',
  },
  danger: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.5,
  },
});
