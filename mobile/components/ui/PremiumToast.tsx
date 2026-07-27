import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import type { LucideIcon } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { ToastConfig, ToastConfigParams } from 'react-native-toast-message';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { colors, fonts, premium, shadows, spacing, surfaces } from '@/constants/theme';

type ToastVariant = 'success' | 'error' | 'info' | 'warning' | 'offline';

type ToastExtraProps = {
  duration?: number;
};

const VARIANT_META: Record<
  ToastVariant,
  {
    label: string;
    icon: LucideIcon;
    accent: string;
    accentSoft: string;
    iconColor: string;
    badgeColor: string;
    gradient: readonly [string, string];
    progress: string;
    border: string;
  }
> = {
  success: {
    label: 'Success',
    icon: AppIcons.toast.success,
    accent: colors.forest,
    accentSoft: 'rgba(31,154,62,0.14)',
    iconColor: colors.forest,
    badgeColor: colors.green,
    gradient: ['#0A6423', '#27A747'],
    progress: '#27A747',
    border: 'rgba(180,220,165,0.95)',
  },
  error: {
    label: 'Error',
    icon: AppIcons.toast.error,
    accent: colors.error,
    accentSoft: colors.errorBg,
    iconColor: colors.error,
    badgeColor: colors.error,
    gradient: ['#9B3412', '#C0492E'],
    progress: '#C0492E',
    border: 'rgba(245,180,160,0.9)',
  },
  info: {
    label: 'Info',
    icon: AppIcons.toast.info,
    accent: colors.secondaryDark,
    accentSoft: colors.secondarySoft,
    iconColor: colors.secondaryInk,
    badgeColor: colors.secondary,
    gradient: ['#22685E', '#3A9688'],
    progress: '#3A9688',
    border: 'rgba(160,210,200,0.95)',
  },
  warning: {
    label: 'Notice',
    icon: AppIcons.toast.warn,
    accent: premium.accentGold,
    accentSoft: premium.accentGoldBg,
    iconColor: colors.amberInk,
    badgeColor: colors.amberInk,
    gradient: ['#B6841C', '#D4A017'],
    progress: '#D4A017',
    border: 'rgba(245,184,46,0.55)',
  },
  offline: {
    label: 'Offline',
    icon: AppIcons.toast.offline,
    accent: colors.muted,
    accentSoft: colors.greyBg,
    iconColor: colors.ink,
    badgeColor: '#4B5563',
    gradient: ['#374151', '#6E8075'],
    progress: '#6E8075',
    border: 'rgba(160,175,165,0.85)',
  },
};

function ProgressRail({ color, duration }: { color: string; duration: number }) {
  const width = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    width.setValue(1);
    const anim = Animated.timing(width, {
      toValue: 0,
      duration: Math.max(800, duration),
      useNativeDriver: false,
    });
    anim.start();
    return () => anim.stop();
  }, [duration, width]);

  return (
    <View style={styles.progressTrack}>
      <Animated.View
        style={[
          styles.progressFill,
          {
            backgroundColor: color,
            width: width.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      />
    </View>
  );
}

function PremiumToastCard({
  variant,
  title,
  message,
  duration,
  onPress,
  onHide,
}: {
  variant: ToastVariant;
  title?: string;
  message?: string;
  duration: number;
  onPress?: () => void;
  onHide?: () => void;
}) {
  const meta = VARIANT_META[variant];
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(enter, {
      toValue: 1,
      friction: 8,
      tension: 120,
      useNativeDriver: true,
    }).start();
  }, [enter]);

  return (
    <Animated.View
      style={[
        styles.wrap,
        {
          opacity: enter,
          transform: [
            {
              translateY: enter.interpolate({
                inputRange: [0, 1],
                outputRange: [-18, 0],
              }),
            },
            {
              scale: enter.interpolate({
                inputRange: [0, 1],
                outputRange: [0.96, 1],
              }),
            },
          ],
        },
      ]}
    >
      <Pressable
        onPress={() => {
          onPress?.();
          onHide?.();
        }}
        style={({ pressed }) => [styles.press, pressed && styles.pressActive]}
        accessibilityRole="alert"
        accessibilityLabel={[meta.label, title, message].filter(Boolean).join('. ')}
      >
        <View style={[styles.card, { borderColor: meta.border }]}>
          {Platform.OS !== 'web' ? (
            <BlurView intensity={Platform.OS === 'ios' ? 48 : 64} tint="light" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.webFrost]} />
          )}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: surfaces.glassSoft }]} />
          <LinearGradient
            colors={['rgba(255,255,255,0.92)', 'rgba(255,255,255,0.55)', 'rgba(234,246,227,0.42)']}
            locations={[0, 0.45, 1]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.05, y: 0 }}
            end={{ x: 0.95, y: 1 }}
            pointerEvents="none"
          />
          <LinearGradient
            colors={[...meta.gradient]}
            style={styles.accentBar}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
          <View style={[styles.iconGlow, { backgroundColor: meta.accentSoft }]} />
          <View style={styles.row}>
            <LinearGradient colors={[...meta.gradient]} style={styles.iconWrap} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <PremiumIcon icon={meta.icon} variant="plain" size={18} color={colors.white} strokeWidth={2.35} />
            </LinearGradient>
            <View style={styles.body}>
              <Text style={[styles.badge, { color: meta.badgeColor }]}>{meta.label}</Text>
              {title ? (
                <Text style={styles.title} numberOfLines={2}>
                  {title}
                </Text>
              ) : null}
              {message ? (
                <Text style={styles.message} numberOfLines={3}>
                  {message}
                </Text>
              ) : null}
            </View>
            <Pressable
              hitSlop={10}
              onPress={(e) => {
                e.stopPropagation?.();
                onHide?.();
              }}
              style={styles.dismiss}
              accessibilityRole="button"
              accessibilityLabel="Dismiss notification"
            >
              <PremiumIcon icon={AppIcons.ui.close} variant="plain" size={15} color={colors.muted} strokeWidth={2.2} />
            </Pressable>
          </View>
          <ProgressRail color={meta.progress} duration={duration} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

function makeRenderer(variant: ToastVariant) {
  return function Renderer(params: ToastConfigParams<ToastExtraProps>) {
    const duration = params.props?.duration ?? TOAST_DEFAULTS.visibilityTimeFor(variant);
    return (
      <PremiumToastCard
        variant={variant}
        title={params.text1}
        message={params.text2}
        duration={duration}
        onPress={params.onPress}
        onHide={params.hide}
      />
    );
  };
}

/** Global toast skin — wire into `<Toast config={premiumToastConfig} />`. */
export const premiumToastConfig: ToastConfig = {
  success: makeRenderer('success'),
  error: makeRenderer('error'),
  info: makeRenderer('info'),
  warning: makeRenderer('warning'),
  offline: makeRenderer('offline'),
};

export const TOAST_DEFAULTS = {
  position: 'top' as const,
  topOffset: 12,
  visibilityTime: 3200,
  autoHide: true,
  visibilityTimeFor(type: ToastVariant): number {
    if (type === 'error' || type === 'offline') return 4200;
    if (type === 'warning') return 3600;
    return 3200;
  },
};

/** Safe top offset that clears the status bar / notch. */
export function useToastTopOffset(): number {
  const insets = useSafeAreaInsets();
  return Math.max(insets.top, 12) + TOAST_DEFAULTS.topOffset;
}

export type AppToastType = 'success' | 'error' | 'info' | 'warning' | 'offline';

export type AppToastOptions = {
  title: string;
  message?: string;
  type?: AppToastType;
  duration?: number;
  onPress?: () => void;
};

/** Preferred in-app toast helper — consistent timing, position, and premium styling. */
export function appToast({
  title,
  message,
  type = 'success',
  duration,
  onPress,
}: AppToastOptions): void {
  const visibilityTime = duration ?? TOAST_DEFAULTS.visibilityTimeFor(type);
  Toast.show({
    type,
    text1: title,
    text2: message,
    position: TOAST_DEFAULTS.position,
    visibilityTime,
    autoHide: true,
    swipeable: true,
    onPress,
    props: { duration: visibilityTime } satisfies ToastExtraProps,
  });
}

appToast.success = (title: string, message?: string) => appToast({ title, message, type: 'success' });
appToast.error = (title: string, message?: string) => appToast({ title, message, type: 'error' });
appToast.info = (title: string, message?: string) => appToast({ title, message, type: 'info' });
appToast.warning = (title: string, message?: string) => appToast({ title, message, type: 'warning' });
appToast.offline = (title: string, message?: string) => appToast({ title, message, type: 'offline' });

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    paddingHorizontal: spacing.md,
  },
  press: {
    borderRadius: premium.radiusCard,
  },
  pressActive: {
    opacity: 0.94,
    transform: [{ scale: 0.985 }],
  },
  card: {
    borderRadius: premium.radiusCard,
    overflow: 'hidden',
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.72)',
    ...shadows.floating,
  },
  webFrost: {
    backgroundColor: 'rgba(255,255,255,0.94)',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  iconGlow: {
    position: 'absolute',
    left: 10,
    top: 10,
    width: 56,
    height: 56,
    borderRadius: 28,
    opacity: 0.9,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm + 2,
    paddingTop: spacing.md - 2,
    paddingBottom: spacing.sm + 2,
    paddingLeft: spacing.md + 2,
    paddingRight: spacing.sm + 2,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  body: { flex: 1, minWidth: 0, paddingTop: 1, paddingRight: 2 },
  badge: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.75,
    marginBottom: 3,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 15.5,
    lineHeight: 21,
    color: colors.ink,
  },
  message: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted,
    marginTop: 3,
  },
  dismiss: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(180,220,165,0.55)',
    marginTop: 2,
  },
  progressTrack: {
    height: 3,
    backgroundColor: 'rgba(7,26,14,0.06)',
  },
  progressFill: {
    height: '100%',
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
});
