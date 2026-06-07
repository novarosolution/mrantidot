import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, classic, fonts, gradients, premium, spacing } from '@/constants/theme';

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
    <View style={styles.wrap}>
      <View style={styles.goldRule} />
      <View style={styles.track}>
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
                <Text style={[styles.dotText, (done || active) && styles.dotTextOn]}>
                  {done ? '✓' : String(i + 1)}
                </Text>
              </Animated.View>
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
  goldRule: {
    height: 2,
    borderRadius: 1,
    backgroundColor: classic.headerGoldLine,
    marginBottom: spacing.sm,
    opacity: 0.85,
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  fillWrap: { height: '100%' },
  fill: { flex: 1, borderRadius: 3 },
  steps: { flexDirection: 'row', justifyContent: 'space-between' },
  item: { flex: 1, alignItems: 'center', gap: 8 },
  itemPressed: { opacity: 0.6 },
  dot: {
    width: 34,
    height: 34,
    borderRadius: 17,
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
