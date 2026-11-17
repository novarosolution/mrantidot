import { type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, spacing, ui } from '@/constants/theme';

export interface ActionSheetOption {
  key: string;
  label: string;
  subtitle?: string;
  destructive?: boolean;
  icon?: ReactNode;
  onPress: () => void;
}

/**
 * White bottom-sheet picker / confirmation (replaces Alert.alert) — options sit in one grouped
 * list with hairline dividers; Cancel is a separate pill below, iOS action-sheet style.
 */
export function AdminActionSheet({
  visible,
  title,
  message,
  options,
  onClose,
  cancelLabel = 'Cancel',
}: {
  visible: boolean;
  title: string;
  message?: string;
  options: ActionSheetOption[];
  onClose: () => void;
  cancelLabel?: string;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <View style={styles.handle} />
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <ScrollView style={styles.list} contentContainerStyle={styles.listInner} bounces={false}>
            {options.map((opt, i) => (
              <Pressable
                key={opt.key}
                style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
                onPress={() => {
                  onClose();
                  opt.onPress();
                }}
                accessibilityRole="button"
              >
                {i > 0 ? <View style={styles.divider} /> : null}
                {opt.icon ? <View style={styles.optionIcon}>{opt.icon}</View> : null}
                <View style={styles.optionText}>
                  <Text style={[styles.optionLabel, opt.destructive && styles.destructive]}>{opt.label}</Text>
                  {opt.subtitle ? <Text style={styles.optionSub}>{opt.subtitle}</Text> : null}
                </View>
              </Pressable>
            ))}
          </ScrollView>
          <Pressable
            style={({ pressed }) => [styles.cancel, pressed && styles.optionPressed]}
            onPress={onClose}
            accessibilityRole="button"
          >
            <Text style={styles.cancelText}>{cancelLabel}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(8,14,10,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.md,
    paddingTop: 10,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: ui.border,
    marginBottom: 14,
  },
  title: { fontFamily: fonts.displayExtra, fontSize: 19, letterSpacing: -0.3, color: ui.text, paddingHorizontal: 4 },
  message: { fontFamily: fonts.body, fontSize: 13.5, color: ui.textSecondary, marginTop: 4, lineHeight: 19, paddingHorizontal: 4 },
  list: { marginTop: 14, maxHeight: 380 },
  listInner: {
    borderRadius: 18,
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
  optionPressed: { backgroundColor: '#EEF2EF' },
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
  optionLabel: { fontFamily: fonts.bodySemi, fontSize: 15.5, color: ui.text },
  optionSub: { fontFamily: fonts.body, fontSize: 12.5, color: ui.textSecondary, marginTop: 2 },
  destructive: { color: colors.error },
  cancel: {
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: colors.white,
  },
  cancelText: { fontFamily: fonts.bodyBold, fontSize: 15.5, color: ui.text },
});
