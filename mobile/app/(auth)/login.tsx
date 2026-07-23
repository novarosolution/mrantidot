import { Link } from 'expo-router';
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  AuthSecureNote,
} from '@/components/kit/auth/AuthScreenKit';
import { AuthField, authScreenStyles } from '@/components/kit/auth/AuthScreenLayout';
import { useAuth } from '@/context/AuthContext';
import { useAppContent } from '@/context/AppContentContext';
import { getApiErrorMessage } from '@/lib/api';
import { appPush, appReplace, authRoutes, customerRoutes, homeRouteForRole } from '@/lib/routes';
import { isProfileIncomplete } from '@/lib/profile-display';
import { appToast } from '@/lib/toast';
import { useBrandFill, useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { spacing, colors, fonts, premium, premiumType } from '@/constants/theme';

/** One-shot staggered fade-in. Opacity only — transforms break TextInput touch/focus. */
function FadeIn({ delay = 0, children }: { delay?: number; children: ReactNode }) {
  const v = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(v, {
      toValue: 1,
      duration: 460,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [v, delay]);

  return <Animated.View style={{ opacity: v }}>{children}</Animated.View>;
}

export default function LoginScreen() {
  const { login } = useAuth();
  const { content } = useAppContent();
  const ui = useCustomerUiCopy();
  const { fill } = useBrandFill();

  const passwordRef = useRef<TextInput>(null);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [identifierError, setIdentifierError] = useState<string>();
  const [passwordError, setPasswordError] = useState<string>();

  const brandName = content.branding.name?.trim() || 'Mr Antidot';
  const brandTag = content.branding.tagline?.trim() || 'Trusted pest control & home services';
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
          duration: 950,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(arrowNudge, {
          toValue: 0,
          duration: 950,
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
      <AuthLoginShell
        brandName={brandName}
        brandTag={brandTag}
        title={ui.authLoginTitle}
        subtitle={fill(ui.authLoginSubtitle)}
      >
        <AuthFormSection>
          <FadeIn>
            <View style={styles.formIntro}>
              <Text style={styles.formKicker}>Account</Text>
              <Text style={styles.formTitle}>Sign in to continue</Text>
            </View>
          </FadeIn>

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

          <FadeIn delay={120}>
            <Pressable
              style={styles.forgotBtn}
              onPress={() => {
                appToast.info(
                  'Password reset',
                  supportContact
                    ? `Contact support: ${supportContact}`
                    : 'Use OTP sign-in, or contact support from Help.',
                );
              }}
              hitSlop={8}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>
          </FadeIn>

          <FadeIn delay={180}>
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
                  colors={['rgba(255,255,255,0.26)', 'rgba(255,255,255,0)']}
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
                      <LinearGradient
                        colors={['#FFFFFF', '#F2FAEE']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.ctaChip}
                      >
                        <PremiumIcon
                          icon={AppIcons.ui.arrowRight}
                          variant="plain"
                          size={17}
                          color="#0A6423"
                          strokeWidth={2.5}
                        />
                      </LinearGradient>
                    </Animated.View>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </FadeIn>

          {__DEV__ ? (
            <FadeIn delay={240}>
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or continue with</Text>
                <View style={styles.dividerLine} />
              </View>

              <Pressable
                style={({ pressed }) => [styles.otpBtn, pressed && styles.pressed]}
                onPress={() => appPush(authRoutes.otp)}
              >
                <LinearGradient colors={['#FFFFFF', '#F2FAEE']} style={styles.otpDot}>
                  <PremiumIcon
                    icon={AppIcons.ui.phone}
                    variant="plain"
                    size={16}
                    color="#1A8734"
                    strokeWidth={2.15}
                  />
                </LinearGradient>
                <View style={styles.otpCopy}>
                  <Text style={styles.otpText}>Sign in with OTP</Text>
                  <Text style={styles.otpHint}>Dev mock code 4700</Text>
                </View>
                <View style={styles.otpArrow}>
                  <PremiumIcon
                    icon={AppIcons.ui.chevronRight}
                    variant="plain"
                    size={16}
                    color="#1A8734"
                    strokeWidth={2.4}
                  />
                </View>
              </Pressable>
            </FadeIn>
          ) : null}

          <FadeIn delay={300}>
            <AuthSecureNote text="Secure encrypted sign-in" />
          </FadeIn>
        </AuthFormSection>

        <FadeIn delay={360}>
          <AuthFooterText>
            <Text style={authScreenStyles.footer}>No account? </Text>
            <Link href={authRoutes.register}>
              <Text style={authScreenStyles.footerLink}>Create one free →</Text>
            </Link>
          </AuthFooterText>
        </FadeIn>
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
  formIntro: {
    marginBottom: spacing.md + 2,
    gap: 4,
  },
  formKicker: {
    ...premiumType.kicker,
    fontSize: 10.5,
    letterSpacing: 1.1,
    color: '#6F9A74',
  },
  formTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    letterSpacing: -0.3,
    color: '#0B2213',
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: spacing.md + 2,
    marginTop: -2,
    paddingVertical: 2,
    paddingHorizontal: 2,
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
    minHeight: 60,
    borderRadius: 22,
    paddingLeft: 22,
    paddingRight: 7,
    paddingVertical: 7,
    overflow: 'hidden',
    ...premium.shadowSoft,
    shadowColor: '#0A6423',
    shadowOpacity: 0.36,
    shadowRadius: 20,
    elevation: 12,
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
    ...premiumType.button,
    fontSize: 16.5,
    letterSpacing: 0.15,
    color: '#FFFFFF',
  },
  ctaChip: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(26,135,52,0.22)',
  },
  dividerText: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    letterSpacing: 0.2,
    color: '#86AC80',
  },
  otpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 66,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(143,208,60,0.55)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...premium.shadowSoft,
    shadowOpacity: 0.08,
  },
  otpDot: {
    width: 44,
    height: 44,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#DBF1D1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpCopy: { flex: 1, minWidth: 0, gap: 2 },
  otpText: {
    fontFamily: fonts.bodyBold,
    fontSize: 14.5,
    color: '#0B2213',
  },
  otpHint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: '#5C8A63',
  },
  otpArrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#EAF6E3',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
