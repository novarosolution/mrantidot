import { LocateFixed, MapPinOff } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { useReducedMotion } from '@/lib/a11yPrefs';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { colors, ui } from '@/constants/theme';

export type LocationPhase = 'locating' | 'failed' | 'denied' | 'off';
export type LocationChoice = 'skip' | 'retry' | 'settings' | 'cancel';

/** Soft radar pulse behind the locate icon while GPS is searching (still for reduce-motion users). */
function Pulse({ active }: { active: boolean }) {
  const reduced = useReducedMotion();
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active || reduced) {
      t.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(t, { toValue: 1, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [active, reduced, t]);
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.pulse,
        {
          opacity: t.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }),
          transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [1, 1.9] }) }],
        },
      ]}
    />
  );
}

/**
 * Step-photo location states: searching (with "use last known location" / cancel), no fix (try again),
 * permission denied or location services off (open settings).
 */
export function TechLocationSheet({
  phase,
  onChoose,
}: {
  /** null = closed. */
  phase: LocationPhase | null;
  onChoose: (choice: LocationChoice) => void;
}) {
  const copy = useCustomerUiCopy();
  const locating = phase === 'locating';
  const title =
    phase === 'failed'
      ? copy.techGpsFailTitle
      : phase === 'denied'
        ? copy.techGpsDeniedTitle
        : phase === 'off'
          ? copy.techGpsOffTitle
          : copy.techGpsLocatingTitle;
  const hint =
    phase === 'failed'
      ? copy.techGpsFailText
      : phase === 'denied'
        ? copy.techGpsDeniedText
        : phase === 'off'
          ? copy.techGpsOffText
          : copy.techGpsLocatingText;

  return (
    <BottomSheet
      visible={phase !== null}
      onClose={() => onChoose('cancel')}
      title={title}
      hint={hint}
      footer={
        <>
          {locating ? (
            <Button title={copy.techGpsUseLastKnown} variant="secondary" onPress={() => onChoose('skip')} />
          ) : phase === 'failed' ? (
            <Button title={copy.techRetry} onPress={() => onChoose('retry')} />
          ) : (
            <Button title={copy.techOpenSettings} onPress={() => onChoose('settings')} />
          )}
          <Button title={copy.techCancel} variant="ghost" onPress={() => onChoose('cancel')} />
        </>
      }
    >
      <View style={styles.art} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Pulse active={locating} />
        <View style={[styles.icon, !locating && styles.iconWarn]}>
          {locating ? (
            <LocateFixed size={28} color={colors.white} strokeWidth={2.2} />
          ) : (
            <MapPinOff size={28} color={colors.error} strokeWidth={2.2} />
          )}
        </View>
      </View>
    </BottomSheet>
  );
}

const ICON = 64;

const styles = StyleSheet.create({
  art: { height: ICON + 36, alignItems: 'center', justifyContent: 'center' },
  pulse: {
    position: 'absolute',
    width: ICON,
    height: ICON,
    borderRadius: ICON / 2,
    backgroundColor: ui.brandBright,
  },
  icon: {
    width: ICON,
    height: ICON,
    borderRadius: ICON / 2,
    backgroundColor: ui.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWarn: { backgroundColor: colors.errorBg },
});
