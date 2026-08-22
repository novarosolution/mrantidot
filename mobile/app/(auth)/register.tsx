import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
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
import { AuthField, AuthScreenLayout, authScreenStyles } from '@/components/kit/auth/AuthScreenLayout';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { useAuth } from '@/context/AuthContext';
import { useAppContent } from '@/context/AppContentContext';
import { useLocation } from '@/context/LocationContext';
import { appToast } from '@/lib/toast';
import { getApiErrorMessage } from '@/lib/api';
import { appReplace, authRoutes, homeRouteForRole } from '@/lib/routes';
import { useBrandFill, useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { AppIcons } from '@/constants/appIcons';
import { colors, fonts, premium, spacing } from '@/constants/theme';

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
        icon={AppIcons.ui.user}
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
        icon={AppIcons.ui.phone}
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
        icon={AppIcons.ui.mail}
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
        icon={AppIcons.ui.lock}
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
        icon={AppIcons.ui.mapPin}
        optional
        autoCapitalize="words"
        inputRef={cityRef}
        returnKeyType="go"
        onSubmitEditing={() => void submit()}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={ui.authRegisterButton}
        style={({ pressed }) => [styles.ctaWrap, pressed && !loading && styles.pressed]}
        onPress={() => void submit()}
        disabled={loading}
      >
        <LinearGradient
          colors={['#3BC45A', colors.forestMid, colors.forest]}
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
              <ActivityIndicator size="small" color={colors.white} />
              <Text style={styles.ctaText}>Creating account…</Text>
            </>
          ) : (
            <>
              <Text style={styles.ctaText}>{ui.authRegisterButton}</Text>
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
                    color={colors.forest}
                    strokeWidth={2.5}
                  />
                </View>
              </Animated.View>
            </>
          )}
        </LinearGradient>
      </Pressable>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  ctaWrap: { marginTop: spacing.sm },
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
    shadowColor: colors.forest,
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
    color: colors.white,
  },
  ctaChip: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
  },
});
