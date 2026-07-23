import { type ReactNode } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { glassSkin } from '@/components/kit/GlassScreenKit';
import { colors, fonts, premium, spacing, surfaces } from '@/constants/theme';

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
        {Platform.OS !== 'web' ? (
          <BlurView intensity={18} tint="dark" style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.webBackdrop]} pointerEvents="none" />
        )}
        <Pressable
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}
          onPress={(e) => e.stopPropagation()}
        >
          {Platform.OS !== 'web' ? (
            <BlurView intensity={48} tint="light" style={StyleSheet.absoluteFill} />
          ) : null}
          <View style={styles.sheetTint} pointerEvents="none" />
          <View style={styles.sheetBody}>
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
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(4,56,19,0.28)', justifyContent: 'flex-end' },
  webBackdrop: { backgroundColor: 'rgba(4,56,19,0.45)' },
  sheet: {
    ...glassSkin.sheet,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: 3,
    borderTopColor: '#8FD03C',
    ...premium.shadowSoft,
  },
  sheetTint: {
    ...StyleSheet.absoluteFill,
    backgroundColor: surfaces.glassPanelTint,
  },
  sheetBody: { zIndex: 1 },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(216,237,200,0.95)',
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
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
    marginBottom: 8,
  },
  optionPressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
  optionIcon: { width: 36, alignItems: 'center' },
  optionText: { flex: 1 },
  optionLabel: { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink },
  optionSub: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 2 },
  destructive: { color: colors.error },
  cancel: {
    marginTop: spacing.sm,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
  },
  cancelText: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.forest },
});
