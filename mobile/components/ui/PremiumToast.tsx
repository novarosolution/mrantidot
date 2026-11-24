import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import type { LucideIcon } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
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
import { DEFAULT_CUSTOMER_UI_COPY } from '@/constants/customerUiCopy';
import { colors, fonts, premium, shadows, spacing, surfaces, toastTones } from '@/constants/theme';
import type { CustomerUiCopy } from '@/types/api';

type ToastVariant = 'success' | 'error' | 'info' | 'warning' | 'offline';

type ToastExtraProps = {
  duration?: number;
};

type CopyKey = 'toastLabelSuccess' | 'toastLabelError' | 'toastLabelInfo' | 'toastLabelWarning' | 'toastLabelOffline';

type ToastCopy = Pick<CustomerUiCopy, CopyKey | 'toastDismiss'>;

function pickToastCopy(c: ToastCopy): ToastCopy {
  return {
    toastLabelSuccess: c.toastLabelSuccess,
    toastLabelError: c.toastLabelError,
    toastLabelInfo: c.toastLabelInfo,
    toastLabelWarning: c.toastLabelWarning,
    toastLabelOffline: c.toastLabelOffline,
    toastDismiss: c.toastDismiss,
  };
}

/**
 * Toast labels (variant eyebrow + dismiss button). The root toast host in app/_layout.tsx sits inside the
 * content provider and keeps these in sync with the admin copy through setToastCopy. This file must not
 * import the content context itself: that closed a require cycle (AppContentContext → api → toast → here).
 */
let toastCopy: ToastCopy = pickToastCopy(DEFAULT_CUSTOMER_UI_COPY);

export function setToastCopy(copy: ToastCopy): void {
  toastCopy = pickToastCopy(copy);
}

const VARIANT_META: Record<
  ToastVariant,
  {
    labelKey: CopyKey;
    icon: LucideIcon;
    accentSoft: string;
    badgeColor: string;
    gradient: readonly [string, string];
    progress: string;
    border: string;
  }
> = {
  success: { labelKey: 'toastLabelSuccess', icon: AppIcons.toast.success, badgeColor: colors.green, ...toastTones.success },
  error: { labelKey: 'toastLabelError', icon: AppIcons.toast.error, badgeColor: colors.error, ...toastTones.error },
  info: { labelKey: 'toastLabelInfo', icon: AppIcons.toast.info, badgeColor: colors.secondary, ...toastTones.info },
  warning: { labelKey: 'toastLabelWarning', icon: AppIcons.toast.warn, badgeColor: colors.amberInk, ...toastTones.warning },
  offline: { labelKey: 'toastLabelOffline', icon: AppIcons.toast.offline, badgeColor: toastTones.offline.badge, ...toastTones.offline },
};

/** Time-left rail: a native-driven scaleX from the left edge (no per-frame layout on the JS thread). */
function ProgressRail({ color, duration }: { color: string; duration: number }) {
  const progress = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    progress.setValue(1);
    const anim = Animated.timing(progress, {
      toValue: 0,
      duration: Math.max(800, duration),
      easing: Easing.linear,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [duration, progress]);

  return (
    <View style={styles.progressTrack}>
      <Animated.View style={[styles.progressFill, { backgroundColor: color, transform: [{ scaleX: progress }] }]} />
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
  const label = toastCopy[meta.labelKey];
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
        accessibilityLabel={[label, title, message].filter(Boolean).join('. ')}
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
              <Text style={[styles.badge, { color: meta.badgeColor }]}>{label}</Text>
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
              accessibilityLabel={toastCopy.toastDismiss}
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
    width: '100%',
    transformOrigin: 'left',
  },
});
