import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowRight, Sparkles } from 'lucide-react-native';
import { ServiceIcon } from '@/components/ServiceIcon';
import { bookingScheduleDisplay, bookingServiceIconKey, bookingServiceName } from '@/lib/booking-helpers';
import type { Booking } from '@/types/api';
import { colors, classic, fonts, premium, shadows, spacing } from '@/constants/theme';

export function BookingsNextHighlight({
  booking,
  onPress,
}: {
  booking: Booking;
  onPress?: () => void;
}) {
  const enter = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ]),
    ).start();
  }, [enter, shimmer]);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}>
      <Animated.View
        style={{
          opacity: enter,
          transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
        }}
      >
        <LinearGradient
          colors={['#14532D', '#1A6B3C', '#0E3A20']}
          style={styles.card}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Animated.View
            style={[
              styles.glow,
              {
                opacity: shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.45] }),
              },
            ]}
          />
          <View style={styles.goldLine} />
          <View style={styles.badgeRow}>
            <Sparkles size={12} color={colors.lime} />
            <Text style={styles.badge}>Up next</Text>
          </View>
          <View style={styles.row}>
            <View style={styles.icon}>
              <ServiceIcon iconKey={bookingServiceIconKey(booking)} size={22} color={colors.lime} />
            </View>
            <View style={styles.body}>
              <Text style={styles.name} numberOfLines={1}>
                {bookingServiceName(booking)}
              </Text>
              <Text style={styles.schedule}>{bookingScheduleDisplay(booking)}</Text>
            </View>
            <View style={styles.cta}>
              <ArrowRight size={16} color={colors.lime} strokeWidth={2.5} />
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  pressed: { opacity: 0.96, transform: [{ scale: 0.995 }] },
  card: {
    borderRadius: premium.radiusCard,
    padding: spacing.md,
    overflow: 'hidden',
    ...shadows.hero,
  },
  glow: {
    position: 'absolute',
    top: -20,
    right: -10,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(168,224,78,0.2)',
  },
  goldLine: {
    position: 'absolute',
    top: 0,
    left: spacing.md,
    right: spacing.md,
    height: 2,
    backgroundColor: classic.headerGoldLine,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: spacing.sm,
    marginTop: 2,
  },
  badge: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    color: colors.lime,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, minWidth: 0 },
  name: { fontFamily: fonts.display, fontSize: 15, color: colors.white },
  schedule: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 3,
  },
  cta: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
