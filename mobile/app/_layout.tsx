import {
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  useFonts as useJakarta,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Sora_700Bold, Sora_800ExtraBold, useFonts as useSora } from '@expo-google-fonts/sora';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import { AuthProvider } from '@/context/AuthContext';
import { AppContentProvider } from '@/context/AppContentContext';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Spinner } from '@/components/ui/Spinner';
import { registerGlobalErrorHandlers } from '@/lib/registerGlobalErrorHandlers';
import { colors } from '@/constants/theme';

registerGlobalErrorHandlers();

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [soraLoaded] = useSora({ Sora_700Bold, Sora_800ExtraBold });
  const [jakartaLoaded] = useJakarta({
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });
  const fontsReady = soraLoaded && jakartaLoaded;

  useEffect(() => {
    if (fontsReady) void SplashScreen.hideAsync();
  }, [fontsReady]);

  if (!fontsReady) {
    return <Spinner fullScreen />;
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContentProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
          <Toast />
        </AppContentProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
