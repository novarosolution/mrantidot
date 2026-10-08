import { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowRight, MapPin, ShieldCheck } from 'lucide-react-native';
import { AuthSplashLayout } from '@/components/kit/auth/AuthScreenKit';
import { FocusStatusBar } from '@/components/ui/FocusStatusBar';
import { colors, fonts, ui } from '@/constants/theme';

type Phase = 'detecting' | 'found' | 'denied';

/** White status pill on the splash — detecting → "Serving <area>" → continue without GPS. */
function LaunchStatus({
  phase,
  cityLabel,
  areaLabel,
  onContinue,
}: {
  phase: Phase;
  cityLabel?: string;
  areaLabel?: string;
  onContinue?: () => void;
}) {
  const fade = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fade.setValue(0.4);
    Animated.timing(fade, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [fade, phase]);

  useEffect(() => {
    if (phase !== 'detecting') {
      Animated.timing(progress, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, { toValue: 0.85, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(progress, { toValue: 0.2, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [phase, progress]);

  const title =
    phase === 'found' && cityLabel ? `Serving ${cityLabel}` : phase === 'denied' ? 'Location is off' : 'Finding your area…';
  const body =
    phase === 'found'
      ? areaLabel || 'Verified technicians are ready nearby'
      : phase === 'denied'
        ? 'You can set your city anytime from home'
        : 'Matching trusted experts near you';
  const Icon = phase === 'denied' ? ShieldCheck : MapPin;

  return (
    <View style={styles.statusWrap}>
      <Animated.View style={[styles.status, { opacity: fade }]}>
        <View style={styles.statusIcon}>
          {phase === 'detecting' ? (
            <ActivityIndicator size="small" color={ui.brand} />
          ) : (
            <Icon size={18} color={ui.brand} strokeWidth={2.3} />
          )}
        </View>
        <View style={styles.statusText}>
          <Text style={styles.statusTitle} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.statusBody} numberOfLines={1}>
            {body}
          </Text>
        </View>
      </Animated.View>
      <View style={styles.track}>
        <Animated.View
          style={[styles.fill, { width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]}
        />
      </View>
      {phase === 'denied' && onContinue ? (
        <Pressable
          accessibilityRole="button"
          onPress={onContinue}
          style={({ pressed }) => [styles.continueBtn, pressed && styles.pressed]}
        >
          <Text style={styles.continueText}>Continue</Text>
          <ArrowRight size={18} color={ui.brand} strokeWidth={2.4} />
        </Pressable>
      ) : null}
    </View>
  );
}

/** App start screen — brand splash while we detect the customer's area. */
export function LocationLaunchScreen({
  brandName,
  tagline = 'Trusted pest control & home services',
  trustChips,
  cityLabel,
  areaLabel,
  phase,
  onContinue,
}: {
  brandName: string;
  tagline?: string;
  trustChips?: string[];
  cityLabel?: string;
  areaLabel?: string;
  phase: Phase;
  onContinue?: () => void;
}) {
  return (
    <>
      <FocusStatusBar style="light" />
      <AuthSplashLayout
        brandName={brandName}
        tagline={tagline}
        trustBadges={trustChips}
        footer={<LaunchStatus phase={phase} cityLabel={cityLabel} areaLabel={areaLabel} onContinue={onContinue} />}
      />
    </>
  );
}

const styles = StyleSheet.create({
  statusWrap: { alignSelf: 'stretch', gap: 12 },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: colors.white,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ui.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: { flex: 1, minWidth: 0 },
  statusTitle: { fontFamily: fonts.bodyBold, fontSize: 15, color: ui.text },
  statusBody: { marginTop: 2, fontFamily: fonts.body, fontSize: 12.5, color: ui.textSecondary },
  track: {
    height: 3,
    borderRadius: 2,
    marginHorizontal: 24,
    backgroundColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 2, backgroundColor: colors.limeOnDark },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.white,
  },
  continueText: { fontFamily: fonts.bodyBold, fontSize: 15.5, color: ui.brand },
  pressed: { opacity: 0.85 },
});
