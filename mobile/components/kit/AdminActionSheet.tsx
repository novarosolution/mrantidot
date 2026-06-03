import { type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, premium, spacing } from '@/constants/theme';

export interface ActionSheetOption {
  key: string;
  label: string;
  subtitle?: string;
  destructive?: boolean;
  icon?: ReactNode;
  onPress: () => void;
}

/**
 * Bottom-sheet picker / confirmation that replaces Alert.alert for richer,
 * on-brand admin actions (assign technician, confirm cancel/disable, etc).
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
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handle} />
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <ScrollView style={styles.list} bounces={false}>
            {options.map((opt) => (
              <Pressable
                key={opt.key}
                style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
                onPress={() => {
                  onClose();
                  opt.onPress();
                }}
              >
                {opt.icon ? <View style={styles.optionIcon}>{opt.icon}</View> : null}
                <View style={styles.optionText}>
                  <Text style={[styles.optionLabel, opt.destructive && styles.destructive]}>
                    {opt.label}
                  </Text>
                  {opt.subtitle ? <Text style={styles.optionSub}>{opt.subtitle}</Text> : null}
                </View>
              </Pressable>
            ))}
          </ScrollView>
          <Pressable style={styles.cancel} onPress={onClose}>
            <Text style={styles.cancelText}>{cancelLabel}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: premium.radiusCard,
    borderTopRightRadius: premium.radiusCard,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    ...premium.shadowSoft,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  title: { fontFamily: fonts.displayExtra, fontSize: 17, color: colors.ink },
  message: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 6, lineHeight: 19 },
  list: { marginTop: spacing.md, maxHeight: 360 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionPressed: { opacity: 0.6 },
  optionIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: { flex: 1, minWidth: 0 },
  optionLabel: { fontFamily: fonts.bodySemi, fontSize: 14.5, color: colors.ink },
  optionSub: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 2 },
  destructive: { color: colors.error },
  cancel: {
    marginTop: spacing.md,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.bg,
    alignItems: 'center',
  },
  cancelText: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.muted },
});
