import { LinearGradient } from 'expo-linear-gradient';
import { type ReactNode } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type PressableStateCallbackType,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { colors, fonts, gradients, premiumType, spacing, buttonTokens, ui } from '@/constants/theme';
import { haptic } from '@/lib/motion';

interface ButtonProps extends PressableProps {
  title: string;
  loading?: boolean;
  /** @default premium */
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'dangerOutline' | 'sky' | 'premium' | 'gold' | 'ghost';
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

const IS_WEB = Platform.OS === 'web';

/** Web (admin): a soft dip while the mouse is over an enabled button (react-native-web reports `hovered`). */
function hoverStyle(state: PressableStateCallbackType, disabled: boolean): StyleProp<ViewStyle> {
  return IS_WEB && !disabled && !state.pressed && (state as { hovered?: boolean }).hovered ? styles.hovered : null;
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
  // Filled (primary) actions get a light tap haptic; quieter variants stay silent.
  const userPress = props.onPress;
  const pressProps: PressableProps =
    userPress && (variant === 'premium' || variant === 'primary' || variant === 'gold')
      ? {
          ...props,
          onPress: (e) => {
            haptic('tap');
            userPress(e);
          },
        }
      : props;
  const shellStyle: StyleProp<ViewStyle> = [fullWidth ? styles.full : styles.inline, style];

  const frame = {
    minHeight: sz.minH,
    borderRadius: sz.radius,
    paddingVertical: size === 'sm' ? 10 : 13,
    paddingHorizontal: sz.padH,
  };

  const labelFont =
    variant === 'premium' || variant === 'gold' || variant === 'primary'
      ? premiumType.button
      : premiumType.buttonAlt;

  const label = (color: string) => (
    <ButtonLabel
      title={title}
      loading={loading}
      color={color}
      fontSize={sz.font}
      textStyle={[labelFont, textStyle]}
    />
  );

  if (variant === 'premium' || variant === 'primary') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        disabled={isDisabled}
        style={(state) => [shellStyle, hoverStyle(state, !!isDisabled)]}
        {...pressProps}
      >
        {({ pressed }) => (
          <ButtonShell pressed={pressed} disabled={!!isDisabled} style={[styles.shadow, { borderRadius: sz.radius }]}>
            <View style={[styles.fill, styles.solid, frame]}>{label(colors.white)}</View>
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
        style={(state) => [shellStyle, hoverStyle(state, !!isDisabled)]}
        {...pressProps}
      >
        {({ pressed }) => (
          <ButtonShell pressed={pressed} disabled={!!isDisabled} style={[styles.shadow, { borderRadius: sz.radius }]}>
            <View style={[styles.fill, styles.solid, frame]}>{label(colors.white)}</View>
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
        style={(state) => [shellStyle, hoverStyle(state, !!isDisabled)]}
        {...pressProps}
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
        style={(state) => [shellStyle, hoverStyle(state, !!isDisabled)]}
        {...pressProps}
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
        style={(state) => [shellStyle, hoverStyle(state, !!isDisabled)]}
        {...pressProps}
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

  if (variant === 'dangerOutline') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        disabled={isDisabled}
        style={(state) => [shellStyle, hoverStyle(state, !!isDisabled)]}
        {...pressProps}
      >
        {({ pressed }) => (
          <ButtonShell
            pressed={pressed}
            disabled={!!isDisabled}
            style={[styles.dangerOutline, frame, pressed && !isDisabled && styles.dangerOutlinePressed]}
          >
            {label(colors.error)}
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
        style={(state) => [
          fullWidth ? styles.full : styles.inline,
          styles.ghost,
          frame,
          state.pressed && !isDisabled && styles.ghostPressed,
          hoverStyle(state, !!isDisabled),
          isDisabled && styles.disabled,
          style,
        ]}
        {...pressProps}
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
      style={(state) => [shellStyle, hoverStyle(state, !!isDisabled)]}
      {...pressProps}
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
  hovered: { opacity: 0.88 },
  full: { width: '100%' },
  inline: { alignSelf: 'flex-start' },
  label: {
    fontFamily: fonts.bodySemi,
    letterSpacing: 0.25,
    textAlign: 'center',
  },
  fill: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  /** Solid brand fill — flat, premium primary action (no gloss). */
  solid: { backgroundColor: ui.brand },
  shadow: {
    shadowColor: '#0B140F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  secondary: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ui.brandSoft,
  },
  secondaryPressed: {
    backgroundColor: '#DCEEDE',
  },
  outline: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.border,
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
  /** Secondary destructive action — sits beside a primary Save without shouting. */
  dangerOutline: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: 'rgba(179,63,40,0.4)',
  },
  dangerOutlinePressed: { backgroundColor: colors.errorBg },
  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.985 }],
  },
  disabled: {
    opacity: 0.5,
  },
});
