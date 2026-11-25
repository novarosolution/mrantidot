import { Check } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { PressableScale } from '@/components/ui/PressableScale';
import { colors, fonts, ui } from '@/constants/theme';
import { fillCopy } from '@/constants/customerUiCopy';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';

export type BookProgressStep = {
  key: string;
  label: string;
  done: boolean;
  onPress: () => void;
};

const DOT = 26;

/**
 * Checkout progress — one dot per thing the booking still needs (address, time, property, payment).
 * Finished steps fill green with a tick, the next one gets a ring, the rest stay quiet. Every step is
 * tappable so the customer can jump straight to it; the sticky button still walks them in order.
 */
export function BookProgress({ steps }: { steps: BookProgressStep[] }) {
  const copy = useCustomerUiCopy();
  const n = steps.length;
  const nextIndex = steps.findIndex((s) => !s.done);
  const doneCount = steps.filter((s) => s.done).length;
  // The green rail runs to the last dot of the unbroken run of finished steps.
  const lastDone = nextIndex === -1 ? n - 1 : nextIndex - 1;
  const fill = n > 1 ? Math.max(0, lastDone) / (n - 1) : 0;
  const inset = `${100 / (n * 2)}%` as const;

  return (
    <View style={styles.card} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: n, now: doneCount }}>
      <View style={styles.track}>
        {/* Rail sits between the first and last dot centre; dots paint over it. */}
        <View style={[styles.rail, { left: inset, right: inset }]}>
          <View style={[styles.railFill, { width: `${fill * 100}%` }]} />
        </View>
        {steps.map((step, i) => {
          const isNext = i === nextIndex;
          return (
            <View key={step.key} style={styles.stepWrap}>
              <PressableScale
                scaleTo={0.92}
                onPress={step.onPress}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={step.done ? fillCopy(copy.cartProgressDoneA11y, { step: step.label }) : step.label}
              >
                <View style={[styles.dot, step.done && styles.dotDone, isNext && styles.dotNext]}>
                  {step.done ? (
                    <Check size={14} color={colors.white} strokeWidth={3} />
                  ) : (
                    <Text style={[styles.dotNum, isNext && styles.dotNumNext]}>{i + 1}</Text>
                  )}
                </View>
              </PressableScale>
            </View>
          );
        })}
      </View>
      <View style={styles.labels}>
        {steps.map((step, i) => (
          <Text key={step.key} style={[styles.label, (step.done || i === nextIndex) && styles.labelOn]} numberOfLines={1}>
            {step.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: ui.hairline,
    paddingTop: 16,
    paddingBottom: 12,
    paddingHorizontal: 6,
    ...ui.shadow,
  },
  track: { flexDirection: 'row', alignItems: 'center', height: DOT },
  rail: { position: 'absolute', top: DOT / 2 - 1, height: 2, borderRadius: 1, backgroundColor: ui.border, overflow: 'hidden' },
  railFill: { height: 2, backgroundColor: ui.brand },
  stepWrap: { flex: 1, alignItems: 'center' },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: ui.border,
  },
  dotDone: { backgroundColor: ui.brand, borderColor: ui.brand },
  dotNext: { borderColor: ui.brand, backgroundColor: ui.brandSoft },
  dotNum: { fontFamily: fonts.bodySemi, fontSize: 12, lineHeight: 15, color: ui.textTertiary },
  dotNumNext: { color: ui.brand },
  labels: { flexDirection: 'row', marginTop: 8 },
  label: { flex: 1, textAlign: 'center', fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 16, color: ui.textTertiary },
  labelOn: { color: ui.text, fontFamily: fonts.bodySemi },
});
