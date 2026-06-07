import { LinearGradient } from 'expo-linear-gradient';
import { AlertTriangle, CheckCircle2, Info, WifiOff, XCircle } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ToastConfig } from 'react-native-toast-message';
import Toast from 'react-native-toast-message';
import { colors, fonts, premium, shadows, spacing } from '@/constants/theme';

type ToastVariant = 'success' | 'error' | 'info' | 'warning' | 'offline';

const VARIANT_META: Record<
  ToastVariant,
  {
    label: string;
    icon: typeof CheckCircle2;
    accent: string;
    accentSoft: string;
    iconColor: string;
    gradient: readonly [string, string];
  }
> = {
  success: {
    label: 'Success',
    icon: CheckCircle2,
    accent: colors.forest,
    accentSoft: colors.soft,
    iconColor: colors.forest,
    gradient: ['#14532D', '#1E8E4E'],
  },
  error: {
    label: 'Error',
    icon: XCircle,
    accent: colors.error,
    accentSoft: colors.errorBg,
    iconColor: colors.error,
    gradient: ['#9B3412', '#C0492E'],
  },
  info: {
    label: 'Info',
    icon: Info,
    accent: colors.secondaryDark,
    accentSoft: colors.secondarySoft,
    iconColor: colors.secondaryInk,
    gradient: ['#2A756A', '#3A9688'],
  },
  warning: {
    label: 'Notice',
    icon: AlertTriangle,
    accent: premium.accentGold,
    accentSoft: premium.accentGoldBg,
    iconColor: premium.accentGold,
    gradient: ['#B6841C', '#D4A017'],
  },
  offline: {
    label: 'Offline',
    icon: WifiOff,
    accent: colors.muted,
    accentSoft: colors.greyBg,
    iconColor: colors.ink,
    gradient: ['#4B5563', '#6E8075'],
  },
};

function PremiumToastCard({
  variant,
  title,
  message,
  onPress,
}: {
  variant: ToastVariant;
  title?: string;
  message?: string;
  onPress?: () => void;
}) {
  const meta = VARIANT_META[variant];
  const Icon = meta.icon;

  return (
    <Pressable onPress={onPress} style={styles.wrap}>
      <View style={styles.card}>
        <LinearGradient colors={[...meta.gradient]} style={styles.accentBar} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />
        <View style={[styles.iconWrap, { backgroundColor: meta.accentSoft }]}>
          <Icon size={20} color={meta.iconColor} strokeWidth={2.2} />
        </View>
        <View style={styles.body}>
          <Text style={styles.badge}>{meta.label}</Text>
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
      </View>
    </Pressable>
  );
}

function makeRenderer(variant: ToastVariant) {
  return function Renderer(props: { text1?: string; text2?: string; hide?: () => void; onPress?: () => void }) {
    return (
      <PremiumToastCard
        variant={variant}
        title={props.text1}
        message={props.text2}
        onPress={() => {
          props.onPress?.();
          props.hide?.();
        }}
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
  topOffset: 54,
  visibilityTime: 3400,
  autoHide: true,
};

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
  duration = TOAST_DEFAULTS.visibilityTime,
  onPress,
}: AppToastOptions): void {
  Toast.show({
    type,
    text1: title,
    text2: message,
    position: TOAST_DEFAULTS.position,
    topOffset: TOAST_DEFAULTS.topOffset,
    visibilityTime: duration,
    autoHide: true,
    onPress,
  });
}

appToast.success = (title: string, message?: string) => appToast({ title, message, type: 'success' });
appToast.error = (title: string, message?: string) => appToast({ title, message, type: 'error' });
appToast.info = (title: string, message?: string) => appToast({ title, message, type: 'info' });
appToast.warning = (title: string, message?: string) => appToast({ title, message, type: 'warning' });
appToast.offline = (title: string, message?: string) => appToast({ title, message, type: 'offline' });

const styles = StyleSheet.create({
  wrap: {
    width: '92%',
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.white,
    borderRadius: premium.radiusCard,
    padding: spacing.md,
    paddingLeft: spacing.sm + 4,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.08)',
    overflow: 'hidden',
    ...shadows.floating,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: premium.radiusCard,
    borderBottomLeftRadius: premium.radiusCard,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  body: { flex: 1, minWidth: 0, paddingTop: 1 },
  badge: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 15,
    lineHeight: 20,
    color: colors.ink,
  },
  message: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted,
    marginTop: 3,
  },
});
