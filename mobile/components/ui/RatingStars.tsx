import { Star } from 'lucide-react-native';
import { useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { PressableScale } from '@/components/ui/PressableScale';
import { colors, spacing, ui } from '@/constants/theme';
import { fillCopy } from '@/constants/customerUiCopy';
import { getReducedMotion } from '@/lib/a11yPrefs';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { haptic } from '@/lib/motion';

interface RatingStarsProps {
  value: number;
  onChange?: (n: number) => void;
  size?: number;
}

/**
 * Five real star buttons (outline → filled) with a selection haptic, a little pop on the picked star
 * and screen-reader labels ("4 out of 5 stars"). Read-only when `onChange` is omitted.
 */
export function RatingStars({ value, onChange, size = 28 }: RatingStarsProps) {
  const copy = useCustomerUiCopy();
  const pops = useRef([1, 2, 3, 4, 5].map(() => new Animated.Value(1))).current;

  function pick(n: number) {
    if (!onChange) return;
    haptic(n === value ? 'tap' : 'select');
    onChange(n);
    if (getReducedMotion()) return;
    const v = pops[n - 1]!;
    v.setValue(0.7);
    Animated.spring(v, { toValue: 1, friction: 4, tension: 160, useNativeDriver: true }).start();
  }

  return (
    <View style={styles.row} accessibilityRole={onChange ? 'radiogroup' : 'image'} accessibilityLabel={fillCopy(copy.reviewStarA11y, { count: value })}>
      {[1, 2, 3, 4, 5].map((n) => {
        const on = n <= value;
        const star = (
          <Animated.View style={{ transform: [{ scale: pops[n - 1]! }] }}>
            <Star size={size} color={on ? colors.amber : ui.border} fill={on ? colors.amber : 'transparent'} strokeWidth={1.6} />
          </Animated.View>
        );
        if (!onChange) return <View key={n}>{star}</View>;
        return (
          <PressableScale
            key={n}
            scaleTo={0.9}
            onPress={() => pick(n)}
            hitSlop={6}
            style={styles.hit}
            accessibilityRole="radio"
            accessibilityState={{ selected: n === value }}
            accessibilityLabel={fillCopy(copy.reviewStarA11y, { count: n })}
          >
            {star}
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.xs },
  hit: { padding: 4 },
});
