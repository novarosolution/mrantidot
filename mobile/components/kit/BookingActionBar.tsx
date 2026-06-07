import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { colors, classic, spacing } from '@/constants/theme';

export function BookingActionBar({
  primaryTitle,
  onPrimary,
  primaryLoading,
  primaryDisabled,
  secondaryTitle,
  onSecondary,
}: {
  primaryTitle: string;
  onPrimary: () => void;
  primaryLoading?: boolean;
  primaryDisabled?: boolean;
  secondaryTitle?: string;
  onSecondary?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const slide = useRef(new Animated.Value(20)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slide, { toValue: 0, friction: 10, tension: 65, useNativeDriver: true }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, slide]);

  return (
    <Animated.View
      style={[
        styles.bar,
        {
          paddingBottom: Math.max(insets.bottom, spacing.sm) + spacing.sm,
          opacity,
          transform: [{ translateY: slide }],
        },
      ]}
    >
      <View style={styles.goldAccent} />
      <View style={styles.buttons}>
        {secondaryTitle && onSecondary ? (
          <Button
            title={secondaryTitle}
            variant="secondary"
            fullWidth={false}
            onPress={onSecondary}
            style={styles.secondary}
          />
        ) : null}
        <Button
          title={primaryTitle}
          variant="premium"
          fullWidth={false}
          onPress={onPrimary}
          loading={primaryLoading}
          disabled={primaryDisabled}
          style={secondaryTitle ? styles.primary : styles.primaryFull}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
  goldAccent: {
    position: 'absolute',
    top: 0,
    left: spacing.lg,
    right: spacing.lg,
    height: 2,
    borderRadius: 1,
    backgroundColor: classic.headerGoldLine,
  },
  buttons: { flexDirection: 'row', gap: spacing.sm },
  secondary: { flex: 1, minHeight: 50 },
  primary: { flex: 2, minHeight: 50 },
  primaryFull: { flex: 1, minHeight: 50 },
});
