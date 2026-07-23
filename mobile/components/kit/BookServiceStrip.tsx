import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HeroDarkSlice } from '@/components/kit/HeroDarkSlice';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { ServiceIcon } from '@/components/ServiceIcon';
import type { Service } from '@/types/api';
import { fonts, headerTopPad, premiumType, spacing } from '@/constants/theme';
export function BookServiceStrip({
  service,
  durationLabel,
  onBack,
  title,
  subtitle,
  compact,
  variant = compact ? 'compact' : 'hero',
}: {
  service: Service;
  durationLabel: string;
  onBack?: () => void;
  title?: string;
  subtitle?: string;
  /** @deprecated use variant */
  compact?: boolean;
  variant?: 'hero' | 'slim' | 'compact';
}) {
  const resolvedVariant = compact && variant === 'hero' ? 'compact' : variant;
  const insets = useSafeAreaInsets();
  const hero = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(hero, {
      toValue: 1,
      duration: 560,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [hero]);

  const heroStyle = {
    opacity: hero,
    transform: [
      { translateY: hero.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
    ],
  };

  const isSlim = resolvedVariant === 'slim';
  const isCompact = resolvedVariant === 'compact';
  const sliceH = isSlim ? 14 : isCompact ? 16 : 20;

  return (
    <HeroDarkSlice
      style={styles.shell}
      sliceHeight={sliceH}
      contentStyle={[
        styles.content,
        (isCompact || isSlim) && styles.contentCompact,
        isSlim && styles.contentSlim,
        onBack ? { paddingTop: headerTopPad(insets.top) } : null,
      ]}
    >
      {onBack ? (
        <View style={[styles.navRow, (isCompact || isSlim) && styles.navRowCompact]}>
          <Pressable
            style={({ pressed }) => [styles.backBtn, isSlim && styles.backBtnSlim, pressed && styles.pressed]}
            onPress={onBack}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <PremiumIcon icon={AppIcons.ui.chevronLeft} variant="plain" size={22} color="#FFFFFF" strokeWidth={2.4} />
          </Pressable>
          <View style={styles.navText}>
            {title ? (
              <Text style={[styles.navTitle, isSlim && styles.navTitleSlim]} numberOfLines={1}>
                {title}
              </Text>
            ) : null}
            {isSlim ? (
              <Text style={styles.navSub} numberOfLines={1}>
                {service.name} · {durationLabel}
              </Text>
            ) : subtitle ? (
              <Text style={styles.navSub} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
          {isCompact || isSlim ? (
            <View style={styles.compactMeta}>
              {!isSlim ? (
                <Text style={styles.compactName} numberOfLines={1}>
                  {service.name}
                </Text>
              ) : null}
              <Text style={styles.compactPrice}>₹{service.basePrice}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
      {resolvedVariant === 'hero' ? (
        <Animated.View style={[styles.row, heroStyle]}>
          <ServiceIcon iconKey={service.iconKey} size={24} variant="premium" boxSize={56} color="#FFFFFF" />
          <View style={styles.body}>
            <Text style={styles.name} numberOfLines={2}>
              {service.name}
            </Text>
            <View style={styles.metaRow}>
              <View style={styles.pricePill}>
                <Text style={styles.price}>From ₹{service.basePrice}</Text>
              </View>
              <View style={styles.duration}>
                <PremiumIcon icon={AppIcons.ui.clock} variant="plain" size={12} color="#C8F07A" strokeWidth={2.3} />
                <Text style={styles.durationText}>{durationLabel}</Text>
              </View>
            </View>
          </View>
        </Animated.View>
      ) : null}
    </HeroDarkSlice>
  );
}

const styles = StyleSheet.create({
  shell: {
    marginBottom: -2,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md + 2,
  },
  contentCompact: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  contentSlim: {
    paddingBottom: spacing.xs,
  },
  navRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md },
  navRowCompact: { marginBottom: 0 },
  compactMeta: { alignItems: 'flex-end', maxWidth: 120 },
  compactName: { fontFamily: fonts.bodySemi, fontSize: 11, color: 'rgba(255,255,255,0.92)', textAlign: 'right' },
  compactPrice: { fontFamily: fonts.displayExtra, fontSize: 13, color: '#C8F07A', marginTop: 2 },
  backBtnSlim: {
    width: 36,
    height: 36,
    borderRadius: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.34)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#02180C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  pressed: { opacity: 0.8 },
  navText: { flex: 1, minWidth: 0 },
  navTitle: { ...premiumType.navTitleLight, fontSize: 18, color: '#FFFFFF' },
  navTitleSlim: { fontSize: 16 },
  navSub: { ...premiumType.caption, color: 'rgba(255,255,255,0.86)', marginTop: 2, lineHeight: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  body: { flex: 1, minWidth: 0 },
  name: { ...premiumType.navTitleLight, fontSize: 18, lineHeight: 24, color: '#FFFFFF' },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  pricePill: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  price: { fontFamily: fonts.bodySemi, fontSize: 13, color: '#FFFFFF' },
  duration: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  durationText: { fontFamily: fonts.body, fontSize: 12, color: 'rgba(255,255,255,0.92)' },
});
