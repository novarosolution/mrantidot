import { type ReactNode, type RefObject, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
} from 'react-native';
import { ArrowRight, CircleCheck, Eye, EyeOff, type LucideIcon } from 'lucide-react-native';
import { AuthLoginShell, AuthFormSection, AuthFooterText } from '@/components/kit/auth/AuthScreenKit';
import { colors, fonts, premiumType, spacing, ui } from '@/constants/theme';
import { textInputDefaults, textInputStyles } from '@/components/ui/textInputDefaults';

export type AuthFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  error?: string;
  secure?: boolean;
  optional?: boolean;
  icon?: LucideIcon;
  inputRef?: RefObject<TextInput | null>;
  onSubmitEditing?: () => void;
  returnKeyType?: 'next' | 'go' | 'done';
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'words' | 'sentences';
};

/** Auth field — label above, soft filled input that turns white with a brand outline on focus. */
export function AuthField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secure,
  optional,
  icon: Icon,
  inputRef,
  onSubmitEditing,
  returnKeyType = 'next',
  keyboardType = 'default',
  autoCapitalize = 'none',
}: AuthFieldProps) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const filled = value.trim().length > 0;

  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={[styles.fieldLabel, focused && styles.fieldLabelFocused]}>{label}</Text>
        {optional ? <Text style={styles.optional}>Optional</Text> : null}
      </View>
      <View
        style={[
          styles.fieldCard,
          focused && styles.fieldCardFocused,
          error ? styles.fieldCardError : null,
        ]}
      >
        {Icon ? (
          <Icon
            size={18}
            color={error ? colors.error : focused ? ui.brand : ui.textTertiary}
            strokeWidth={2}
          />
        ) : null}
        <TextInput
          {...textInputDefaults}
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={ui.textTertiary}
          style={[textInputStyles.flex, styles.fieldInput]}
          editable
          autoCapitalize={secure ? 'none' : autoCapitalize}
          keyboardType={keyboardType}
          secureTextEntry={secure === true && !showPassword}
          returnKeyType={returnKeyType}
          blurOnSubmit={returnKeyType !== 'next'}
          onSubmitEditing={onSubmitEditing}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {secure ? (
          <Pressable
            onPress={() => setShowPassword((v) => !v)}
            style={styles.eyeBtn}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            accessibilityState={{ checked: showPassword }}
          >
            {showPassword ? (
              <EyeOff size={19} color={ui.textSecondary} strokeWidth={2} />
            ) : (
              <Eye size={19} color={ui.textSecondary} strokeWidth={2} />
            )}
          </Pressable>
        ) : filled && !error ? (
          <CircleCheck size={18} color={ui.brand} strokeWidth={2.2} />
        ) : null}
      </View>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

/** Solid brand CTA for auth forms — label + arrow, spinner while busy. */
export function AuthPrimaryButton({
  title,
  loadingTitle,
  loading,
  onPress,
}: {
  title: string;
  loadingTitle?: string;
  loading?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ busy: Boolean(loading), disabled: Boolean(loading) }}
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [styles.primary, pressed && !loading && styles.primaryPressed, loading && styles.primaryBusy]}
    >
      {loading ? <ActivityIndicator size="small" color={colors.white} /> : null}
      <Text style={styles.primaryText}>{loading ? loadingTitle ?? 'Please wait…' : title}</Text>
      {!loading ? <ArrowRight size={18} color={colors.white} strokeWidth={2.4} /> : null}
    </Pressable>
  );
}

export function AuthScreenLayout({
  brandName,
  brandTag,
  heading,
  subtitle,
  showBack,
  children,
  footer,
}: {
  brandName: string;
  brandTag?: string;
  heading?: string;
  subtitle?: string;
  showBack?: boolean;
  scroll?: boolean;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <AuthLoginShell
      brandName={brandName?.trim() || 'Mr Antidot'}
      brandTag={brandTag?.trim() || 'Trusted pest control & home services'}
      title={heading?.trim() || 'Welcome'}
      subtitle={subtitle}
      showBack={showBack}
    >
      <AuthFormSection>{children}</AuthFormSection>
      {footer ? <AuthFooterText>{footer}</AuthFooterText> : null}
    </AuthLoginShell>
  );
}

export const authScreenStyles = StyleSheet.create({
  footer: {
    textAlign: 'center',
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: ui.textSecondary,
  },
  footerLink: {
    color: ui.brand,
    fontFamily: fonts.bodyBold,
    fontSize: 14,
  },
  textLink: {
    alignSelf: 'center',
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
  textLinkLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: ui.brand,
  },
});

const styles = StyleSheet.create({
  field: { marginBottom: 16 },
  labelRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 },
  fieldLabel: { fontFamily: fonts.bodySemi, fontSize: 13.5, color: ui.text },
  fieldLabelFocused: { color: ui.brand },
  optional: { fontFamily: fonts.bodyMedium, fontSize: 12, color: ui.textTertiary },
  fieldCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 54,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: ui.surfaceMuted,
    borderWidth: 1.5,
    borderColor: ui.surfaceMuted,
  },
  fieldCardFocused: { backgroundColor: colors.white, borderColor: ui.brand },
  fieldCardError: { backgroundColor: colors.errorBg, borderColor: colors.error },
  fieldInput: {
    ...premiumType.input,
    flex: 1,
    minHeight: 50,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    color: ui.text,
  },
  eyeBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  fieldError: {
    fontFamily: fonts.bodySemi,
    fontSize: 12.5,
    color: colors.error,
    marginTop: 6,
  },
  primary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 56,
    borderRadius: 16,
    backgroundColor: ui.brand,
    shadowColor: ui.brand,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 14,
    elevation: 6,
  },
  primaryPressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  primaryBusy: { opacity: 0.85 },
  primaryText: { fontFamily: fonts.bodyBold, fontSize: 16, letterSpacing: 0.1, color: colors.white },
});
