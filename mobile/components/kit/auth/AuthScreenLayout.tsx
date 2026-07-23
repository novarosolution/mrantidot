import { LinearGradient } from 'expo-linear-gradient';
import { type ReactNode, type RefObject, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
} from 'react-native';
import { type LucideIcon } from 'lucide-react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { AuthLoginShell, AuthFormSection, AuthFooterText } from '@/components/kit/auth/AuthScreenKit';
import { colors, fonts, premium, premiumType, spacing } from '@/constants/theme';
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

/** Field card: micro-label, soft icon tile, tick when filled, lime focus line. */
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
      <View
        style={[
          styles.fieldCard,
          focused && styles.fieldCardFocused,
          !focused && filled && !error && styles.fieldCardFilled,
          error && styles.fieldCardError,
        ]}
      >
        <Text style={[styles.fieldLabel, focused && styles.fieldLabelFocused]}>
          {label.toUpperCase()}
          {optional ? <Text style={styles.optional}>  ·  OPTIONAL</Text> : null}
        </Text>
        <View style={styles.fieldBody}>
          {Icon ? (
            <View style={[styles.iconTile, focused && styles.iconTileFocused]}>
              <PremiumIcon
                icon={Icon}
                variant="plain"
                size={15}
                color={focused ? '#1A8734' : '#25A443'}
                strokeWidth={2.15}
              />
            </View>
          ) : null}
          <TextInput
            {...textInputDefaults}
            ref={inputRef}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#86AC80"
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
            <Pressable onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn} hitSlop={12}>
              {showPassword ? (
                <PremiumIcon icon={AppIcons.ui.eyeOff} variant="plain" size={17} color="#5C8A63" />
              ) : (
                <PremiumIcon icon={AppIcons.ui.eye} variant="plain" size={17} color="#5C8A63" />
              )}
            </Pressable>
          ) : filled && !error ? (
            <View style={styles.tick}>
              <PremiumIcon icon={AppIcons.ui.check} variant="plain" size={10} color="#FFFFFF" strokeWidth={3.5} />
            </View>
          ) : null}
        </View>
        {focused ? (
          <LinearGradient
            colors={['#8FD03C', '#1A8734']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.fieldLine}
            pointerEvents="none"
          />
        ) : null}
      </View>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
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
    fontSize: 13.5,
    color: '#5C8A63',
  },
  footerLink: {
    color: '#1A8734',
    fontFamily: fonts.bodyBold,
    fontSize: 13.5,
  },
  textLink: {
    alignSelf: 'center',
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
  textLinkLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: '#1A8734',
  },
});

const styles = StyleSheet.create({
  field: {
    marginBottom: spacing.md,
  },
  fieldCard: {
    backgroundColor: 'rgba(255,255,255,0.86)',
    borderWidth: 1,
    borderColor: 'rgba(219,241,209,0.98)',
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 11,
    gap: 4,
    overflow: 'hidden',
  },
  fieldCardFocused: {
    borderColor: 'rgba(143,208,60,0.9)',
    backgroundColor: 'rgba(255,255,255,0.98)',
    ...premium.shadowFocus,
  },
  fieldCardFilled: {
    borderColor: 'rgba(48,184,79,0.48)',
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  fieldCardError: {
    borderColor: colors.error,
    backgroundColor: colors.errorBg,
  },
  fieldLabel: {
    ...premiumType.kicker,
    fontSize: 10,
    letterSpacing: 0.95,
    color: '#7EA484',
    lineHeight: 12,
  },
  fieldLabelFocused: {
    color: colors.forest,
  },
  optional: {
    fontFamily: fonts.bodyMedium,
    color: '#B5CFC0',
    fontSize: 9,
  },
  fieldBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconTile: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#EAF6E3',
    borderWidth: 1,
    borderColor: '#DBF1D1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconTileFocused: {
    backgroundColor: '#D8EEC8',
    borderColor: 'rgba(143,208,60,0.7)',
  },
  fieldInput: {
    ...premiumType.input,
    flex: 1,
    minHeight: 42,
    paddingVertical: Platform.OS === 'ios' ? 9 : 7,
  },
  fieldLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2.5,
  },
  tick: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.green,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#EAF6E3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldError: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: colors.error,
    marginTop: 5,
  },
});
