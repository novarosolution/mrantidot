import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BugMark } from '@/components/BugMark';
import { Spinner } from '@/components/ui/Spinner';
import { isOnboardingDone } from '@/lib/onboarding';
import { useAuth } from '@/context/AuthContext';
import { useAppContent } from '@/context/AppContentContext';
import { colors, fonts, gradients } from '@/constants/theme';

export default function SplashScreen() {
  const { user, isLoading } = useAuth();
  const { content } = useAppContent();

  useEffect(() => {
    if (isLoading) return;
    const t = setTimeout(async () => {
      if (user) {
        router.replace('/');
        return;
      }
      const done = await isOnboardingDone();
      router.replace(done ? '/(auth)/login' : '/(auth)/onboarding');
    }, 1800);
    return () => clearTimeout(t);
  }, [isLoading, user]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
    <LinearGradient colors={[...gradients.premiumHero]} style={styles.root}>
      <View style={styles.logoWrap}>
        <View style={styles.logoRing} />
        <View style={styles.logo}>
          <BugMark size={48} />
        </View>
      </View>
      <Text style={styles.brand}>{content.branding.name.toUpperCase()}</Text>
      <Text style={styles.tag}>{content.branding.tagline}</Text>
      <View style={styles.spinnerWrap}>
        <Spinner />
      </View>
    </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoWrap: { position: 'relative' },
  logoRing: {
    position: 'absolute',
    inset: -18,
    borderWidth: 2,
    borderColor: 'rgba(168,224,78,0.35)',
    borderRadius: 40,
  },
  logo: {
    width: 100,
    height: 100,
    backgroundColor: colors.white,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: { fontFamily: fonts.displayExtra, fontSize: 30, color: colors.white, marginTop: 30, letterSpacing: 1 },
  tag: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.lime, marginTop: 9 },
  spinnerWrap: { marginTop: 36 },
});
