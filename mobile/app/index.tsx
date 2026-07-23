import { Redirect } from 'expo-router';
import { View } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useAppContent } from '@/context/AppContentContext';
import { authRoutes } from '@/lib/routes';
import { design } from '@/constants/theme';

/** All sessions start at the location splash, then route to home or auth. */
export default function Index() {
  const { isLoading: authLoading } = useAuth();
  const { loaded: contentLoaded } = useAppContent();

  if (authLoading || !contentLoaded) {
    return <View style={{ flex: 1, backgroundColor: design.screenBg }} />;
  }

  return <Redirect href={authRoutes.splash} />;
}
