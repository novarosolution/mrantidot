import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { fillCopy } from '@/constants/customerUiCopy';
import { GlassPanel } from '@/components/kit/GlassScreenKit';
import { LiveBadge } from '@/components/ui/LiveBadge';
import { useReducedMotion } from '@/lib/a11yPrefs';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { motion } from '@/lib/motion';
import { colors, fonts, premium, spacing } from '@/constants/theme';

/**
 * Treatment-step progress (tech job + admin booking). The bar grows with a native-driver `scaleX`
 * from its left edge — no width animation on the JS thread. Callers wrap it in their own entrance.
 */
export function JobProgressCard({
  done,
  total,
  live,
  label,
}: {
  done: number;
  total: number;
  live?: boolean;
  label?: string;
}) {
  const copy = useCustomerUiCopy();
  const reduced = useReducedMotion();
  const ratio = total > 0 ? Math.min(1, Math.max(0, done / total)) : 0;
  const pct = Math.round(ratio * 100);
  const scale = useRef(new Animated.Value(reduced ? ratio : 0)).current;

  useEffect(() => {
    if (reduced) {
      scale.setValue(ratio);
      return;
    }
    const anim = Animated.spring(scale, { toValue: ratio, ...motion.spring, useNativeDriver: true });
    anim.start();
    return () => anim.stop();
  }, [ratio, reduced, scale]);

  const title = label ?? copy.techProgressTreatment;
  const count = fillCopy(copy.techProgressSteps, { done, total });

  return (
    <GlassPanel style={styles.card} padded={false} tone="light">
      <View
        style={styles.inner}
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={title}
        accessibilityValue={{ min: 0, max: 100, now: pct, text: `${count}, ${pct}%` }}
      >
        <View style={styles.head}>
          <Text style={styles.title}>{title}</Text>
          {live ? <LiveBadge label={copy.techLiveBadge} /> : null}
        </View>

        <View style={styles.track}>
          <Animated.View style={[styles.fill, { transform: [{ scaleX: scale }] }]}>
            <LinearGradient
              colors={[colors.limeBright, colors.forestMid, colors.forest]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </Animated.View>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.meta}>{count}</Text>
          <Text style={styles.pct}>{pct}%</Text>
        </View>
      </View>
    </GlassPanel>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: premium.radiusCard },
  inner: { padding: spacing.md },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  title: { fontFamily: fonts.display, fontSize: 15, color: colors.ink },
  track: {
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.soft,
    overflow: 'hidden',
  },
  /** Full-width bar scaled from the left edge; the track's rounded clip shapes its ends. */
  fill: { ...StyleSheet.absoluteFill, transformOrigin: 'left' },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  meta: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  pct: { fontFamily: fonts.displayExtra, fontSize: 14, color: colors.forest },
});
