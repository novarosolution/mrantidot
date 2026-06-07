import { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { colors, fonts, formField, spacing } from '@/constants/theme';
import { stripConflictingInputProps, textInputDefaults, textInputStyles } from '@/components/ui/textInputDefaults';

export const IconInput = forwardRef<
  TextInput,
  TextInputProps & {
    label: string;
    leftIcon?: React.ReactNode;
    secure?: boolean;
    secureTextEntry?: boolean;
    error?: string;
    hint?: string;
    containerStyle?: ViewStyle;
  }
>(function IconInput(
  {
    label,
    leftIcon,
    secure,
    secureTextEntry,
    error,
    hint,
    containerStyle,
    onFocus,
    onBlur,
    style: inputStyle,
    editable = true,
    autoCapitalize,
    autoCorrect,
    multiline,
    ...props
  },
  ref,
) {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  const isSecureField = secure === true || secureTextEntry === true;
  const isSecure = isSecureField && !show;
  const safeProps = stripConflictingInputProps(props, { secure: isSecureField });

  return (
    <View style={[styles.wrap, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.row,
          multiline && styles.rowMultiline,
          focused && !error && styles.rowFocused,
          error && styles.rowError,
        ]}
      >
        {leftIcon ? <View style={[styles.iconTile, focused && styles.iconTileFocused]}>{leftIcon}</View> : null}
        <TextInput
          ref={ref}
          {...safeProps}
          {...textInputDefaults}
          style={[textInputStyles.flex, multiline && styles.multiline, inputStyle]}
          placeholderTextColor={colors.muted}
          editable={editable}
          multiline={multiline}
          secureTextEntry={isSecure}
          autoCapitalize={isSecureField ? 'none' : autoCapitalize}
          autoCorrect={isSecureField ? false : autoCorrect}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
        />
        {isSecureField ? (
          <Pressable onPress={() => setShow((s) => !s)} style={styles.eye} hitSlop={12}>
            {show ? <EyeOff size={18} color={colors.muted} /> : <Eye size={18} color={colors.muted} />}
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
});

IconInput.displayName = 'IconInput';

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  label: {
    fontFamily: fonts.bodySemi,
    fontSize: formField.labelSize,
    color: colors.ink,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: formField.minHeight,
    backgroundColor: formField.bgMuted,
    borderRadius: formField.radius,
    paddingRight: spacing.sm,
    paddingLeft: spacing.sm,
  },
  rowMultiline: {
    alignItems: 'flex-start',
    minHeight: 100,
    paddingTop: spacing.sm,
  },
  rowFocused: {
    backgroundColor: formField.bg,
  },
  rowError: {
    backgroundColor: colors.errorBg,
  },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  iconTileFocused: {
    backgroundColor: '#E8F5EC',
  },
  multiline: {
    minHeight: 88,
    textAlignVertical: 'top',
    paddingTop: 4,
  },
  eye: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.muted,
    marginTop: spacing.xs,
    lineHeight: 15,
  },
  error: {
    color: colors.error,
    fontSize: 12,
    marginTop: spacing.xs,
    fontFamily: fonts.bodySemi,
  },
});
