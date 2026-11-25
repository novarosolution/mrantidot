import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { IS_WEB, useWideWebLayout } from '@/lib/webAdmin';
import { colors, radii, scrim, ui } from '@/constants/theme';
import { getReducedMotion } from '@/lib/a11yPrefs';
import { motion } from '@/lib/motion';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';

/** Drag the sheet down this far (or flick it) to dismiss. */
const DISMISS_DISTANCE = 110;
const DISMISS_VELOCITY = 1.1;

/**
 * The one modal surface for sheets and action sheets.
 *
 * Phones (and narrow browsers): the backdrop fades while the sheet springs up from the bottom; drag the
 * handle / header down (or flick) to dismiss, tap the backdrop, Android back or the VoiceOver escape
 * gesture. `onDismissed` runs once the sheet is fully gone — open the next modal / picker from there,
 * never in the same tick as closing this one.
 *
 * Wide browsers (admin web): a centred dialog that fades, closes on Escape — unchanged.
 */
export function SheetModal({
  visible,
  onClose,
  onDismissed,
  header,
  children,
  maxHeight,
  dialogWidth = 620,
  keyboardAvoiding = false,
  sheetStyle,
  dialogStyle,
}: {
  visible: boolean;
  onClose: () => void;
  /** Runs after the close animation and the native modal dismissal have finished. */
  onDismissed?: () => void;
  /** Title area — part of the drag zone together with the handle. */
  header?: ReactNode;
  children: ReactNode;
  maxHeight?: number;
  dialogWidth?: number;
  /** Lift the sheet above the keyboard (forms). */
  keyboardAvoiding?: boolean;
  sheetStyle?: StyleProp<ViewStyle>;
  /** Extra style for the wide-web dialog card. */
  dialogStyle?: StyleProp<ViewStyle>;
}) {
  const dialog = useWideWebLayout();
  const copy = useCustomerUiCopy();
  const { width, height } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);
  const [sheetH, setSheetH] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;
  const drag = useRef(new Animated.Value(0)).current;
  const dismissedFired = useRef(true);

  // While it animates out, keep showing what was on screen when it was closed — callers often clear
  // the state the content is built from (e.g. `setMenuFor(null)`) in the same tick.
  const frozen = useRef({ header, children });
  if (visible) frozen.current = { header, children };
  const shownHeader = visible ? header : frozen.current.header;
  const shownChildren = visible ? children : frozen.current.children;

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const onDismissedRef = useRef(onDismissed);
  onDismissedRef.current = onDismissed;

  const fireDismissed = () => {
    if (dismissedFired.current) return;
    dismissedFired.current = true;
    onDismissedRef.current?.();
  };

  // Escape closes on the web (dialog and narrow sheet alike).
  useEffect(() => {
    if (!IS_WEB || !visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible]);

  // Open / close choreography (sheet mode).
  useEffect(() => {
    if (dialog) {
      if (visible) dismissedFired.current = false;
      else if (!dismissedFired.current) {
        const t = setTimeout(fireDismissed, 0);
        return () => clearTimeout(t);
      }
      return;
    }
    if (visible) {
      dismissedFired.current = false;
      setMounted(true);
      drag.setValue(0);
      // Re-opened while still closing: rise from where it is instead of jumping to the bottom.
      if (!mounted) progress.setValue(0);
      const anim = getReducedMotion()
        ? Animated.timing(progress, { toValue: 1, duration: motion.duration.fast, useNativeDriver: true })
        : Animated.spring(progress, { toValue: 1, ...motion.springSheet, useNativeDriver: true });
      // Next frame, so the first layout has happened and the sheet starts from below the screen.
      const raf = requestAnimationFrame(() => anim.start());
      return () => {
        cancelAnimationFrame(raf);
        anim.stop();
      };
    }
    if (!mounted) return;
    const anim = Animated.timing(progress, {
      toValue: 0,
      duration: getReducedMotion() ? motion.duration.fast : motion.duration.base,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    });
    anim.start(({ finished }) => {
      if (finished) setMounted(false);
    });
    return () => anim.stop();
    // `mounted` is read, not tracked: this effect reacts to `visible` changes only.
  }, [visible, dialog]);

  // After the modal is gone: iOS reports it through Modal.onDismiss; elsewhere the next frame is enough.
  useEffect(() => {
    if (dialog || mounted || dismissedFired.current) return;
    // iOS normally fires Modal.onDismiss first; the timer is only a safety net.
    const t = setTimeout(fireDismissed, Platform.OS === 'ios' ? 450 : 0);
    return () => clearTimeout(t);
  }, [mounted, dialog]);

  // Travel is the window height (known before layout), so the open spring never re-targets mid-flight.
  const translateY = useMemo(() => {
    if (getReducedMotion()) return drag;
    return Animated.add(
      progress.interpolate({ inputRange: [0, 1], outputRange: [height, 0], extrapolate: 'clamp' }),
      drag,
    );
  }, [drag, height, progress]);
  const fadeSpan = sheetH || height;
  const backdropOpacity = useMemo(
    () =>
      Animated.multiply(
        progress,
        drag.interpolate({ inputRange: [0, fadeSpan], outputRange: [1, 0.25], extrapolate: 'clamp' }),
      ),
    [drag, fadeSpan, progress],
  );

  const sheetHRef = useRef(sheetH);
  sheetHRef.current = sheetH;
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => g.dy > 4 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_e, g) => drag.setValue(Math.max(0, g.dy)),
      onPanResponderRelease: (_e, g) => {
        const far = g.dy > Math.min(DISMISS_DISTANCE, (sheetHRef.current || 400) * 0.35);
        if (far || g.vy > DISMISS_VELOCITY) {
          onCloseRef.current();
          return;
        }
        Animated.spring(drag, { toValue: 0, ...motion.springSnappy, useNativeDriver: true }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(drag, { toValue: 0, ...motion.springSnappy, useNativeDriver: true }).start();
      },
    }),
  ).current;

  if (dialog) {
    return (
      <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose} statusBarTranslucent>
        <View style={[styles.backdrop, styles.backdropDialog]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={copy.systemClose} />
          <View
            style={[
              styles.sheet,
              styles.dialog,
              { width: Math.min(dialogWidth, width - 48), maxHeight: maxHeight ?? Math.min(height - 64, 860) },
              dialogStyle,
            ]}
          >
            {shownHeader}
            {shownChildren}
          </View>
        </View>
      </Modal>
    );
  }

  const onLayout = (e: LayoutChangeEvent) => {
    const h = Math.round(e.nativeEvent.layout.height);
    if (h && Math.abs(h - sheetH) > 1) setSheetH(h);
  };

  const sheet = (
    <Animated.View
      onLayout={onLayout}
      accessibilityViewIsModal
      onAccessibilityEscape={onClose}
      style={[
        styles.sheet,
        styles.sheetEdge,
        maxHeight ? { maxHeight } : null,
        sheetStyle,
        { transform: [{ translateY }] },
        getReducedMotion() ? { opacity: progress } : null,
      ]}
    >
      <View {...pan.panHandlers} style={styles.grab}>
        <View style={styles.handleHit} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <View style={styles.handle} />
        </View>
        {shownHeader}
      </View>
      {shownChildren}
    </Animated.View>
  );

  return (
    <Modal
      visible={mounted}
      animationType="none"
      transparent
      onRequestClose={onClose}
      onDismiss={Platform.OS === 'ios' ? fireDismissed : undefined}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <View style={styles.backdrop}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, { opacity: backdropOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel={copy.systemClose} />
        </Animated.View>
        {keyboardAvoiding ? (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>{sheet}</KeyboardAvoidingView>
        ) : (
          sheet
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  backdropDialog: { justifyContent: 'center', alignItems: 'center', backgroundColor: scrim },
  scrim: { backgroundColor: scrim },
  sheet: { backgroundColor: colors.white, overflow: 'hidden' },
  sheetEdge: { borderTopLeftRadius: radii.sheet, borderTopRightRadius: radii.sheet },
  dialog: {
    borderRadius: radii.sheet,
    paddingTop: 8,
    boxShadow: '0 24px 64px -24px rgba(8,14,10,0.45)',
  },
  grab: { paddingBottom: 2 },
  /** Taller than the bar so the handle is easy to catch. */
  handleHit: { alignItems: 'center', paddingTop: 10, paddingBottom: 6 },
  handle: { width: 40, height: 5, borderRadius: radii.pill, backgroundColor: ui.border },
});
