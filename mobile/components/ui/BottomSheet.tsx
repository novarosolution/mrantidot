import { type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SheetModal } from '@/components/ui/SheetModal';
import { useWideWebLayout } from '@/lib/webAdmin';
import { colors, spacing, typeScale, ui } from '@/constants/theme';

/**
 * Slide-up sheet for edit flows (customer + admin). The backdrop fades, the sheet springs up and can be
 * dragged down by its handle / title to dismiss. Height is capped below the status bar / Dynamic Island,
 * the body scrolls, and the footer actions stay pinned above the home indicator.
 * On a wide browser it is a centred dialog that closes on Escape.
 */
export function BottomSheet({
  visible,
  onClose,
  onDismissed,
  title,
  hint,
  children,
  footer,
}: {
  visible: boolean;
  onClose: () => void;
  /** Runs once the sheet is fully closed — open the next sheet / picker from here. */
  onDismissed?: () => void;
  title: string;
  hint?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const dialog = useWideWebLayout();
  const maxHeight = dialog ? Math.min(height - 64, 860) : height - insets.top - 16;

  return (
    <SheetModal
      visible={visible}
      onClose={onClose}
      onDismissed={onDismissed}
      maxHeight={maxHeight}
      keyboardAvoiding
      header={
        <View style={[styles.head, dialog && styles.headDialog]}>
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          {hint ? <Text style={styles.hint}>{hint}</Text> : null}
        </View>
      }
    >
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
      {footer ? <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>{footer}</View> : null}
      {!footer && !dialog ? <View style={{ height: Math.max(insets.bottom, spacing.sm) }} /> : null}
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: spacing.lg, paddingTop: 6, paddingBottom: 6 },
  headDialog: { paddingTop: 14 },
  title: { ...typeScale.title, fontSize: 20, lineHeight: 26, color: ui.text },
  hint: { ...typeScale.caption, marginTop: 4, lineHeight: 19, color: ui.textSecondary },
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
