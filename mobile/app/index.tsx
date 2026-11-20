import { Redirect } from 'expo-router';
import { Platform, View } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useAppContent } from '@/context/AppContentContext';
import { adminRoutes, appHref, authRoutes } from '@/lib/routes';
import { AUTH_HERO_GRADIENT } from '@/components/kit/auth/AuthBrandArt';

/** All sessions start at the location splash, then route to home or auth (web: admin panel or sign-in). */
export default function Index() {
  const { user, isLoading: authLoading } = useAuth();
  const { loaded: contentLoaded } = useAppContent();

  if (authLoading || !contentLoaded) {
    // Same green as the splash, so launch never flashes white.
    return <View style={{ flex: 1, backgroundColor: AUTH_HERO_GRADIENT[1] }} />;
  }

  if (Platform.OS === 'web') {
    // The web build is the admin panel — no location splash / onboarding; straight to the panel or sign-in.
    return <Redirect href={user?.role === 'admin' ? appHref(adminRoutes.home) : authRoutes.login} />;
  }

  return <Redirect href={authRoutes.splash} />;
}
