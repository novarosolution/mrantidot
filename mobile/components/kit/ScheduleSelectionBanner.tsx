import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { CalendarCheck2 } from 'lucide-react-native';
import { colors, fonts, gradients, spacing } from '@/constants/theme';

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
      <LinearGradient
        colors={['#E8F5EC', '#F0FAF3', colors.white]}
        style={styles.wrap}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.iconWrap}>
          <CalendarCheck2 size={20} color={colors.forest} strokeWidth={2.2} />
        </View>
        <View style={styles.textCol}>
          <Text style={styles.kicker}>Your visit</Text>
          <Text style={styles.text}>{label}</Text>
        </View>
        <LinearGradient
          colors={[gradients.primary[0], gradients.primary[1]]}
          style={styles.confirmedPill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.confirmedText}>Ready</Text>
        </LinearGradient>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outer: { marginTop: spacing.xs },
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(30,142,78,0.18)',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(30,142,78,0.12)',
  },
  textCol: { flex: 1, minWidth: 0 },
  kicker: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    color: colors.green,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  text: {
    fontFamily: fonts.display,
    fontSize: 14,
    color: colors.forest,
    marginTop: 3,
    lineHeight: 20,
  },
  confirmedPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  confirmedText: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: colors.white,
  },
});
