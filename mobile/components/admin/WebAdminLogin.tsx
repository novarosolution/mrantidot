import axios from 'axios';
import { ArrowRight, CircleAlert, Clock3, Eye, EyeOff, KeyRound, Lock, Mail, Smartphone, type LucideIcon } from 'lucide-react-native';
import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { WebAuthFrame } from '@/components/admin/WebAuthFrame';
import { colors, fonts, ui } from '@/constants/theme';
import { DEFAULT_CUSTOMER_UI_COPY } from '@/constants/customerUiCopy';
import { useAppContent } from '@/context/AppContentContext';
import { isWebAdminOnlyError, useAuth } from '@/context/AuthContext';
import { getApiErrorMessage } from '@/lib/api';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { appPush, appReplace, authRoutes, homeRouteForRole } from '@/lib/routes';
import { appToast } from '@/lib/toast';
import { clearSessionExpired, peekSessionExpired, WEB_ADMIN_ONLY_MESSAGE } from '@/lib/webAdmin';

/** A placeholder that only repeats the field label adds nothing — fall back to the built-in example. */
function distinctPlaceholder(placeholder: string, label: string, example: string): string {
  const same = (a: string) => a.trim().toLowerCase() === label.trim().toLowerCase();
  if (!same(placeholder)) return placeholder;
  return same(example) ? '' : example;
}

function firstName(name: string | undefined): string | undefined {
  const trimmed = name?.trim();
  if (!trimmed || trimmed.toLowerCase() === 'customer') return undefined;
  return trimmed.split(' ')[0] ?? trimmed;
}

function LoginField({
  label,
  icon: Icon,
  value,
  onChangeText,
  placeholder,
  error,
  inputRef,
  onSubmit,
  autoComplete,
  secure,
  last,
  trailing,
}: {
  label: string;
  icon: LucideIcon;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  error?: string;
  inputRef: RefObject<TextInput | null>;
  /** Enter key. */
  onSubmit: () => void;
  autoComplete: TextInputProps['autoComplete'];
  secure?: boolean;
  /** Last field: Enter signs in. */
  last?: boolean;
  trailing?: ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  const tint = error ? colors.error : focused ? colors.forest : ui.textTertiary;
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, focused && styles.fieldLabelFocused]}>{label}</Text>
      <View style={[styles.inputShell, focused && styles.inputShellFocused, error ? styles.inputShellError : null]}>
        <Icon size={18} color={tint} strokeWidth={2} />
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={ui.textTertiary}
          secureTextEntry={secure}
          autoComplete={autoComplete}
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          returnKeyType={last ? 'go' : 'next'}
          onSubmitEditing={onSubmit}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-label={label}
          style={styles.input}
        />
        {trailing}
      </View>
      {error ? (
        <View style={styles.fieldErrorRow} role="alert">
          <CircleAlert size={14} color={colors.error} strokeWidth={2.2} />
          <Text style={styles.fieldError}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

/**
 * Web admin sign-in (web build only — the phone app keeps its own login): split brand panel on wide
 * windows, centred card on narrow ones (WebAuthFrame). Email/phone + password with show/hide, inline
 * errors, Enter to submit, and a "Session expired" notice after a 401 sign-out (lib/api.ts).
 */
export function WebAdminLogin() {
  const { login } = useAuth();
  const { content } = useAppContent();
  const copy = useCustomerUiCopy();
  const brandName = content.branding.name?.trim() || 'Mr Antidot';

  const identifierRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [identifierError, setIdentifierError] = useState<string>();
  const [passwordError, setPasswordError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [expired, setExpired] = useState(peekSessionExpired);
  const [buttonHover, setButtonHover] = useState(false);
  const [eyeHover, setEyeHover] = useState(false);

  useEffect(() => {
    // Shown once: the notice belongs to this visit of the sign-in screen.
    clearSessionExpired();
    const timer = setTimeout(() => identifierRef.current?.focus(), 80);
    return () => clearTimeout(timer);
  }, []);

  const submit = async () => {
    if (loading) return;
    const id = identifier.trim();
    const pass = password.trim();
    const idError = id ? undefined : copy.authRequired;
    const passError = pass ? undefined : copy.authRequired;
    setIdentifierError(idError);
    setPasswordError(passError);
    setFormError(undefined);
    if (idError || passError) {
      (idError ? identifierRef : passwordRef).current?.focus();
      return;
    }

    setLoading(true);
    try {
      const signedIn = await login(id, pass);
      setExpired(false);
      appToast.success(copy.authLoginSuccessToast, firstName(signedIn.name) ?? copy.authSignedInFallback);
      appReplace(homeRouteForRole(signedIn.role));
    } catch (err) {
      if (isWebAdminOnlyError(err)) {
        // Signed in fine, but not an admin — the session was never kept (AuthContext).
        setFormError(err.message);
        return;
      }
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      if (status === 401) {
        setPasswordError(copy.authWrongCredentials);
        passwordRef.current?.focus();
        return;
      }
      setFormError(getApiErrorMessage(err, 'Check your credentials and try again'));
    } finally {
      setLoading(false);
    }
  };

  const onIdentifierSubmit = () => {
    if (identifier.trim() && password.trim()) void submit();
    else passwordRef.current?.focus();
  };

  return (
    <WebAuthFrame brandName={brandName}>
      <Text style={styles.eyebrow}>Admin panel</Text>
      <Text style={styles.title} role="heading">
        Sign in to {brandName}
      </Text>
      <Text style={styles.subtitle}>Use your admin account to manage bookings, the team and the website.</Text>

      {expired ? (
        <View style={styles.notice} role="alert">
          <Clock3 size={18} color={colors.amberInk} strokeWidth={2.2} />
          <View style={styles.noticeText}>
            <Text style={styles.noticeTitle}>Session expired — sign in again</Text>
            <Text style={styles.noticeBody}>You were signed out to keep the account safe.</Text>
          </View>
        </View>
      ) : null}

      {formError ? (
        <View style={[styles.notice, styles.noticeError]} role="alert">
          <CircleAlert size={18} color={colors.error} strokeWidth={2.2} />
          <View style={styles.noticeText}>
            <Text style={[styles.noticeTitle, styles.noticeTitleError]}>{copy.authLoginErrorToast}</Text>
            <Text style={styles.noticeBody}>{formError}</Text>
          </View>
        </View>
      ) : null}

      <View style={styles.form}>
        <LoginField
          label={copy.authFieldIdentifier}
          icon={Mail}
          value={identifier}
          onChangeText={(text) => {
            setIdentifier(text);
            if (identifierError) setIdentifierError(undefined);
            if (formError) setFormError(undefined);
          }}
          placeholder={distinctPlaceholder(
            copy.authLoginEmailPlaceholder,
            copy.authFieldIdentifier,
            DEFAULT_CUSTOMER_UI_COPY.authLoginEmailPlaceholder,
          )}
          error={identifierError}
          inputRef={identifierRef}
          onSubmit={onIdentifierSubmit}
          autoComplete="username"
        />

        <LoginField
          label={copy.authFieldPassword}
          icon={KeyRound}
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            if (passwordError) setPasswordError(undefined);
            if (formError) setFormError(undefined);
          }}
          placeholder={distinctPlaceholder(
            copy.authLoginPasswordPlaceholder,
            copy.authFieldPassword,
            DEFAULT_CUSTOMER_UI_COPY.authLoginPasswordPlaceholder,
          )}
          error={passwordError}
          inputRef={passwordRef}
          onSubmit={() => void submit()}
          autoComplete="current-password"
          secure={!showPassword}
          last
          trailing={
            <Pressable
              onPress={() => setShowPassword((value) => !value)}
              onHoverIn={() => setEyeHover(true)}
              onHoverOut={() => setEyeHover(false)}
              accessibilityRole="button"
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              style={[styles.eyeButton, eyeHover && styles.eyeButtonHover]}
            >
              {showPassword ? (
                <EyeOff size={19} color={ui.textSecondary} strokeWidth={2} />
              ) : (
                <Eye size={19} color={ui.textSecondary} strokeWidth={2} />
              )}
            </Pressable>
          }
        />

        <Text style={styles.forgot}>
          <Text style={styles.forgotStrong}>Forgot password? </Text>
          Ask your primary admin to reset it.
        </Text>

        <Pressable
          onPress={() => void submit()}
          onHoverIn={() => setButtonHover(true)}
          onHoverOut={() => setButtonHover(false)}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel={copy.authLoginButton}
          accessibilityState={{ busy: loading, disabled: loading }}
          style={({ pressed }) => [
            styles.primary,
            buttonHover && !loading && styles.primaryHover,
            pressed && !loading && styles.primaryPressed,
            loading && styles.primaryBusy,
          ]}
        >
          {loading ? <ActivityIndicator size="small" color={colors.white} /> : null}
          <Text style={styles.primaryText}>{loading ? copy.authSigningIn : copy.authLoginButton}</Text>
          {loading ? null : <ArrowRight size={18} color={colors.white} strokeWidth={2.4} />}
        </Pressable>

        {__DEV__ ? (
          <Pressable
            onPress={() => appPush(authRoutes.otp)}
            accessibilityRole="button"
            style={({ pressed }) => [styles.secondary, pressed && styles.primaryPressed]}
          >
            <Smartphone size={17} color={ui.text} strokeWidth={2} />
            <Text style={styles.secondaryText}>{copy.authOtpContinue}</Text>
          </Pressable>
        ) : null}

        <View style={styles.secureRow}>
          <Lock size={12} color={ui.textTertiary} strokeWidth={2.2} />
          <Text style={styles.secureText}>{copy.authSecureNote}</Text>
        </View>
      </View>

      <Text style={styles.footNote}>{WEB_ADMIN_ONLY_MESSAGE}</Text>
    </WebAuthFrame>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: colors.forest,
  },
  title: {
    marginTop: 10,
    fontFamily: fonts.displayExtra,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.7,
    color: ui.text,
  },
  subtitle: { marginTop: 8, fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: ui.textSecondary },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 22,
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.amberBg,
    borderWidth: 1,
    borderColor: 'rgba(154,111,18,0.18)',
  },
  noticeError: { backgroundColor: colors.errorBg, borderColor: 'rgba(179,63,40,0.18)' },
  noticeText: { flex: 1, minWidth: 0 },
  noticeTitle: { fontFamily: fonts.bodyBold, fontSize: 14, lineHeight: 19, color: colors.amberInk },
  noticeTitleError: { color: colors.error },
  noticeBody: { marginTop: 2, fontFamily: fonts.body, fontSize: 13.5, lineHeight: 19, color: ui.textSecondary },
  form: { marginTop: 26, gap: 18 },
  field: { gap: 8 },
  fieldLabel: { fontFamily: fonts.bodySemi, fontSize: 13.5, color: ui.text },
  fieldLabelFocused: { color: colors.forest },
  inputShell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 52,
    paddingLeft: 14,
    paddingRight: 4,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: ui.border,
    backgroundColor: ui.surfaceMuted,
  },
  inputShellFocused: {
    borderColor: colors.forest,
    backgroundColor: colors.white,
    shadowColor: colors.forest,
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  inputShellError: { borderColor: colors.error, backgroundColor: colors.white },
  input: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    fontFamily: fonts.body,
    fontSize: 15.5,
    color: ui.text,
    paddingVertical: 0,
    // The shell draws the focus state.
    outlineWidth: 0,
  },
  eyeButton: { width: 44, height: 44, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  eyeButtonHover: { backgroundColor: ui.hairline },
  fieldErrorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  fieldError: { flex: 1, fontFamily: fonts.bodySemi, fontSize: 13, color: colors.error },
  forgot: { marginTop: -4, fontFamily: fonts.body, fontSize: 13.5, lineHeight: 19, color: ui.textSecondary },
  forgotStrong: { fontFamily: fonts.bodyBold, color: ui.text },
  primary: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 14,
    backgroundColor: colors.forest,
    shadowColor: colors.forest,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
  },
  primaryHover: { backgroundColor: colors.headerDeep },
  primaryPressed: { opacity: 0.9 },
  primaryBusy: { opacity: 0.85 },
  primaryText: { fontFamily: fonts.bodyBold, fontSize: 15.5, letterSpacing: -0.1, color: colors.white },
  secondary: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: colors.white,
  },
  secondaryText: { fontFamily: fonts.bodyBold, fontSize: 14.5, color: ui.text },
  secureRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  secureText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: ui.textTertiary },
  footNote: {
    marginTop: 28,
    paddingTop: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ui.border,
    fontFamily: fonts.body,
    fontSize: 12.5,
    lineHeight: 18,
    color: ui.textTertiary,
    textAlign: 'center',
  },
});
