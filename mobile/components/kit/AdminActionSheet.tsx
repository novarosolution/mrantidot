import { useRef, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableScale } from '@/components/ui/PressableScale';
import { SheetModal } from '@/components/ui/SheetModal';
import { useWideWebLayout } from '@/lib/webAdmin';
import { colors, radii, spacing, typeScale, ui } from '@/constants/theme';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { haptic } from '@/lib/motion';

export interface ActionSheetOption {
  key: string;
  label: string;
  subtitle?: string;
  destructive?: boolean;
  icon?: ReactNode;
  onPress: () => void;
}

/**
 * White bottom-sheet picker / confirmation (instead of a native alert) — options sit in one grouped
 * list with hairline dividers; Cancel is a separate pill below, iOS action-sheet style.
 *
 * Picking an option closes the sheet first and runs the option's `onPress` only once the sheet is
 * gone, so an option may safely open another sheet, the camera or the photo library.
 * On a wide browser it is a centred dialog that closes on Escape.
 */
export function AdminActionSheet({
  visible,
  title,
  message,
  options,
  onClose,
  cancelLabel,
}: {
  visible: boolean;
  title: string;
  message?: string;
  options: ActionSheetOption[];
  onClose: () => void;
  cancelLabel?: string;
}) {
  const insets = useSafeAreaInsets();
  const dialog = useWideWebLayout();
  const copy = useCustomerUiCopy();
  const pending = useRef<(() => void) | null>(null);

  const runPending = () => {
    const next = pending.current;
    pending.current = null;
    next?.();
  };

  return (
    <SheetModal
      visible={visible}
      onClose={() => {
        pending.current = null;
        onClose();
      }}
      onDismissed={runPending}
      dialogWidth={460}
      dialogStyle={styles.dialogPad}
      header={
        <View style={styles.head}>
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
        </View>
      }
    >
      <View style={[styles.body, { paddingBottom: dialog ? spacing.md : Math.max(insets.bottom, spacing.md) }]}>
        <ScrollView style={styles.list} contentContainerStyle={styles.listInner} bounces={false}>
          {options.map((opt, i) => (
            <PressableScale
              key={opt.key}
              scaleTo={0.985}
              style={styles.option}
              onPress={() => {
                haptic(opt.destructive ? 'warning' : 'select');
                pending.current = opt.onPress;
                onClose();
              }}
              accessibilityRole="button"
              accessibilityLabel={opt.subtitle ? `${opt.label}. ${opt.subtitle}` : opt.label}
            >
              {i > 0 ? <View style={styles.divider} /> : null}
              {opt.icon ? <View style={styles.optionIcon}>{opt.icon}</View> : null}
              <View style={styles.optionText}>
                <Text style={[styles.optionLabel, opt.destructive && styles.destructive]}>{opt.label}</Text>
                {opt.subtitle ? <Text style={styles.optionSub}>{opt.subtitle}</Text> : null}
              </View>
            </PressableScale>
          ))}
        </ScrollView>
        <PressableScale
          style={styles.cancel}
          onPress={() => {
            pending.current = null;
            onClose();
          }}
          accessibilityRole="button"
        >
          <Text style={styles.cancelText}>{cancelLabel ?? copy.systemCancel}</Text>
        </PressableScale>
      </View>
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  dialogPad: { paddingTop: 20 },
  head: { paddingHorizontal: spacing.md + 4, paddingTop: 4 },
  title: { ...typeScale.section, fontSize: 19, lineHeight: 25, color: ui.text },
  message: { ...typeScale.caption, marginTop: 4, lineHeight: 19, color: ui.textSecondary },
  body: { paddingHorizontal: spacing.md },
  list: { marginTop: 14, maxHeight: 380 },
  listInner: {
    borderRadius: radii.card,
    backgroundColor: ui.surfaceMuted,
    overflow: 'hidden',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 56,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  divider: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: ui.border,
  },
  optionIcon: { width: 28, alignItems: 'center' },
  optionText: { flex: 1 },
  optionLabel: { ...typeScale.rowTitle, color: ui.text },
  optionSub: { ...typeScale.caption, fontSize: 12.5, marginTop: 2, color: ui.textSecondary },
  destructive: { color: colors.error },
  cancel: {
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: colors.white,
  },
  cancelText: { ...typeScale.button, color: ui.text },
});
