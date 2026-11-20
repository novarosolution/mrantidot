import { Link } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Smartphone } from 'lucide-react-native';
import { AppIcons } from '@/constants/appIcons';
import {
  AuthFooterText,
  AuthFormSection,
  AuthLoginShell,
  AuthSecureNote,
} from '@/components/kit/auth/AuthScreenKit';
import { AuthField, AuthPrimaryButton, authScreenStyles } from '@/components/kit/auth/AuthScreenLayout';
import { useAuth } from '@/context/AuthContext';
import { useAppContent } from '@/context/AppContentContext';
import { getApiErrorMessage } from '@/lib/api';
import { appPush, appReplace, authRoutes, customerRoutes, homeRouteForRole } from '@/lib/routes';
import { isProfileIncomplete } from '@/lib/profile-display';
import { appToast } from '@/lib/toast';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { colors, fonts, ui as themeUi } from '@/constants/theme';
import { DEFAULT_CUSTOMER_UI_COPY, fillCopy } from '@/constants/customerUiCopy';
import { haptic } from '@/lib/motion';

/**
 * A placeholder that only repeats the field label adds nothing — show the built-in example instead
 * (or nothing, if that would repeat the label too).
 */
function distinctPlaceholder(placeholder: string, label: string, example: string): string {
  const same = (a: string) => a.trim().toLowerCase() === label.trim().toLowerCase();
  if (!same(placeholder)) return placeholder;
  return same(example) ? '' : example;
}

export default function LoginScreen() {
  const { login } = useAuth();
  const { content } = useAppContent();
  const ui = useCustomerUiCopy();

  const passwordRef = useRef<TextInput>(null);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [identifierError, setIdentifierError] = useState<string>();
  const [passwordError, setPasswordError] = useState<string>();

  const brandName = content.branding.name?.trim() || 'Mr Antidot';
  const supportContact = useMemo(() => {
    const phone = content.support?.phone?.trim();
    const email = content.support?.email?.trim();
    return phone || email || '';
  }, [content.support?.email, content.support?.phone]);

  const handleLogin = useCallback(async () => {
    if (loading) return;
    const id = identifier.trim();
    const pass = password.trim();
    let valid = true;

    if (!id) {
      setIdentifierError(ui.authRequired);
      valid = false;
    } else {
      setIdentifierError(undefined);
    }

    if (!pass) {
      setPasswordError(ui.authRequired);
      valid = false;
    } else {
      setPasswordError(undefined);
    }

    if (!valid) return;

    setLoading(true);
    try {
      const signedIn = await login(id, pass);
      haptic('success');
      appToast.success(ui.authLoginSuccessToast, displayUserGreeting(signedIn.name, ui.authSignedInFallback));
      if (signedIn.role === 'customer' && isProfileIncomplete(signedIn)) {
        appToast.info(ui.authCompleteProfileTitle, ui.authCompleteProfileBody);
        appReplace(customerRoutes.settings);
        return;
      }
      appReplace(homeRouteForRole(signedIn.role));
    } catch (err) {
      const message = getApiErrorMessage(err, 'Check your credentials and try again');
      haptic('error');
      setPasswordError(message === 'Invalid credentials' ? ui.authWrongCredentials : message);
      appToast.error(ui.authLoginErrorToast, message);
    } finally {
      setLoading(false);
    }
  }, [identifier, loading, login, password, ui]);

  return (
    <>
      <AuthLoginShell
        brandName={brandName}
        brandTag={content.branding.tagline}
        title={ui.authLoginTitle}
        subtitle={ui.authLoginSubtitle}
        compact
      >
        <AuthFormSection>
          <AuthField
            label={ui.authFieldIdentifier}
            value={identifier}
            onChangeText={(text) => {
              setIdentifier(text);
              if (identifierError) setIdentifierError(undefined);
            }}
            placeholder={distinctPlaceholder(
              ui.authLoginEmailPlaceholder,
              ui.authFieldIdentifier,
              DEFAULT_CUSTOMER_UI_COPY.authLoginEmailPlaceholder,
            )}
            error={identifierError}
            icon={AppIcons.ui.mail}
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />

          <AuthField
            label={ui.authFieldPassword}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (passwordError) setPasswordError(undefined);
            }}
            placeholder={distinctPlaceholder(
              ui.authLoginPasswordPlaceholder,
              ui.authFieldPassword,
              DEFAULT_CUSTOMER_UI_COPY.authLoginPasswordPlaceholder,
            )}
            error={passwordError}
            secure
            icon={AppIcons.ui.lock}
            inputRef={passwordRef}
            returnKeyType="go"
            onSubmitEditing={() => void handleLogin()}
          />

          <Pressable
            style={styles.forgotBtn}
            onPress={() => {
              appToast.info(
                ui.authForgotTitle,
                supportContact ? fillCopy(ui.authForgotBody, { contact: supportContact }) : ui.authForgotBodyFallback,
              );
            }}
            hitSlop={8}
          >
            <Text style={styles.forgotText}>{ui.authForgotPassword}</Text>
          </Pressable>

          <AuthPrimaryButton
            title={ui.authLoginButton}
            loadingTitle={ui.authSigningIn}
            loading={loading}
            onPress={() => void handleLogin()}
          />

          {__DEV__ ? (
            <>
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>{ui.authOrDivider}</Text>
                <View style={styles.dividerLine} />
              </View>
              <Pressable
                style={({ pressed }) => [styles.otpBtn, pressed && styles.otpPressed]}
                onPress={() => appPush(authRoutes.otp)}
                accessibilityRole="button"
              >
                <Smartphone size={18} color={themeUi.text} strokeWidth={2} />
                <Text style={styles.otpText}>{ui.authOtpContinue}</Text>
              </Pressable>
            </>
          ) : null}

          <AuthSecureNote text={ui.authSecureNote} />
        </AuthFormSection>

        <AuthFooterText>
          <Text style={authScreenStyles.footer}>{ui.authNewHere} </Text>
          <Link href={authRoutes.register}>
            <Text style={authScreenStyles.footerLink}>{ui.authCreateAccountLink}</Text>
          </Link>
        </AuthFooterText>
      </AuthLoginShell>
    </>
  );
}

function displayUserGreeting(name: string | undefined, fallback: string): string {
  const trimmed = name?.trim();
  if (!trimmed || trimmed.toLowerCase() === 'customer') return fallback;
  return trimmed.split(' ')[0] ?? trimmed;
}

const styles = StyleSheet.create({
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: -6,
    marginBottom: 20,
    paddingVertical: 4,
  },
  forgotText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13.5,
    color: themeUi.brand,
  },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 20 },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: themeUi.border },
  dividerText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: themeUi.textTertiary },
  otpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: themeUi.border,
    backgroundColor: colors.white,
  },
  otpPressed: { backgroundColor: themeUi.surfaceMuted },
  otpText: { fontFamily: fonts.bodyBold, fontSize: 15, color: themeUi.text },
});
