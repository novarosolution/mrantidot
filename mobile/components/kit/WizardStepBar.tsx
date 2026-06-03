import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, gradients, premium, spacing } from '@/constants/theme';

const DEFAULT_LABELS = ['Schedule', 'Address', 'Payment', 'Confirm'];

export function WizardStepBar({
  step,
  onStepPress,
  labels = DEFAULT_LABELS,
}: {
  step: number;
  onStepPress?: (index: number) => void;
  labels?: string[];
}) {
  const progress = ((step + 1) / labels.length) * 100;

  return (
    <View style={styles.wrap}>
      <View style={styles.track}>
        <LinearGradient
          colors={[gradients.primary[0], gradients.primary[1], colors.secondaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.fill, { width: `${progress}%` }]}
        />
      </View>
      <View style={styles.steps}>
        {labels.map((label, i) => {
          const done = i < step;
          const active = i === step;
          const canJump = done && !!onStepPress;
          const content = (
            <>
              <View style={[styles.dot, done && styles.dotDone, active && styles.dotActive]}>
                <Text style={[styles.dotText, (done || active) && styles.dotTextOn]}>
                  {done ? '✓' : String(i + 1)}
                </Text>
              </View>
              <Text style={[styles.label, active && styles.labelActive, done && styles.labelDone]} numberOfLines={1}>
                {label}
              </Text>
            </>
          );
          if (canJump) {
            return (
              <Pressable
                key={label}
                style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
                onPress={() => onStepPress(i)}
                hitSlop={6}
              >
                {content}
              </Pressable>
            );
          }
          return (
            <View key={label} style={styles.item}>
              {content}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: premium.surfaceElevated,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 3 },
  steps: { flexDirection: 'row', justifyContent: 'space-between' },
  item: { flex: 1, alignItems: 'center', gap: 8 },
  itemPressed: { opacity: 0.6 },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.greyBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: { backgroundColor: colors.green },
  dotActive: {
    backgroundColor: colors.secondaryDark,
    ...premium.shadowSoft,
  },
  dotText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.muted },
  dotTextOn: { color: colors.white },
  label: { fontFamily: fonts.body, fontSize: 10, color: colors.muted, textAlign: 'center' },
  labelActive: { fontFamily: fonts.bodySemi, color: colors.secondaryInk, fontSize: 11 },
  labelDone: { color: colors.green },
});
