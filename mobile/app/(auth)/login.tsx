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
      setIdentifierError('Required');
      valid = false;
    } else {
      setIdentifierError(undefined);
    }

    if (!pass) {
      setPasswordError('Required');
      valid = false;
    } else {
      setPasswordError(undefined);
    }

    if (!valid) return;

    setLoading(true);
    try {
      const signedIn = await login(id, pass);
      appToast.success(ui.authLoginSuccessToast, displayUserGreeting(signedIn.name));
      if (signedIn.role === 'customer' && isProfileIncomplete(signedIn)) {
        appToast.info('Complete your profile', 'Add your name and email to finish setup.');
        appReplace(customerRoutes.settings);
        return;
      }
      appReplace(homeRouteForRole(signedIn.role));
    } catch (err) {
      const message = getApiErrorMessage(err, 'Check your credentials and try again');
      setPasswordError(message === 'Invalid credentials' ? 'Wrong phone/email or password' : message);
      appToast.error(ui.authLoginErrorToast, message);
    } finally {
      setLoading(false);
    }
  }, [identifier, loading, login, password, ui.authLoginErrorToast, ui.authLoginSuccessToast]);

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
            label="Email or phone"
            value={identifier}
            onChangeText={(text) => {
              setIdentifier(text);
              if (identifierError) setIdentifierError(undefined);
            }}
            placeholder={ui.authLoginEmailPlaceholder}
            error={identifierError}
            icon={AppIcons.ui.mail}
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />

          <AuthField
            label="Password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (passwordError) setPasswordError(undefined);
            }}
            placeholder={ui.authLoginPasswordPlaceholder}
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
                'Password reset',
                supportContact
                  ? `Contact support: ${supportContact}`
                  : 'Contact support from Help in the app.',
              );
            }}
            hitSlop={8}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </Pressable>

          <AuthPrimaryButton
            title={ui.authLoginButton}
            loadingTitle="Signing in…"
            loading={loading}
            onPress={() => void handleLogin()}
          />

          {__DEV__ ? (
            <>
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>
              <Pressable
                style={({ pressed }) => [styles.otpBtn, pressed && styles.otpPressed]}
                onPress={() => appPush(authRoutes.otp)}
                accessibilityRole="button"
              >
                <Smartphone size={18} color={themeUi.text} strokeWidth={2} />
                <Text style={styles.otpText}>Continue with OTP</Text>
              </Pressable>
            </>
          ) : null}

          <AuthSecureNote />
        </AuthFormSection>

        <AuthFooterText>
          <Text style={authScreenStyles.footer}>New here? </Text>
          <Link href={authRoutes.register}>
            <Text style={authScreenStyles.footerLink}>Create account</Text>
          </Link>
        </AuthFooterText>
      </AuthLoginShell>
    </>
  );
}

function displayUserGreeting(name?: string): string {
  const trimmed = name?.trim();
  if (!trimmed || trimmed.toLowerCase() === 'customer') return 'Signed in successfully';
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
