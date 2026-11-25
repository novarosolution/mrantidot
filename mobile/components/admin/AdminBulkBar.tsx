import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCheck, X, type LucideIcon } from 'lucide-react-native';
import { colors, fonts, spacing } from '@/constants/theme';
import { haptic } from '@/lib/motion';
import { IS_WEB, useWideWebLayout } from '@/lib/webAdmin';
import { webModalOpen } from '@/lib/webKeys';

export type BulkAction = {
  key: string;
  /** Desktop label ("Assign technician"). */
  label: string;
  /** Phone label under the icon ("Assign"); defaults to `label`. */
  shortLabel?: string;
  icon: LucideIcon;
  onPress: () => void;
  tone?: 'default' | 'danger';
  disabled?: boolean;
  /** Why it is disabled (tooltip / screen readers). */
  hint?: string;
};

/** Height the list should leave free below its last row while the bar is up. */
export const BULK_BAR_SPACE = 96;

/** Phones: the bar floats above the docked tab bar (62 pt + home indicator). */
const TAB_BAR_HEIGHT = 62;

/**
 * Floating bulk-action bar for selectable admin lists: "5 selected · Assign technician · Cancel ·
 * Export CSV · Clear". A dark pill centred at the bottom of the desktop column; a full-width bar above the
 * tab bar on phones. Escape clears the selection on the web (unless a dialog is open).
 */
export function AdminBulkBar({
  count,
  noun = 'selected',
  actions,
  onClear,
  busy = false,
  busyLabel,
  aboveTabBar = false,
}: {
  count: number;
  /** "selected" by default — e.g. "bookings selected". */
  noun?: string;
  actions: BulkAction[];
  onClear: () => void;
  /** A bulk request is running: actions are disabled and a spinner shows. */
  busy?: boolean;
  busyLabel?: string;
  /** Phone tab screens: sit above the docked tab bar. */
  aboveTabBar?: boolean;
}) {
  const wide = useWideWebLayout();
  const insets = useSafeAreaInsets();
  const visible = count > 0;
  const [mounted, setMounted] = useState(visible);
  const shown = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const lastCount = useRef(count);
  if (visible) lastCount.current = count;

  useEffect(() => {
    if (visible) setMounted(true);
    Animated.timing(shown, {
      toValue: visible ? 1 : 0,
      duration: visible ? 200 : 140,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.quad),
      useNativeDriver: !IS_WEB,
    }).start(({ finished }) => {
      if (finished && !visible) setMounted(false);
    });
  }, [shown, visible]);

  // Escape clears the selection (desktop habit) — never while a dialog or sheet is open.
  const clearRef = useRef(onClear);
  clearRef.current = onClear;
  useEffect(() => {
    if (!IS_WEB || !visible || typeof window === 'undefined') return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented || webModalOpen()) return;
      clearRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible]);

  if (!mounted) return null;

  const n = lastCount.current;
  const bottom = wide ? spacing.lg : (aboveTabBar ? TAB_BAR_HEIGHT + insets.bottom : Math.max(insets.bottom, 0)) + 10;

  return (
    <Animated.View
      pointerEvents={visible ? 'box-none' : 'none'}
      style={[
        styles.wrap,
        { bottom },
        { opacity: shown, transform: [{ translateY: shown.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] },
      ]}
    >
      <View style={[styles.bar, wide ? styles.barWide : styles.barPhone]} accessibilityRole="toolbar" accessibilityLabel={`${n} ${noun}`}>
        <View style={styles.countPill}>
          {busy ? <ActivityIndicator size="small" color={colors.limeOnDark} /> : <CheckCheck size={16} color={colors.limeOnDark} strokeWidth={2.4} />}
          <Text style={styles.countText} numberOfLines={1}>
            {busy && busyLabel ? busyLabel : `${n} ${noun}`}
          </Text>
        </View>
        <View style={[styles.actions, !wide && styles.actionsPhone]}>
          {actions.map((action) => (
            <BarButton key={action.key} action={action} wide={wide} disabled={busy || action.disabled === true} />
          ))}
        </View>
        <Pressable
          onPress={() => {
            haptic('select');
            onClear();
          }}
          disabled={busy}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Clear selection"
          style={({ pressed }) => [styles.clear, pressed && styles.pressed, busy && styles.dim]}
        >
          <X size={16} color={colors.white} strokeWidth={2.4} />
          {wide ? <Text style={styles.clearText}>Clear</Text> : null}
        </Pressable>
      </View>
    </Animated.View>
  );
}

function BarButton({ action, wide, disabled }: { action: BulkAction; wide: boolean; disabled: boolean }) {
  const [hover, setHover] = useState(false);
  const Icon = action.icon;
  const danger = action.tone === 'danger';
  const tint = disabled ? 'rgba(255,255,255,0.38)' : danger ? '#FFB4A6' : colors.white;
  return (
    <Pressable
      onPress={() => {
        haptic('tap');
        action.onPress();
      }}
      disabled={disabled}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      accessibilityRole="button"
      accessibilityLabel={action.hint && disabled ? `${action.label}. ${action.hint}` : action.label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        wide ? styles.btnWide : styles.btnPhone,
        hover && !disabled && (danger ? styles.btnDangerHover : styles.btnHover),
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Icon size={wide ? 16 : 19} color={tint} strokeWidth={2.2} />
      <Text style={[wide ? styles.btnText : styles.btnTextPhone, { color: tint }]} numberOfLines={1}>
        {wide ? action.label : action.shortLabel ?? action.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 20 },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#14201A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#02180C',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.28,
    shadowRadius: 28,
    elevation: 14,
  },
  barWide: { gap: 6, paddingVertical: 8, paddingLeft: 10, paddingRight: 8, borderRadius: 18, maxWidth: '94%' },
  barPhone: {
    alignSelf: 'stretch',
    marginHorizontal: spacing.sm + 4,
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 20,
  },
  countPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    flexShrink: 1,
  },
  countText: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: colors.white, flexShrink: 1 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  actionsPhone: { flex: 1, justifyContent: 'space-around' },
  btnWide: { flexDirection: 'row', alignItems: 'center', gap: 7, height: 36, paddingHorizontal: 12, borderRadius: 11 },
  btnPhone: { alignItems: 'center', justifyContent: 'center', gap: 3, minWidth: 54, height: 44, paddingHorizontal: 6, borderRadius: 12 },
  btnHover: { backgroundColor: 'rgba(255,255,255,0.1)' },
  btnDangerHover: { backgroundColor: 'rgba(255,120,100,0.14)' },
  btnText: { fontFamily: fonts.bodySemi, fontSize: 13.5 },
  btnTextPhone: { fontFamily: fonts.bodySemi, fontSize: 10.5 },
  clear: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    minWidth: 36,
    paddingHorizontal: 10,
    borderRadius: 11,
    justifyContent: 'center',
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: 'rgba(255,255,255,0.16)',
  },
  clearText: { fontFamily: fonts.bodySemi, fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  pressed: { opacity: 0.7 },
  dim: { opacity: 0.4 },
});
