import { Link, Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Smartphone } from 'lucide-react-native';
import { AuthSecureNote } from '@/components/kit/auth/AuthScreenKit';
import { AuthField, AuthPrimaryButton, AuthScreenLayout, authScreenStyles } from '@/components/kit/auth/AuthScreenLayout';
import { OtpBoxes } from '@/components/kit/OtpBoxes';
import { useAuth } from '@/context/AuthContext';
import { useAppContent } from '@/context/AppContentContext';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { fillCopy } from '@/constants/customerUiCopy';
import { api, getApiErrorMessage } from '@/lib/api';
import { formatLoginIdentifier } from '@/lib/phone';
import { appToast } from '@/lib/toast';
import { appReplace, authRoutes, customerRoutes, homeRouteForRole } from '@/lib/routes';
import { isProfileIncomplete } from '@/lib/profile-display';
import { colors, fonts, ui as themeUi } from '@/constants/theme';

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return phone;
  return `••••• ••${digits.slice(-3)}`;
}

export default function OtpScreen() {
  if (!__DEV__) {
    return <Redirect href={authRoutes.login} />;
  }

  return <OtpScreenBody />;
}

function OtpScreenBody() {
  const { otpVerify } = useAuth();
  const { content } = useAppContent();
  const ui = useCustomerUiCopy();

  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [phoneError, setPhoneError] = useState<string>();
  const [codeError, setCodeError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    if (timer <= 0) return;
    const t = setInterval(() => setTimer((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [timer]);

  async function sendOtp() {
    const normalized = formatLoginIdentifier(phone);
    if (!normalized) {
      setPhoneError(ui.authRequired);
      return;
    }
    if (normalized.length < 10) {
      setPhoneError(ui.otpInvalidPhone);
      return;
    }
    setPhoneError(undefined);
    setSending(true);
    try {
      await api.post('/auth/otp/send', { phone: normalized }, { skipErrorToast: true });
      // Dev mock OTP — no SMS provider is wired yet
      appToast.success('Use code 4700', `Enter 4700 for ${maskPhone(normalized)}`);
      setSentTo(normalized);
      setPhone(normalized);
      setTimer(30);
      setCode('');
      setCodeError(undefined);
    } catch (err) {
      appToast.error(ui.otpSendFailed, getApiErrorMessage(err, ui.otpSendFailedSub));
    } finally {
      setSending(false);
    }
  }

  async function verify() {
    const normalizedPhone = formatLoginIdentifier(phone);
    const trimmedCode = code.trim();

    if (!normalizedPhone) {
      setPhoneError(ui.authRequired);
      return;
    }
    if (!trimmedCode) {
      setCodeError(ui.otpEnterCode);
      return;
    }
    if (!sentTo) {
      appToast.info(ui.otpSendFirstTitle, ui.otpSendFirstBody);
      return;
    }
    if (normalizedPhone !== sentTo) {
      setPhoneError('Number changed — send a new code');
      return;
    }

    setPhoneError(undefined);
    setCodeError(undefined);
    setLoading(true);
    try {
      const signedIn = await otpVerify(sentTo, trimmedCode);
      if (signedIn.role === 'customer' && isProfileIncomplete(signedIn)) {
        appToast.info(ui.authCompleteProfileTitle, ui.authCompleteProfileBody);
        appReplace(customerRoutes.settings);
        return;
      }
      appReplace(homeRouteForRole(signedIn.role));
    } catch (err) {
      const message = getApiErrorMessage(err, ui.otpInvalidCode);
      setCodeError(message);
      appToast.error(ui.otpFailed, message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthScreenLayout
      brandName={content.branding.name}
      brandTag={content.branding.tagline}
      heading={ui.authOtpTitle}
      subtitle={sentTo ? ui.authOtpSubtitle : "We'll text a 4-digit code to your mobile"}
      showBack
      footer={
        <>
          <Text style={authScreenStyles.footer}>{ui.otpPreferPassword} </Text>
          <Link href={authRoutes.login}>
            <Text style={authScreenStyles.footerLink}>{ui.authSignInLink}</Text>
          </Link>
        </>
      }
    >
      <AuthField
        label={ui.otpPhoneLabel}
        icon={Smartphone}
        value={phone}
        onChangeText={(t) => {
          // phone-pad blocks letters on the soft keyboard, not on a hardware one
          setPhone(t.replace(/[^\d+]/g, ''));
          if (phoneError) setPhoneError(undefined);
        }}
        placeholder="10-digit mobile number"
        error={phoneError}
        keyboardType="phone-pad"
        returnKeyType="go"
        onSubmitEditing={() => void sendOtp()}
      />

      {sentTo ? (
        <View style={styles.codeBlock}>
          <View style={styles.codeHead}>
            <Text style={styles.codeLabel}>{fillCopy(ui.otpEnterDigits, { count: 4 })}</Text>
            <Text style={styles.codeSentTo}>{fillCopy(ui.otpSentTo, { phone: maskPhone(sentTo) })}</Text>
          </View>
          <OtpBoxes
            autoFocus
            value={code}
            onChange={(v) => {
              setCode(v);
              if (codeError) setCodeError(undefined);
            }}
          />
          {codeError ? <Text style={styles.codeError}>{codeError}</Text> : null}

          <View style={styles.resendRow}>
            {timer > 0 ? (
              <Text style={styles.resendMuted}>Resend code in 0:{String(timer).padStart(2, '0')}</Text>
            ) : (
              <Pressable onPress={() => void sendOtp()} disabled={sending} hitSlop={8} accessibilityRole="button">
                <Text style={styles.resendText}>{sending ? 'Sending…' : "Didn't get it? Resend code"}</Text>
              </Pressable>
            )}
          </View>

          <AuthPrimaryButton
            title={ui.authOtpButton}
            loadingTitle={ui.otpVerifying}
            loading={loading}
            onPress={() => void verify()}
          />
        </View>
      ) : (
        <View style={styles.sendWrap}>
          <AuthPrimaryButton
            title={ui.otpSendButton}
            loadingTitle={ui.otpSending}
            loading={sending}
            onPress={() => void sendOtp()}
          />
        </View>
      )}

      <AuthSecureNote />
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  sendWrap: { marginTop: 8 },
  codeBlock: { marginTop: 6 },
  codeHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  codeLabel: { fontFamily: fonts.bodySemi, fontSize: 13.5, color: themeUi.text },
  codeSentTo: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: themeUi.textTertiary },
  codeError: {
    marginTop: 8,
    fontFamily: fonts.bodySemi,
    fontSize: 12.5,
    color: colors.error,
    textAlign: 'center',
  },
  resendRow: { alignItems: 'center', paddingTop: 14, paddingBottom: 18 },
  resendMuted: { fontFamily: fonts.bodyMedium, fontSize: 13, color: themeUi.textTertiary },
  resendText: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: themeUi.brand },
});
