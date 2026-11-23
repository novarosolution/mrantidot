import { CircleQuestionMark, Info, ListChecks, TriangleAlert, type LucideIcon } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, ui } from '@/constants/theme';
import { setWebDialogPresenter, type WebDialogButton, type WebDialogRequest } from '@/lib/confirm';

type Pending = WebDialogRequest & { id: number; resolve: (value: string | null) => void };

/** Which button gets keyboard focus: the solid action (confirm / notice), else the first choice. */
function primaryIndex(buttons: WebDialogButton[]): number {
  const solid = buttons.findIndex((b) => b.tone === 'primary' || b.tone === 'destructive');
  if (solid >= 0) return solid;
  const choice = buttons.findIndex((b) => b.tone !== 'cancel');
  return choice >= 0 ? choice : 0;
}

function dialogIcon(request: WebDialogRequest): { icon: LucideIcon; color: string; bg: string } {
  if (request.buttons.some((b) => b.tone === 'destructive') && request.layout === 'row') {
    return { icon: TriangleAlert, color: colors.error, bg: colors.errorBg };
  }
  if (request.layout === 'column') return { icon: ListChecks, color: colors.forest, bg: ui.brandSoft };
  if (request.buttons.length === 1) return { icon: Info, color: colors.forest, bg: ui.brandSoft };
  return { icon: CircleQuestionMark, color: colors.forest, bg: ui.brandSoft };
}

function DialogButton({
  button,
  stretch,
  onPress,
  buttonRef,
}: {
  button: WebDialogButton;
  stretch: boolean;
  onPress: () => void;
  buttonRef?: (node: View | null) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const tone = button.tone;
  return (
    <Pressable
      ref={buttonRef}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      accessibilityRole="button"
      accessibilityLabel={button.label}
      style={({ pressed }) => [
        styles.button,
        stretch && styles.buttonStretch,
        tone === 'primary' && styles.buttonPrimary,
        tone === 'destructive' && styles.buttonDestructive,
        tone === 'default' && styles.buttonDefault,
        tone === 'cancel' && styles.buttonCancel,
        hovered && tone === 'primary' && styles.buttonPrimaryHover,
        hovered && tone === 'destructive' && styles.buttonDestructiveHover,
        hovered && (tone === 'default' || tone === 'cancel') && styles.buttonQuietHover,
        focused && [styles.focusGlow, { shadowColor: tone === 'destructive' ? colors.error : colors.forest }],
        focused && (tone === 'default' || tone === 'cancel') && styles.focusBorder,
        pressed && styles.buttonPressed,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          (tone === 'primary' || tone === 'destructive') && styles.buttonTextSolid,
          tone === 'default' && styles.buttonTextDefault,
        ]}
        numberOfLines={1}
      >
        {button.label}
      </Text>
    </Pressable>
  );
}

function DialogCard({ request, onClose }: { request: Pending; onClose: (value: string | null) => void }) {
  const enter = useRef(new Animated.Value(0)).current;
  const focusTarget = useRef<View | null>(null);
  const focusIndex = primaryIndex(request.buttons);
  const { icon: Icon, color, bg } = dialogIcon(request);
  const column = request.layout === 'column';
  const actions = column ? request.buttons.filter((b) => b.tone !== 'cancel') : request.buttons;
  const cancel = column ? request.buttons.find((b) => b.tone === 'cancel') : undefined;

  useEffect(() => {
    Animated.timing(enter, { toValue: 1, duration: 180, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    // After the modal's focus trap has run: the primary action is ready for Enter.
    const timer = setTimeout(() => focusTarget.current?.focus(), 30);
    return () => clearTimeout(timer);
  }, [enter]);

  const press = (button: WebDialogButton) => onClose(button.tone === 'cancel' ? null : button.value);

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: enter,
          transform: [
            { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
            { scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) },
          ],
        },
      ]}
      role="alertdialog"
      aria-label={request.message ? `${request.title}. ${request.message}` : request.title}
    >
      <View style={styles.head}>
        <View style={[styles.iconBox, { backgroundColor: bg }]}>
          <Icon size={20} color={color} strokeWidth={2.2} />
        </View>
        <View style={styles.headText}>
          <Text style={styles.title}>{request.title}</Text>
          {request.message ? <Text style={styles.message}>{request.message}</Text> : null}
        </View>
      </View>

      <View style={column ? styles.actionsColumn : styles.actionsRow}>
        {actions.map((button) => (
          <DialogButton
            key={`${button.tone}-${button.value}-${button.label}`}
            button={button}
            stretch={column}
            onPress={() => press(button)}
            buttonRef={
              request.buttons.indexOf(button) === focusIndex
                ? (node) => {
                    focusTarget.current = node;
                  }
                : undefined
            }
          />
        ))}
      </View>
      {cancel ? (
        <View style={styles.cancelRow}>
          <DialogButton button={cancel} stretch={false} onPress={() => press(cancel)} />
        </View>
      ) : null}
    </Animated.View>
  );
}

/**
 * Web only — the in-app dialog behind `confirmAsync`, `chooseAsync` and `notify` (lib/confirm.ts): title,
 * message, the real button labels, red destructive actions, several choices, Escape or a click outside to
 * cancel and keyboard focus on the primary action. Requests queue up and show one at a time. Mount once
 * (app/(admin)/_layout.tsx); native keeps `Alert.alert`.
 */
export function WebDialogHost() {
  const [queue, setQueue] = useState<Pending[]>([]);
  /** The dialog that just closed — kept on screen while the modal fades out. */
  const [leaving, setLeaving] = useState<Pending | null>(null);
  const queueRef = useRef<Pending[]>([]);
  const nextId = useRef(1);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    setWebDialogPresenter(
      (request) =>
        new Promise<string | null>((resolve) => {
          const id = nextId.current++;
          setQueue((list) => [...list, { ...request, id, resolve }]);
        }),
    );
    return () => {
      setWebDialogPresenter(null);
      // Signed out / unmounted with dialogs open: they count as cancelled.
      queueRef.current.forEach((pending) => pending.resolve(null));
    };
  }, []);

  /** Close the dialog on top (only if it is still `id` — a double click never closes the next one). */
  const close = useCallback((id: number | null, value: string | null) => {
    const head = queueRef.current[0];
    if (!head || (id != null && head.id !== id)) return;
    head.resolve(value);
    queueRef.current = queueRef.current.slice(1);
    setLeaving(head);
    setQueue((list) => list.filter((pending) => pending.id !== head.id));
  }, []);

  const current = queue[0];
  const shown = current ?? leaving;

  return (
    <Modal
      visible={Boolean(current)}
      transparent
      animationType="fade"
      onRequestClose={() => close(current?.id ?? null, null)}
      onDismiss={() => setLeaving(null)}
    >
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => close(current?.id ?? null, null)}
          accessibilityLabel="Close dialog"
          focusable={false}
        />
        {shown ? <DialogCard key={shown.id} request={shown} onClose={(value) => close(shown.id, value)} /> : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(2,24,12,0.42)',
  },
  card: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 22,
    backgroundColor: colors.white,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    borderWidth: 1,
    borderColor: ui.hairline,
    shadowColor: '#02180C',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.22,
    shadowRadius: 48,
  },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  headText: { flex: 1, minWidth: 0, paddingTop: 1 },
  title: { fontFamily: fonts.displayExtra, fontSize: 18, lineHeight: 24, letterSpacing: -0.35, color: ui.text },
  message: { marginTop: 6, fontFamily: fonts.body, fontSize: 14.5, lineHeight: 21, color: ui.textSecondary },
  actionsRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 24 },
  actionsColumn: { gap: 8, marginTop: 20 },
  cancelRow: { alignItems: 'flex-end', marginTop: 10 },
  button: {
    minHeight: 44,
    minWidth: 96,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  buttonStretch: { alignSelf: 'stretch' },
  buttonPrimary: { backgroundColor: colors.forest },
  buttonPrimaryHover: { backgroundColor: colors.headerDeep },
  buttonDestructive: { backgroundColor: colors.error },
  buttonDestructiveHover: { backgroundColor: '#962F1B' },
  buttonDefault: { backgroundColor: colors.white, borderColor: ui.border },
  buttonCancel: { backgroundColor: 'transparent' },
  buttonQuietHover: { backgroundColor: ui.surfaceMuted },
  buttonPressed: { opacity: 0.86 },
  /** Keyboard focus: a soft glow in the button's colour (the primary action starts focused). */
  focusGlow: { shadowOpacity: 0.45, shadowRadius: 7, shadowOffset: { width: 0, height: 0 } },
  focusBorder: { borderColor: colors.forest },
  buttonText: { fontFamily: fonts.bodyBold, fontSize: 14.5, letterSpacing: -0.1, color: ui.textSecondary },
  buttonTextSolid: { color: colors.white },
  buttonTextDefault: { color: ui.text },
});
