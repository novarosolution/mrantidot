import { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { ArrowRight, MapPin, ShieldCheck } from 'lucide-react-native';
import { AuthSplashLayout } from '@/components/kit/auth/AuthScreenKit';
import { FocusStatusBar } from '@/components/ui/FocusStatusBar';
import { PressableScale } from '@/components/ui/PressableScale';
import { fillCopy } from '@/constants/customerUiCopy';
import { colors, fonts, radii, ui } from '@/constants/theme';
import { getReducedMotion, useAmbientLoop } from '@/lib/a11yPrefs';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { motion } from '@/lib/motion';

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
  const copy = useCustomerUiCopy();
  const fade = useRef(new Animated.Value(0)).current;
  /** 0 → 1 fill of the thin rail, drawn as a native-driven scaleX from the left edge. */
  const progress = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    if (getReducedMotion()) {
      fade.setValue(1);
      return;
    }
    fade.setValue(0.4);
    Animated.timing(fade, { toValue: 1, duration: motion.duration.slow, easing: motion.easing.out, useNativeDriver: true }).start();
  }, [fade, phase]);

  useEffect(() => {
    if (phase === 'detecting') return;
    Animated.timing(progress, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [phase, progress]);

  // Indeterminate sweep while we look for the area (still with Reduce Motion).
  useAmbientLoop(
    () =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(progress, { toValue: 0.85, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(progress, { toValue: 0.2, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      ),
    [progress],
    phase === 'detecting',
  );

  const title =
    phase === 'found' && cityLabel
      ? fillCopy(copy.launchFoundTitle, { city: cityLabel })
      : phase === 'denied'
        ? copy.launchDeniedTitle
        : copy.launchFindingTitle;
  const body =
    phase === 'found' ? areaLabel || copy.launchFoundBody : phase === 'denied' ? copy.launchDeniedBody : copy.launchFindingBody;
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
        <Animated.View style={[styles.fill, { transform: [{ scaleX: progress }] }]} />
      </View>
      {phase === 'denied' && onContinue ? (
        <PressableScale accessibilityRole="button" haptic="tap" onPress={onContinue} style={styles.continueBtn}>
          <Text style={styles.continueText}>{copy.launchContinue}</Text>
          <ArrowRight size={18} color={ui.brand} strokeWidth={2.4} />
        </PressableScale>
      ) : null}
    </View>
  );
}

/** App start screen — brand splash while we detect the customer's area. */
export function LocationLaunchScreen({
  brandName,
  tagline,
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
  const copy = useCustomerUiCopy();
  return (
    <>
      <FocusStatusBar style="light" />
      <AuthSplashLayout
        brandName={brandName}
        tagline={tagline?.trim() || copy.launchTaglineFallback}
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
    borderRadius: radii.control,
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
  fill: { height: '100%', width: '100%', transformOrigin: 'left', backgroundColor: colors.limeOnDark },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 52,
    borderRadius: radii.control,
    backgroundColor: colors.white,
  },
  continueText: { fontFamily: fonts.bodyBold, fontSize: 15, color: ui.brand },
});
