import { Redirect } from 'expo-router';
import { View } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useAppContent } from '@/context/AppContentContext';
import { authRoutes } from '@/lib/routes';
import { AUTH_HERO_GRADIENT } from '@/components/kit/auth/AuthBrandArt';

/** All sessions start at the location splash, then route to home or auth. */
export default function Index() {
  const { isLoading: authLoading } = useAuth();
  const { loaded: contentLoaded } = useAppContent();

  if (authLoading || !contentLoaded) {
    // Same green as the splash, so launch never flashes white.
    return <View style={{ flex: 1, backgroundColor: AUTH_HERO_GRADIENT[1] }} />;
  }

  return <Redirect href={authRoutes.splash} />;
}
