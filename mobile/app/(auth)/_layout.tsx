import { Redirect, Stack, useSegments } from 'expo-router';
import { Platform } from 'react-native';
import { Spinner } from '@/components/ui/Spinner';
import { design } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { isProfileIncomplete } from '@/lib/profile-display';
import { appHref, authRoutes, customerRoutes, homeRouteForRole } from '@/lib/routes';

function AuthLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <Spinner fullScreen />;
  if (user) {
    if (user.role === 'customer' && isProfileIncomplete(user)) {
      return <Redirect href={appHref(customerRoutes.settings)} />;
    }
    return <Redirect href={appHref(homeRouteForRole(user.role))} />;
  }

  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: design.screenBg } }} />;
}

/** Web admin panel: only sign-in (and the dev OTP sign-in) — no location splash, onboarding or sign-up. */
const WEB_AUTH_SCREENS = new Set(['login', 'otp']);

function WebAuthLayout() {
  const segments = useSegments() as string[];
  const screen = segments[1];
  if (screen && !WEB_AUTH_SCREENS.has(screen)) return <Redirect href={authRoutes.login} />;
  return <AuthLayout />;
}

export default Platform.OS === 'web' ? WebAuthLayout : AuthLayout;
