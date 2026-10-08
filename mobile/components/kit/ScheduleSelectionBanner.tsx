import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { colors, fonts, spacing, ui } from '@/constants/theme';

export function ScheduleSelectionBanner({ label }: { label: string }) {
  const scale = useRef(new Animated.Value(0.96)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 8, tension: 80, useNativeDriver: true }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [label, opacity, scale]);

  return (
    <Animated.View style={[styles.outer, { opacity, transform: [{ scale }] }]}>
      <View style={styles.wrap}>
        <View style={styles.iconWrap}>
          <PremiumIcon icon={AppIcons.ui.calendarCheck} variant="plain" size={18} color={ui.brand} />
        </View>
        <View style={styles.textCol}>
          <Text style={styles.kicker}>Your visit</Text>
          <Text style={styles.text}>{label}</Text>
        </View>
        <View style={styles.confirmedPill}>
          <Text style={styles.confirmedText}>Ready</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outer: { marginTop: spacing.xs },
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ui.hairline,
    backgroundColor: ui.brandSoft,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: ui.hairline,
  },
  textCol: { flex: 1, minWidth: 0 },
  kicker: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: ui.brand,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  text: {
    fontFamily: fonts.display,
    fontSize: 14,
    color: ui.text,
    marginTop: 3,
    lineHeight: 20,
  },
  confirmedPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: ui.brand,
  },
  confirmedText: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: colors.white,
  },
});
