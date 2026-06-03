import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User } from 'lucide-react-native';
import { BugMark } from '@/components/BugMark';
import { IconInput } from '@/components/kit/IconInput';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Toast from 'react-native-toast-message';
import { useAuth } from '@/context/AuthContext';
import { useAppContent } from '@/context/AppContentContext';
import { colors, design, fonts, gradients, spacing } from '@/constants/theme';

export default function LoginScreen() {
  const { login } = useAuth();
  const { content } = useAppContent();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    const id = identifier.trim();
    const pass = password.trim();
    if (!id || !pass) {
      Toast.show({ type: 'error', text1: 'Enter phone or email and password' });
      return;
    }
    setLoading(true);
    try {
      await login(id, pass);
      router.replace('/');
    } catch {
      // Error toast handled by API interceptor
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'left', 'right']}>
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <LinearGradient colors={[...gradients.premiumHero]} style={styles.hero}>
          <View style={styles.logo}>
            <BugMark size={30} />
          </View>
          <Text style={styles.welcome}>Welcome Back</Text>
          <Text style={styles.subHero}>Login to manage your bookings</Text>
        </LinearGradient>
        <Card variant="premium" style={styles.formCard}>
          <View style={styles.form}>
          <IconInput
            label="Email or Phone"
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
            leftIcon={<User size={18} color={colors.muted} />}
          />
          <IconInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secure
          />
          <Pressable
            style={styles.forgot}
            onPress={() => {
              const contact = content.support.phone || content.support.email;
              Toast.show({
                type: 'info',
                text1: 'Password reset',
                text2: contact
                  ? `Use OTP sign-in, or contact support: ${contact}`
                  : 'Use OTP sign-in or contact support.',
              });
            }}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </Pressable>
          <Button title="Login" variant="premium" onPress={handleLogin} loading={loading} />
          <Text style={styles.footer}>
            Don&apos;t have an account?{' '}
            <Link href="/(auth)/register"><Text style={styles.link}>Sign Up</Text></Link>
          </Text>
          <Link href="/(auth)/otp" asChild>
            <Text style={styles.otpLink}>Sign in with OTP →</Text>
          </Link>
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: design.screenBg },
  scroll: { flexGrow: 1 },
  hero: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: 80, minHeight: 230 },
  logo: {
    width: 56,
    height: 56,
    backgroundColor: colors.white,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcome: { fontFamily: fonts.displayExtra, fontSize: 25, color: colors.white, marginTop: 20 },
  subHero: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.lime, marginTop: 5 },
  formCard: { marginTop: -48, marginHorizontal: spacing.md },
  form: { paddingBottom: spacing.sm },
  forgot: { alignSelf: 'flex-end', marginBottom: spacing.md, marginTop: -8 },
  forgotText: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: colors.secondaryDark },
  footer: { textAlign: 'center', marginTop: 22, fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ink },
  link: { color: colors.secondaryDark, fontFamily: fonts.bodyBold },
  otpLink: { textAlign: 'center', color: colors.secondaryDark, fontFamily: fonts.bodySemi, fontSize: 14, marginTop: 16 },
});
