import { StyleSheet, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { colors, fonts, spacing } from '@/constants/theme';

export interface TimelineStep {
  title: string;
  done: boolean;
}

export function StepTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <View style={styles.wrap}>
      {steps.map((step, i) => (
        <View key={step.title} style={styles.row}>
          <View style={styles.col}>
            <View style={[styles.dot, step.done && styles.dotDone]}>
              {step.done ? <Check size={10} color="#fff" strokeWidth={3} /> : null}
            </View>
            {i < steps.length - 1 ? (
              <View style={[styles.line, step.done && steps[i + 1]?.done && styles.lineDone]} />
            ) : null}
          </View>
          <Text style={[styles.label, !step.done && styles.labelMuted]}>{step.title}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.md },
  row: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
  col: { alignItems: 'center', width: 24, marginRight: spacing.sm },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: { backgroundColor: colors.green, borderColor: colors.green },
  line: { width: 2, height: 24, backgroundColor: colors.border, marginTop: 2 },
  lineDone: { backgroundColor: colors.green },
  label: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ink, flex: 1, paddingTop: 1 },
  labelMuted: { color: colors.muted },
});
