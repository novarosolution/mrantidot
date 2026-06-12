import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Clock } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ServiceIcon } from '@/components/ServiceIcon';
import type { Service } from '@/types/api';
import { colors, fonts, gradients, headerTopPad, spacing } from '@/constants/theme';

export function BookServiceStrip({
  service,
  durationLabel,
  onBack,
  title,
  subtitle,
  compact,
}: {
  service: Service;
  durationLabel: string;
  onBack?: () => void;
  title?: string;
  subtitle?: string;
  compact?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const hero = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(hero, {
      toValue: 1,
      duration: 620,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 2400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 2400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [hero, shimmer]);

  const heroStyle = {
    opacity: hero,
    transform: [
      { translateY: hero.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
      { scale: hero.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) },
    ],
  };

  return (
    <LinearGradient
      colors={[...gradients.bookHero]}
      style={[
        styles.wrap,
        compact && styles.wrapCompact,
        onBack ? { paddingTop: headerTopPad(insets.top) } : null,
      ]}
    >
      <Animated.View
        style={[
          styles.glow,
          {
            opacity: shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.7] }),
            transform: [
              {
                scale: shimmer.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }),
              },
            ],
          },
        ]}
      />
      {onBack ? (
        <View style={[styles.navRow, compact && styles.navRowCompact]}>
          <Pressable
            style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
            onPress={onBack}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ChevronLeft size={22} color={colors.white} />
          </Pressable>
          <View style={styles.navText}>
            {title ? (
              <Text style={styles.navTitle} numberOfLines={1}>
                {title}
              </Text>
            ) : null}
            {subtitle ? (
              <Text style={styles.navSub} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
          {compact ? (
            <View style={styles.compactMeta}>
              <Text style={styles.compactName} numberOfLines={1}>
                {service.name}
              </Text>
              <Text style={styles.compactPrice}>₹{service.basePrice}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
      {!compact ? (
      <Animated.View style={[styles.row, heroStyle]}>
        <View style={styles.icon}>
          <ServiceIcon iconKey={service.iconKey} size={28} color={colors.lime} />
        </View>
        <View style={styles.body}>
          <Text style={styles.name} numberOfLines={2}>
            {service.name}
          </Text>
          <View style={styles.metaRow}>
            <View style={styles.pricePill}>
              <Text style={styles.price}>From ₹{service.basePrice}</Text>
            </View>
            <View style={styles.duration}>
              <Clock size={12} color={colors.lime} />
              <Text style={styles.durationText}>{durationLabel}</Text>
            </View>
          </View>
        </View>
      </Animated.View>
      ) : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  wrapCompact: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  glow: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(168,224,78,0.14)',
  },
  navRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md },
  navRowCompact: { marginBottom: 0 },
  compactMeta: { alignItems: 'flex-end', maxWidth: 120 },
  compactName: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.white, textAlign: 'right' },
  compactPrice: { fontFamily: fonts.displayExtra, fontSize: 13, color: colors.lime, marginTop: 2 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.8 },
  navText: { flex: 1, minWidth: 0 },
  navTitle: { fontFamily: fonts.displayExtra, fontSize: 18, color: colors.white },
  navSub: { fontFamily: fonts.body, fontSize: 11.5, color: colors.lime, marginTop: 2, lineHeight: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  icon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, minWidth: 0 },
  name: { fontFamily: fonts.displayExtra, fontSize: 18, color: colors.white, lineHeight: 24 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  pricePill: {
    backgroundColor: 'rgba(168,224,78,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  price: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.lime },
  duration: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  durationText: { fontFamily: fonts.body, fontSize: 12, color: 'rgba(255,255,255,0.9)' },
});
