import { Link, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AuthField, AuthScreenLayout, authScreenStyles } from '@/components/kit/auth/AuthScreenLayout';
import { OtpBoxes } from '@/components/kit/OtpBoxes';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useAppContent } from '@/context/AppContentContext';
import { api } from '@/lib/api';
import { appToast } from '@/lib/toast';
import { homeRouteForRole } from '@/lib/auth-routes';
import { isProfileIncomplete } from '@/lib/profile-display';
import { colors, fonts, spacing } from '@/constants/theme';

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return phone;
  return `••••• ••${digits.slice(-3)}`;
}

export default function OtpScreen() {
  const { otpVerify } = useAuth();
  const { content } = useAppContent();

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
    const trimmed = phone.trim();
    if (!trimmed) {
      setPhoneError('Required');
      return;
    }
    setPhoneError(undefined);
    setSending(true);
    try {
      await api.post('/auth/otp/send', { phone: trimmed });
      appToast.success('Code sent', `Check SMS on ${maskPhone(trimmed)}`);
      setSentTo(trimmed);
      setTimer(30);
      setCode('');
      setCodeError(undefined);
    } catch {
      // handled by API interceptor
    } finally {
      setSending(false);
    }
  }

  async function verify() {
    const trimmedPhone = phone.trim();
    const trimmedCode = code.trim();

    if (!trimmedPhone) {
      setPhoneError('Required');
      return;
    }
    if (!trimmedCode) {
      setCodeError('Enter the code');
      return;
    }
    if (!sentTo) {
      appToast.info('Send code first', 'Tap Send code to receive your OTP');
      return;
    }

    setPhoneError(undefined);
    setCodeError(undefined);
    setLoading(true);
    try {
      const signedIn = await otpVerify(trimmedPhone, trimmedCode);
      if (signedIn.role === 'customer' && isProfileIncomplete(signedIn)) {
        appToast.info('Complete your profile', 'Add your name and email to finish setup.');
        router.replace('/(customer)/settings');
        return;
      }
      router.replace(homeRouteForRole(signedIn.role));
    } catch {
      // handled by API interceptor
    } finally {
      setLoading(false);
    }
  }

  const heading = sentTo ? `Code sent to ${maskPhone(sentTo)}` : 'Sign in with OTP';

  return (
    <AuthScreenLayout
      brandName={content.branding.name}
      heading={heading}
      showBack
      footer={
        <Text style={authScreenStyles.footer}>
          Prefer password?{' '}
          <Link href="/(auth)/login">
            <Text style={authScreenStyles.footerLink}>Sign in</Text>
          </Link>
        </Text>
      }
    >
      <AuthField
        label="Mobile number"
        value={phone}
        onChangeText={(t) => {
          setPhone(t);
          if (phoneError) setPhoneError(undefined);
        }}
        placeholder="10-digit mobile number"
        error={phoneError}
        keyboardType="phone-pad"
        returnKeyType="go"
        onSubmitEditing={() => void sendOtp()}
      />

      <Button
        title={sentTo ? (timer > 0 ? `Resend in 0:${String(timer).padStart(2, '0')}` : 'Resend code') : 'Send code'}
        variant="secondary"
        onPress={() => void sendOtp()}
        loading={sending}
        disabled={timer > 0}
      />

      {sentTo ? (
        <View style={styles.codeBlock}>
          <Text style={styles.codeLabel}>Enter 4-digit code</Text>
          <OtpBoxes value={code} onChange={(v) => {
            setCode(v);
            if (codeError) setCodeError(undefined);
          }} />
          {codeError ? <Text style={styles.codeError}>{codeError}</Text> : null}

          {timer <= 0 ? (
            <Pressable onPress={() => void sendOtp()} style={styles.resendLink}>
              <Text style={styles.resendText}>Didn&apos;t get it? Send again</Text>
            </Pressable>
          ) : null}

          <Button
            title="Verify & sign in"
            variant="premium"
            onPress={() => void verify()}
            loading={loading}
            style={styles.verifyBtn}
          />
        </View>
      ) : null}
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  codeBlock: {
    marginTop: spacing.lg,
  },
  codeLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  codeError: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: colors.error,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  resendLink: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  resendText: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.forest,
  },
  verifyBtn: {
    marginTop: spacing.lg,
  },
});
