import { Link } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';
import { AuthField, AuthScreenLayout, authScreenStyles } from '@/components/kit/auth/AuthScreenLayout';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useAppContent } from '@/context/AppContentContext';
import { useLocation } from '@/context/LocationContext';
import { appToast } from '@/lib/toast';
import { getApiErrorMessage } from '@/lib/api';
import { appReplace, authRoutes, homeRouteForRole } from '@/lib/routes';
import { useBrandFill, useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { spacing } from '@/constants/theme';

type Errors = Partial<Record<'name' | 'phone' | 'email' | 'password', string>>;

export default function RegisterScreen() {
  const { register } = useAuth();
  const { content } = useAppContent();
  const ui = useCustomerUiCopy();
  const { fill } = useBrandFill();
  const { displayCity } = useLocation();

  const phoneRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const cityRef = useRef<TextInput>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    if (displayCity && !city) setCity(displayCity);
  }, [displayCity, city]);

  function clearError(key: keyof Errors) {
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate() {
    const next: Errors = {};
    if (!name.trim()) next.name = 'Required';
    if (!phone.trim()) next.phone = 'Required';
    if (!email.trim()) next.email = 'Required';
    if (!password.trim()) next.password = 'Required';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit() {
    if (!validate()) return;

    setLoading(true);
    try {
      const signedIn = await register({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        password: password.trim(),
        city: city.trim() || undefined,
      });
      appToast.success(ui.authRegisterSuccessToast, `Welcome to ${content.branding.name}`);
      appReplace(homeRouteForRole(signedIn.role));
    } catch (err) {
      appToast.error(ui.authRegisterErrorToast, getApiErrorMessage(err, 'Check your details and try again'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthScreenLayout
      brandName={content.branding.name}
      brandTag={content.branding.tagline}
      heading={ui.authRegisterTitle}
      subtitle={fill(ui.authRegisterSubtitle)}
      showBack
      scroll
      footer={
        <>
          <Text style={authScreenStyles.footer}>Already have an account? </Text>
          <Link href={authRoutes.login}>
            <Text style={authScreenStyles.footerLink}>Sign in</Text>
          </Link>
        </>
      }
    >
      <AuthField
        label="Full name"
        value={name}
        onChangeText={(t) => {
          setName(t);
          clearError('name');
        }}
        placeholder="Your name"
        error={errors.name}
        autoCapitalize="words"
        returnKeyType="next"
        onSubmitEditing={() => phoneRef.current?.focus()}
      />

      <AuthField
        label="Phone"
        value={phone}
        onChangeText={(t) => {
          setPhone(t);
          clearError('phone');
        }}
        placeholder="Mobile number"
        error={errors.phone}
        keyboardType="phone-pad"
        inputRef={phoneRef}
        returnKeyType="next"
        onSubmitEditing={() => emailRef.current?.focus()}
      />

      <AuthField
        label="Email"
        value={email}
        onChangeText={(t) => {
          setEmail(t);
          clearError('email');
        }}
        placeholder="Email address"
        error={errors.email}
        keyboardType="email-address"
        inputRef={emailRef}
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />

      <AuthField
        label="Password"
        value={password}
        onChangeText={(t) => {
          setPassword(t);
          clearError('password');
        }}
        placeholder="Create a password"
        error={errors.password}
        secure
        inputRef={passwordRef}
        returnKeyType="next"
        onSubmitEditing={() => cityRef.current?.focus()}
      />

      <AuthField
        label="City"
        value={city}
        onChangeText={setCity}
        placeholder="Your city"
        optional
        autoCapitalize="words"
        inputRef={cityRef}
        returnKeyType="go"
        onSubmitEditing={() => void submit()}
      />

      <Button title={ui.authRegisterButton} variant="premium" onPress={() => void submit()} loading={loading} style={styles.cta} />
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  cta: { marginTop: spacing.sm },
});
