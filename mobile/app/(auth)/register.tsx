import { Link } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { AuthField, AuthPrimaryButton, AuthScreenLayout, authScreenStyles } from '@/components/kit/auth/AuthScreenLayout';
import { useAuth } from '@/context/AuthContext';
import { useAppContent } from '@/context/AppContentContext';
import { useLocation } from '@/context/LocationContext';
import { appToast } from '@/lib/toast';
import { getApiErrorMessage } from '@/lib/api';
import { appReplace, authRoutes, homeRouteForRole } from '@/lib/routes';
import { useBrandFill, useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { AppIcons } from '@/constants/appIcons';
import { spacing } from '@/constants/theme';
import { haptic } from '@/lib/motion';

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

  const cityPrefilled = useRef(false);
  useEffect(() => {
    if (cityPrefilled.current || !displayCity) return;
    cityPrefilled.current = true;
    setCity((prev) => prev || displayCity);
  }, [displayCity]);

  function clearError(key: keyof Errors) {
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate() {
    const next: Errors = {};
    if (!name.trim()) next.name = ui.authRequired;
    if (!phone.trim()) next.phone = ui.authRequired;
    if (!email.trim()) next.email = ui.authRequired;
    if (!password.trim()) next.password = ui.authRequired;
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit() {
    if (loading || !validate()) return;

    setLoading(true);
    try {
      const signedIn = await register({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        password: password.trim(),
        city: city.trim() || undefined,
      });
      haptic('success');
      appToast.success(ui.authRegisterSuccessToast, fill(ui.authRegisterWelcome));
      appReplace(homeRouteForRole(signedIn.role));
    } catch (err) {
      haptic('error');
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
          <Text style={authScreenStyles.footer}>{ui.authHaveAccount} </Text>
          <Link href={authRoutes.login}>
            <Text style={authScreenStyles.footerLink}>{ui.authSignInLink}</Text>
          </Link>
        </>
      }
    >
      <AuthField
        label={ui.authFieldName}
        value={name}
        onChangeText={(t) => {
          setName(t);
          clearError('name');
        }}
        placeholder={ui.authFieldNamePlaceholder}
        error={errors.name}
        icon={AppIcons.ui.user}
        autoCapitalize="words"
        returnKeyType="next"
        onSubmitEditing={() => phoneRef.current?.focus()}
      />

      <AuthField
        label={ui.authFieldPhone}
        value={phone}
        onChangeText={(t) => {
          setPhone(t);
          clearError('phone');
        }}
        placeholder={ui.authFieldPhonePlaceholder}
        error={errors.phone}
        icon={AppIcons.ui.phone}
        keyboardType="phone-pad"
        inputRef={phoneRef}
        returnKeyType="next"
        onSubmitEditing={() => emailRef.current?.focus()}
      />

      <AuthField
        label={ui.authFieldEmail}
        value={email}
        onChangeText={(t) => {
          setEmail(t);
          clearError('email');
        }}
        placeholder={ui.authFieldEmailPlaceholder}
        error={errors.email}
        icon={AppIcons.ui.mail}
        keyboardType="email-address"
        inputRef={emailRef}
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />

      <AuthField
        label={ui.authFieldPassword}
        value={password}
        onChangeText={(t) => {
          setPassword(t);
          clearError('password');
        }}
        placeholder={ui.authFieldNewPasswordPlaceholder}
        error={errors.password}
        icon={AppIcons.ui.lock}
        secure
        inputRef={passwordRef}
        returnKeyType="next"
        onSubmitEditing={() => cityRef.current?.focus()}
      />

      <AuthField
        label={ui.authFieldCity}
        value={city}
        onChangeText={setCity}
        placeholder={ui.authFieldCityPlaceholder}
        icon={AppIcons.ui.mapPin}
        optional
        autoCapitalize="words"
        inputRef={cityRef}
        returnKeyType="go"
        onSubmitEditing={() => void submit()}
      />

      <View style={styles.ctaWrap}>
        <AuthPrimaryButton
          title={ui.authRegisterButton}
          loadingTitle={ui.authCreatingAccount}
          loading={loading}
          onPress={() => void submit()}
        />
      </View>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  ctaWrap: { marginTop: spacing.sm },
});
