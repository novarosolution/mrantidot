import { useEffect, type ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IS_WEB, useWideWebLayout } from '@/lib/webAdmin';
import { colors, fonts, spacing, ui } from '@/constants/theme';

/** Widest a sheet gets as a centred dialog on a desktop browser. */
const WEB_DIALOG_WIDTH = 620;

/**
 * Slide-up sheet for edit flows (customer + admin). Height is capped below the status bar / Dynamic Island,
 * the body scrolls, and the footer actions stay pinned above the home indicator.
 */
export function BottomSheet({
  visible,
  onClose,
  title,
  hint,
  children,
  footer,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  hint?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  // Desktop browsers: a centred dialog instead of a full-width sheet; Escape closes it.
  const dialog = useWideWebLayout();
  const maxHeight = dialog ? Math.min(height - 64, 860) : height - insets.top - 16;

  useEffect(() => {
    if (!IS_WEB || !visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible, onClose]);

  return (
    <Modal visible={visible} animationType={dialog ? 'fade' : 'slide'} transparent onRequestClose={onClose} statusBarTranslucent>
      <View style={[styles.backdrop, dialog && styles.backdropDialog]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.sheet, { maxHeight }, dialog && [styles.dialog, { width: Math.min(WEB_DIALOG_WIDTH, width - 48) }]]}>
            {dialog ? null : <View style={styles.handle} />}
            <View style={styles.head}>
              <Text style={styles.title}>{title}</Text>
              {hint ? <Text style={styles.hint}>{hint}</Text> : null}
            </View>
            <ScrollView
              style={styles.body}
              contentContainerStyle={styles.bodyContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
            {footer ? (
              <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>{footer}</View>
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(8,14,10,0.45)' },
  backdropDialog: { justifyContent: 'center', alignItems: 'center' },
  dialog: {
    borderRadius: 24,
    paddingTop: 8,
    boxShadow: '0 24px 64px -24px rgba(8,14,10,0.45)',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: ui.border,
    marginTop: 10,
  },
  head: { paddingHorizontal: spacing.lg, paddingTop: 14, paddingBottom: 6 },
  title: { fontFamily: fonts.displayExtra, fontSize: 20, letterSpacing: -0.4, color: ui.text },
  hint: { marginTop: 4, fontFamily: fonts.body, fontSize: 13.5, lineHeight: 19, color: ui.textSecondary },
  body: { flexGrow: 0 },
  bodyContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md },
  footer: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ui.border,
    backgroundColor: colors.white,
  },
});
