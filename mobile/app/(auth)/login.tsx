import { Link, router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput } from 'react-native';
import { AuthField, AuthScreenLayout, authScreenStyles } from '@/components/kit/auth/AuthScreenLayout';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useAppContent } from '@/context/AppContentContext';
import { getApiErrorMessage } from '@/lib/api';
import { homeRouteForRole } from '@/lib/auth-routes';
import { appToast } from '@/lib/toast';
import { spacing, colors, fonts } from '@/constants/theme';

export default function LoginScreen() {
  const { login } = useAuth();
  const { content } = useAppContent();

  const passwordRef = useRef<TextInput>(null);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [identifierError, setIdentifierError] = useState<string>();
  const [passwordError, setPasswordError] = useState<string>();

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
      appToast.success('Welcome back', content.branding.name);
      router.replace(homeRouteForRole(signedIn.role));
    } catch (err) {
      appToast.error('Sign in failed', getApiErrorMessage(err, 'Check your credentials and try again'));
    } finally {
      setLoading(false);
    }
  }, [content.branding.name, identifier, login, password]);

  return (
    <AuthScreenLayout
      brandName={content.branding.name}
      footer={
        <Text style={authScreenStyles.footer}>
          New here?{' '}
          <Link href="/(auth)/register">
            <Text style={authScreenStyles.footerLink}>Create account</Text>
          </Link>
        </Text>
      }
    >
      <AuthField
        label="Email or phone"
        value={identifier}
        onChangeText={(text) => {
          setIdentifier(text);
          if (identifierError) setIdentifierError(undefined);
        }}
        placeholder="Email or mobile number"
        error={identifierError}
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
        placeholder="Your password"
        error={passwordError}
        secure
        inputRef={passwordRef}
        returnKeyType="go"
        onSubmitEditing={() => void handleLogin()}
      />

      <Pressable
        style={styles.forgotBtn}
        onPress={() => {
          const contact = content.support.phone || content.support.email;
          appToast.info(
            'Password reset',
            contact ? `Contact: ${contact}` : 'Use OTP sign in instead.',
          );
        }}
      >
        <Text style={styles.forgotText}>Forgot password?</Text>
      </Pressable>

      <Button title="Sign in" variant="premium" onPress={() => void handleLogin()} loading={loading} />

      <Link href="/(auth)/otp" asChild>
        <Button title="Sign in with OTP" variant="outline" style={styles.altBtn} />
      </Link>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: spacing.lg,
    marginTop: -4,
  },
  forgotText: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.forest,
  },
  altBtn: {
    marginTop: spacing.md,
  },
});
