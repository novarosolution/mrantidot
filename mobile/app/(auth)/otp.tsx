import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Phone } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { OtpBoxes } from '@/components/kit/OtpBoxes';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconInput } from '@/components/kit/IconInput';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { colors, design, fonts, gradients, spacing } from '@/constants/theme';

export default function OtpScreen() {
  const { otpVerify } = useAuth();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
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
      Toast.show({ type: 'error', text1: 'Enter your phone number' });
      return;
    }
    try {
      await api.post('/auth/otp/send', { phone: trimmed });
      Toast.show({ type: 'success', text1: 'Verification code sent' });
      setSentTo(trimmed);
      setTimer(30);
    } catch {
      // Error toast handled by API interceptor
    }
  }

  async function verify() {
    if (!phone.trim() || !code.trim()) {
      Toast.show({ type: 'error', text1: 'Enter phone and OTP code' });
      return;
    }
    setLoading(true);
    try {
      await otpVerify(phone, code);
      router.replace('/');
    } catch {
      // Error toast handled by API interceptor
    } finally {
      setLoading(false);
    }
  }

  const maskedPhone = sentTo ? maskPhone(sentTo) : null;

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'left', 'right']}>
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <LinearGradient colors={[...gradients.otp]} style={styles.hero}>
          <View style={styles.logo}>
            <Phone size={26} color={colors.secondaryDark} />
          </View>
          <Text style={styles.welcome}>Verify Your Number</Text>
          <Text style={styles.subHero}>
            {maskedPhone ? `Enter the 4-digit code sent to ${maskedPhone}` : 'Enter the 4-digit code we sent to your phone'}
          </Text>
        </LinearGradient>
        <Card variant="premium" style={styles.formCard}>
          <View style={styles.form}>
          <IconInput
            label="Phone"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            leftIcon={<Phone size={18} color={colors.muted} />}
          />
          <Button title={sentTo ? 'Resend OTP' : 'Send OTP'} variant="secondary" onPress={sendOtp} disabled={timer > 0} />
          <OtpBoxes value={code} onChange={setCode} />
          {timer > 0 ? (
            <Text style={styles.resend}>
              Resend code in <Text style={styles.resendBold}>0:{String(timer).padStart(2, '0')}</Text>
            </Text>
          ) : (
            <Pressable onPress={sendOtp} style={styles.resendBtn} disabled={!sentTo}>
              <Text style={[styles.resend, sentTo && styles.resendActive]}>
                {sentTo ? 'Didn’t get it? Resend code' : 'Send a code to get started'}
              </Text>
            </Pressable>
          )}
          <Button title="Verify & Continue" variant="premium" onPress={verify} loading={loading} style={{ marginTop: spacing.md }} />
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return phone;
  const last = digits.slice(-3);
  return `••••• ••${last}`;
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: design.screenBg },
  scroll: { flexGrow: 1 },
  hero: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: 70, minHeight: 215 },
  logo: {
    width: 56,
    height: 56,
    backgroundColor: colors.white,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcome: { fontFamily: fonts.displayExtra, fontSize: 25, color: colors.white, marginTop: 20 },
  subHero: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.skySoft, marginTop: 6 },
  formCard: { marginTop: -40, marginHorizontal: spacing.md },
  form: { paddingBottom: spacing.sm },
  resend: { textAlign: 'center', marginTop: 26, fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  resendBold: { color: colors.secondaryDark, fontFamily: fonts.bodyBold },
  resendBtn: { alignSelf: 'center' },
  resendActive: { color: colors.secondaryDark, fontFamily: fonts.bodySemi },
});
