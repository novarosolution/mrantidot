import { useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radii } from '@/constants/theme';
import { useAmbientLoop } from '@/lib/a11yPrefs';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';

type LiveBadgeProps = {
  /** Dark surfaces (booking hero) use lime; light headers use forest. */
  tone?: 'light' | 'dark';
  label?: string;
};

/**
 * Pulsing coloured-dot "Live" pill — shared by customer booking + tech job.
 * The pulse pauses off-screen, in the background and with Reduce Motion (the dot stays lit).
 */
export function LiveBadge({ tone = 'light', label }: LiveBadgeProps) {
  const copy = useCustomerUiCopy();
  const text = label ?? copy.liveBadgeLabel;
  const pulse = useRef(new Animated.Value(1)).current;
  const dark = tone === 'dark';

  useAmbientLoop(
    () =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.35, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      ),
    [pulse],
  );

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={text}
      style={[styles.badge, dark ? styles.badgeDark : styles.badgeLight]}
    >
      <Animated.View
        style={[
          styles.dot,
          { backgroundColor: dark ? colors.lime : colors.forest, transform: [{ scale: pulse }] },
        ]}
      />
      <Text style={[styles.text, dark ? styles.textDark : styles.textLight]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  badgeLight: {
    backgroundColor: 'rgba(220,252,231,0.85)',
    borderColor: 'rgba(10,100,35,0.16)',
  },
  badgeDark: {
    backgroundColor: 'rgba(168,224,78,0.22)',
    borderColor: 'rgba(168,224,78,0.42)',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  textLight: { color: colors.forest },
  textDark: { color: colors.lime },
});
