import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  useFonts as useJakarta,
} from '@expo-google-fonts/plus-jakarta-sans';
import { PlayfairDisplay_600SemiBold, PlayfairDisplay_700Bold, useFonts as usePlayfair } from '@expo-google-fonts/playfair-display';
import {
  Sora_600SemiBold,
  Sora_700Bold,
  Sora_800ExtraBold,
  useFonts as useSora,
} from '@expo-google-fonts/sora';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { premiumToastConfig, TOAST_DEFAULTS } from '@/components/ui/PremiumToast';
import { AuthSplashLayout } from '@/components/kit/auth/AuthScreenKit';
import { AuthProvider } from '@/context/AuthContext';
import { AppContentProvider, DEFAULT_APP_CONFIG } from '@/context/AppContentContext';
import { LocationProvider } from '@/context/LocationContext';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Spinner } from '@/components/ui/Spinner';
import { registerGlobalErrorHandlers } from '@/lib/registerGlobalErrorHandlers';
import { setupDefaultFonts } from '@/lib/setupFonts';
import { colors, fonts, premiumType } from '@/constants/theme';

registerGlobalErrorHandlers();
SplashScreen.preventAutoHideAsync().catch(() => {});

function BootSplash() {
  return (
    <AuthSplashLayout
      brandName={DEFAULT_APP_CONFIG.branding.name}
      tagline={DEFAULT_APP_CONFIG.branding.tagline}
      trustBadges={DEFAULT_APP_CONFIG.onboarding.trustChips}
      footer={
        <View style={bootStyles.loading}>
          <Spinner />
          <Text style={bootStyles.text}>Starting Mr Antidot…</Text>
        </View>
      }
    />
  );
}

export default function RootLayout() {
  const [soraLoaded] = useSora({ Sora_600SemiBold, Sora_700Bold, Sora_800ExtraBold });
  const [jakartaLoaded] = useJakarta({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });
  const [playfairLoaded] = usePlayfair({ PlayfairDisplay_600SemiBold, PlayfairDisplay_700Bold });
  const [fontFallback, setFontFallback] = useState(false);
  const fontsReady = (soraLoaded && jakartaLoaded && playfairLoaded) || fontFallback;

  useEffect(() => {
    const t = setTimeout(() => setFontFallback(true), 10000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (fontsReady) {
      setupDefaultFonts();
      void SplashScreen.hideAsync();
    }
  }, [fontsReady]);

  if (!fontsReady) return <BootSplash />;

  return (
    <ErrorBoundary>
      <AuthProvider>
        <LocationProvider>
          <AppContentProvider>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
            <Toast config={premiumToastConfig} topOffset={TOAST_DEFAULTS.topOffset} visibilityTime={TOAST_DEFAULTS.visibilityTime} />
          </AppContentProvider>
        </LocationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

const bootStyles = StyleSheet.create({
  loading: { alignItems: 'center', gap: 12 },
  text: { ...premiumType.caption, fontFamily: fonts.bodySemi, color: 'rgba(255,255,255,0.7)' },
});
