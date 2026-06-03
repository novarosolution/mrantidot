import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, MapPin, Phone, User } from 'lucide-react-native';
import { BugMark } from '@/components/BugMark';
import { IconInput } from '@/components/kit/IconInput';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Toast from 'react-native-toast-message';
import { useAuth } from '@/context/AuthContext';
import { useAppContent } from '@/context/AppContentContext';
import { colors, design, fonts, gradients, spacing } from '@/constants/theme';

export default function RegisterScreen() {
  const { register } = useAuth();
  const { content } = useAppContent();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!name.trim() || !phone.trim() || !email.trim() || !password.trim()) {
      Toast.show({ type: 'error', text1: 'Fill in all required fields' });
      return;
    }
    setLoading(true);
    try {
      await register({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        password,
        city: city.trim() || undefined,
      });
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
          <Text style={styles.welcome}>Create Account</Text>
          <Text style={styles.subHero}>Join {content.branding.name} today</Text>
        </LinearGradient>
        <Card variant="premium" style={styles.formCard}>
          <View style={styles.form}>
          <IconInput label="Full name" value={name} onChangeText={setName} leftIcon={<User size={18} color={colors.muted} />} />
          <IconInput label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" leftIcon={<Phone size={18} color={colors.muted} />} />
          <IconInput label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" leftIcon={<Mail size={18} color={colors.muted} />} />
          <IconInput label="Password (8+)" value={password} onChangeText={setPassword} secure />
          <IconInput label="City" value={city} onChangeText={setCity} leftIcon={<MapPin size={18} color={colors.muted} />} />
          <Button title="Sign Up" variant="premium" onPress={submit} loading={loading} />
          <Text style={styles.footer}>
            Already have an account?{' '}
            <Link href="/(auth)/login"><Text style={styles.link}>Login</Text></Link>
          </Text>
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
  hero: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: 80, minHeight: 200 },
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
  footer: { textAlign: 'center', marginTop: 22, fontFamily: fonts.bodySemi, fontSize: 13 },
  link: { color: colors.secondaryDark, fontFamily: fonts.bodyBold },
});
