import { LinearGradient } from 'expo-linear-gradient';
import { type LucideIcon } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, classic, fonts, gradients, premium, spacing } from '@/constants/theme';

const DEFAULT_LABELS = ['Schedule', 'Address', 'Payment', 'Confirm'];

export function WizardStepBar({
  step,
  onStepPress,
  labels = DEFAULT_LABELS,
  icons,
  compact,
}: {
  step: number;
  onStepPress?: (index: number) => void;
  labels?: string[];
  icons?: LucideIcon[];
  compact?: boolean;
}) {
  const progress = ((step + 1) / labels.length) * 100;
  const animProgress = useRef(new Animated.Value(progress)).current;
  const dotScales = useRef(labels.map(() => new Animated.Value(1))).current;

  useEffect(() => {
    Animated.spring(animProgress, {
      toValue: progress,
      friction: 9,
      tension: 55,
      useNativeDriver: false,
    }).start();

    if (dotScales[step]) {
      Animated.sequence([
        Animated.timing(dotScales[step], {
          toValue: 1.12,
          duration: 160,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(dotScales[step], {
          toValue: 1,
          friction: 6,
          tension: 120,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [animProgress, dotScales, progress, step]);

  const fillWidth = animProgress.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      {!compact ? <View style={styles.goldRule} /> : null}
      <View style={styles.progressMeta}>
        <Text style={styles.progressLabel}>
          Step {step + 1} of {labels.length}
        </Text>
        <Text style={styles.progressStep} numberOfLines={1}>
          {labels[step]}
        </Text>
      </View>
      <View style={[styles.track, compact && styles.trackCompact]}>
        <Animated.View style={[styles.fillWrap, { width: fillWidth }]}>
          <LinearGradient
            colors={[gradients.primary[0], gradients.primary[1], colors.secondaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.fill}
          />
        </Animated.View>
      </View>
      <View style={styles.steps}>
        {labels.map((label, i) => {
          const done = i < step;
          const active = i === step;
          const canJump = done && !!onStepPress;
          const StepIcon = icons?.[i];
          const content = (
            <>
              <Animated.View
                style={[
                  styles.dot,
                  done && styles.dotDone,
                  active && styles.dotActive,
                  { transform: [{ scale: dotScales[i] ?? 1 }] },
                ]}
              >
                {done ? (
                  <Text style={[styles.dotText, styles.dotTextOn]}>✓</Text>
                ) : active && StepIcon ? (
                  <StepIcon size={15} color={colors.white} strokeWidth={2.4} />
                ) : (
                  <Text style={[styles.dotText, active && styles.dotTextOn]}>{String(i + 1)}</Text>
                )}
              </Animated.View>
              {!compact ? (
                <Text style={[styles.label, active && styles.labelActive, done && styles.labelDone]} numberOfLines={1}>
                  {label}
                </Text>
              ) : null}
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
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: premium.surfaceElevated,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  wrapCompact: {
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  goldRule: {
    height: 2,
    borderRadius: 1,
    backgroundColor: classic.headerGoldLine,
    marginBottom: spacing.sm,
    opacity: 0.85,
  },
  progressMeta: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: spacing.sm,
  },
  progressLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  progressStep: {
    flex: 1,
    fontFamily: fonts.display,
    fontSize: 14,
    color: colors.forest,
    textAlign: 'right',
  },
  track: {
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  trackCompact: { marginBottom: spacing.sm },
  fillWrap: { height: '100%' },
  fill: { flex: 1, borderRadius: 3 },
  steps: { flexDirection: 'row', justifyContent: 'space-between' },
  item: { flex: 1, alignItems: 'center', gap: 6 },
  itemPressed: { opacity: 0.6 },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.greyBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.06)',
  },
  dotDone: { backgroundColor: colors.forest, borderColor: colors.forest },
  dotActive: {
    backgroundColor: colors.secondaryDark,
    borderColor: colors.secondaryDark,
    ...premium.shadowSoft,
  },
  dotText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.muted },
  dotTextOn: { color: colors.white },
  label: { fontFamily: fonts.body, fontSize: 9.5, color: colors.muted, textAlign: 'center' },
  labelActive: { fontFamily: fonts.bodySemi, color: colors.forest, fontSize: 10 },
  labelDone: { color: colors.forest },
});
