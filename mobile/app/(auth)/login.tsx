import { Link } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import {
  AuthFooterText,
  AuthFormSection,
  AuthLoginShell,
} from '@/components/kit/auth/AuthScreenKit';
import { AuthField, authScreenStyles } from '@/components/kit/auth/AuthScreenLayout';
import { useAuth } from '@/context/AuthContext';
import { useAppContent } from '@/context/AppContentContext';
import { getApiErrorMessage } from '@/lib/api';
import { appPush, appReplace, authRoutes, customerRoutes, homeRouteForRole } from '@/lib/routes';
import { isProfileIncomplete } from '@/lib/profile-display';
import { appToast } from '@/lib/toast';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { spacing, colors, fonts, premium } from '@/constants/theme';

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

  const arrowNudge = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(arrowNudge, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(arrowNudge, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [arrowNudge]);

  const handleLogin = useCallback(async () => {
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
      setPasswordError(message === 'Invalid credentials' ? 'Wrong phone/email or password' : undefined);
      appToast.error(ui.authLoginErrorToast, message);
    } finally {
      setLoading(false);
    }
  }, [identifier, login, password, ui.authLoginErrorToast, ui.authLoginSuccessToast]);

  return (
    <>
      <StatusBar style="light" />
      <AuthLoginShell brandName={brandName} title={ui.authLoginTitle} compact>
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

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={ui.authLoginButton}
            style={({ pressed }) => [pressed && !loading && styles.pressed]}
            onPress={() => void handleLogin()}
            disabled={loading}
          >
            <LinearGradient
              colors={['#3BC45A', '#1A8734', '#0A6423']}
              locations={[0, 0.5, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.cta, loading && styles.ctaLoading]}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.28)', 'rgba(255,255,255,0)']}
                style={styles.ctaSheen}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                pointerEvents="none"
              />
              {loading ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.ctaText}>Signing in…</Text>
                </>
              ) : (
                <>
                  <Text style={styles.ctaText}>{ui.authLoginButton}</Text>
                  <Animated.View
                    style={{
                      transform: [
                        {
                          translateX: arrowNudge.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 3],
                          }),
                        },
                      ],
                    }}
                  >
                    <View style={styles.ctaChip}>
                      <PremiumIcon
                        icon={AppIcons.ui.arrowRight}
                        variant="plain"
                        size={17}
                        color="#0A6423"
                        strokeWidth={2.5}
                      />
                    </View>
                  </Animated.View>
                </>
              )}
            </LinearGradient>
          </Pressable>

          {__DEV__ ? (
            <Pressable
              style={({ pressed }) => [styles.otpBtn, pressed && styles.pressed]}
              onPress={() => appPush(authRoutes.otp)}
            >
              <PremiumIcon
                icon={AppIcons.ui.phone}
                variant="mint"
                size={16}
                color={colors.forest}
                boxSize={40}
              />
              <Text style={styles.otpText}>OTP sign-in</Text>
              <PremiumIcon
                icon={AppIcons.ui.chevronRight}
                variant="plain"
                size={16}
                color={colors.muted}
              />
            </Pressable>
          ) : null}
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
    marginBottom: spacing.md + 4,
    marginTop: -4,
    paddingVertical: 4,
  },
  forgotText: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.forest,
  },
  pressed: { transform: [{ scale: 0.985 }], opacity: 0.95 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 58,
    borderRadius: 20,
    paddingLeft: 22,
    paddingRight: 8,
    paddingVertical: 8,
    overflow: 'hidden',
    ...premium.shadowSoft,
    shadowColor: '#0A6423',
    shadowOpacity: 0.34,
    shadowRadius: 18,
    elevation: 11,
  },
  ctaSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '48%',
  },
  ctaLoading: {
    justifyContent: 'center',
    gap: 10,
    paddingRight: 22,
  },
  ctaText: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    letterSpacing: 0.1,
    color: '#FFFFFF',
  },
  ctaChip: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  otpBtn: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(180,220,165,0.85)',
    paddingHorizontal: 12,
  },
  otpText: {
    flex: 1,
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.ink,
  },
});
