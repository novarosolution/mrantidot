import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { type ReactNode, type RefObject, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Eye, EyeOff } from 'lucide-react-native';
import { BrandLogo } from '@/components/BrandLogo';
import { colors, fonts, formField, gradients, spacing } from '@/constants/theme';
import { textInputDefaults, textInputStyles } from '@/components/ui/textInputDefaults';

export type AuthFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  error?: string;
  secure?: boolean;
  optional?: boolean;
  inputRef?: RefObject<TextInput | null>;
  onSubmitEditing?: () => void;
  returnKeyType?: 'next' | 'go' | 'done';
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'words' | 'sentences';
};

export function AuthField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secure,
  optional,
  inputRef,
  onSubmitEditing,
  returnKeyType = 'next',
  keyboardType = 'default',
  autoCapitalize = 'none',
}: AuthFieldProps) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>
        {label}
        {optional ? <Text style={styles.optional}> (optional)</Text> : null}
      </Text>
      <View style={[styles.fieldRow, focused && styles.fieldRowFocused, error && styles.fieldRowError]}>
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          style={[textInputStyles.flex, styles.fieldInput]}
          editable
          {...textInputDefaults}
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
          <Pressable onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn} hitSlop={12}>
            {showPassword ? <EyeOff size={18} color={colors.muted} /> : <Eye size={18} color={colors.muted} />}
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

export function AuthScreenLayout({
  brandName,
  heading,
  showBack,
  scroll,
  children,
  footer,
}: {
  brandName: string;
  heading?: string;
  showBack?: boolean;
  scroll?: boolean;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const insets = useSafeAreaInsets();

  const body = (
    <>
      {children}
      {footer}
    </>
  );

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[...gradients.premiumHero]}
        style={[styles.hero, { paddingTop: insets.top + (showBack ? spacing.sm : spacing.lg) }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {showBack ? (
          <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
            <ChevronLeft size={22} color={colors.white} />
          </Pressable>
        ) : null}
        <View style={styles.heroInner} pointerEvents="none">
          <BrandLogo size={showBack ? 48 : 56} />
          <Text style={styles.brandName}>{brandName}</Text>
          {heading ? <Text style={styles.heading}>{heading}</Text> : null}
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.formArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 4 : 0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.formInner,
            { paddingBottom: insets.bottom + spacing.xl },
            !scroll && styles.formInnerStatic,
          ]}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          scrollEnabled={scroll !== false}
        >
          {body}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

export const authScreenStyles = StyleSheet.create({
  footer: {
    textAlign: 'center',
    marginTop: spacing.xl,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.muted,
  },
  footerLink: {
    color: colors.forest,
    fontFamily: fonts.bodySemi,
  },
  textLink: {
    alignSelf: 'center',
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
  textLinkLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.forest,
  },
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  hero: {
    paddingBottom: spacing.xl + 8,
    paddingHorizontal: spacing.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  heroInner: {
    alignItems: 'center',
    gap: 6,
  },
  brandName: {
    fontFamily: fonts.displayExtra,
    fontSize: 22,
    color: colors.white,
    letterSpacing: -0.3,
  },
  heading: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  formArea: {
    flex: 1,
    marginTop: -20,
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  scroll: { flex: 1 },
  formInner: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  formInnerStatic: {
    flexGrow: 1,
  },
  field: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.ink,
    marginBottom: 6,
  },
  optional: {
    fontFamily: fonts.body,
    color: colors.muted,
    fontSize: 12,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: formField.minHeight,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    borderRadius: formField.radius,
    paddingHorizontal: spacing.md,
  },
  fieldRowFocused: {
    borderColor: colors.forest,
    backgroundColor: colors.white,
  },
  fieldRowError: {
    borderColor: colors.error,
    backgroundColor: colors.errorBg,
  },
  fieldInput: {
    flex: 1,
  },
  eyeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -4,
  },
  fieldError: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
  },
});
