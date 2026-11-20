import { DancingScript_600SemiBold, useFonts as useDancingScript } from '@expo-google-fonts/dancing-script';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts as useInter,
} from '@expo-google-fonts/inter';
import { InstrumentSerif_400Regular_Italic, useFonts as useInstrumentSerif } from '@expo-google-fonts/instrument-serif';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { premiumToastConfig, TOAST_DEFAULTS, useToastTopOffset } from '@/components/ui/PremiumToast';
import { AuthSplashLayout } from '@/components/kit/auth/AuthScreenKit';
import { AuthProvider } from '@/context/AuthContext';
import { AppContentProvider, DEFAULT_APP_CONFIG } from '@/context/AppContentContext';
import { LocationProvider } from '@/context/LocationContext';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { registerGlobalErrorHandlers } from '@/lib/registerGlobalErrorHandlers';
import { setupDefaultFonts } from '@/lib/setupFonts';
import { colors, design, fonts } from '@/constants/theme';

function AppToastHost() {
  const topOffset = useToastTopOffset();
  return (
    <Toast
      config={premiumToastConfig}
      topOffset={topOffset}
      visibilityTime={TOAST_DEFAULTS.visibilityTime}
      position={TOAST_DEFAULTS.position}
    />
  );
}

/** Web (admin panel) browser-tab title until a screen sets its own. */
const WEB_ROOT_TITLE = Platform.OS === 'web' ? { title: 'Mr Antidot Admin' } : null;

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
          <View style={bootStyles.progressTrack}>
            <View style={bootStyles.progressFill} />
          </View>
          <Text style={bootStyles.text}>Preparing Mr Antidot…</Text>
        </View>
      }
    />
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useInter({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  // Accent faces (home sign-off script, curation serif italic); they fall back to the system font if they ever fail to load.
  useDancingScript({ DancingScript_600SemiBold });
  useInstrumentSerif({ InstrumentSerif_400Regular_Italic });
  const [fontFallback, setFontFallback] = useState(false);
  const fontsReady = fontsLoaded || fontFallback;

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
    <SafeAreaProvider>
      <ErrorBoundary>
        <AuthProvider>
          <LocationProvider>
            <AppContentProvider>
              {/* Every screen opens on a dark forest hero (HeroDarkSlice / auth / launch),
                  so the clock + battery need light glyphs to stay legible. */}
              <StatusBar style="light" />
              <Stack
                screenOptions={{ headerShown: false, contentStyle: { backgroundColor: design.screenBg }, ...WEB_ROOT_TITLE }}
              />
              <AppToastHost />
            </AppContentProvider>
          </LocationProvider>
        </AuthProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const bootStyles = StyleSheet.create({
  loading: { alignSelf: 'stretch', alignItems: 'center', gap: 12 },
  progressTrack: {
    width: '100%',
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.14)',
    overflow: 'hidden',
  },
  progressFill: {
    width: '42%',
    height: '100%',
    borderRadius: 2,
    backgroundColor: colors.limeBright,
  },
  text: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    letterSpacing: -0.05,
    color: 'rgba(255,255,255,0.68)',
  },
});
