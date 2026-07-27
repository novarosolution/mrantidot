import { forwardRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';
import { colors, fonts, formField, premium, premiumType, shadows, spacing } from '@/constants/theme';
import { textInputDefaults, textInputStyles } from '@/components/ui/textInputDefaults';

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
  containerStyle?: ViewStyle;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  {
    label,
    error,
    hint,
    style,
    containerStyle,
    onFocus,
    onBlur,
    editable = true,
    multiline,
    ...props
  },
  ref,
) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.wrap, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.fieldWrap,
          multiline && styles.fieldWrapMultiline,
          focused && !error && styles.fieldFocused,
          error && styles.fieldError,
        ]}
      >
        <TextInput
          ref={ref}
          {...props}
          {...textInputDefaults}
          style={[textInputStyles.padded, multiline && styles.multiline, style]}
          placeholderTextColor={colors.muted}
          editable={editable}
          multiline={multiline}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
});

Input.displayName = 'Input';

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  label: {
    ...premiumType.label,
    fontSize: formField.labelSize,
    color: colors.ink,
    marginBottom: 8,
  },
  fieldWrap: {
    backgroundColor: formField.bg,
    borderRadius: formField.radius,
    borderWidth: formField.borderWidth,
    borderColor: formField.borderColor,
    minHeight: formField.minHeight,
    justifyContent: 'center',
    ...premium.shadowSoft,
  },
  fieldWrapMultiline: {
    minHeight: 100,
    alignItems: 'stretch',
  },
  fieldFocused: {
    backgroundColor: formField.bgFocus,
    borderColor: formField.borderFocus,
    ...shadows.soft,
  },
  fieldError: {
    backgroundColor: colors.errorBg,
    borderColor: 'rgba(179,63,40,0.35)',
  },
  multiline: {
    minHeight: 88,
    textAlignVertical: 'top',
    paddingTop: 14,
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
