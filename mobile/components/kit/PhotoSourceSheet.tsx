import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Camera, ImageIcon, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, premium, spacing } from '@/constants/theme';

export function PhotoSourceSheet({
  visible,
  title = 'Add photo',
  subtitle = 'Take a new photo or choose from your gallery',
  onClose,
  onCamera,
  onGallery,
}: {
  visible: boolean;
  title?: string;
  subtitle?: string;
  onClose: () => void;
  onCamera: () => void;
  onGallery: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.sm }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handle} />
          <Pressable style={styles.close} onPress={onClose} hitSlop={8}>
            <X size={20} color={colors.muted} />
          </Pressable>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          <Pressable
            style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
            onPress={() => {
              onClose();
              onCamera();
            }}
          >
            <View style={[styles.optionIcon, styles.optionIconCamera]}>
              <Camera size={22} color={colors.white} strokeWidth={2.2} />
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionLabel}>Take photo</Text>
              <Text style={styles.optionSub}>Open camera and capture now</Text>
            </View>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
            onPress={() => {
              onClose();
              onGallery();
            }}
          >
            <View style={[styles.optionIcon, styles.optionIconGallery]}>
              <ImageIcon size={22} color={colors.forest} strokeWidth={2.2} />
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionLabel}>Choose from gallery</Text>
              <Text style={styles.optionSub}>Pick one or more saved photos</Text>
            </View>
          </Pressable>

          <Pressable style={styles.cancel} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
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
  close: { position: 'absolute', top: spacing.md, right: spacing.lg, zIndex: 1 },
  title: {
    fontFamily: fonts.displayExtra,
    fontSize: 20,
    color: colors.ink,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: spacing.lg,
    lineHeight: 19,
    paddingHorizontal: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  optionPressed: { opacity: 0.92 },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconCamera: { backgroundColor: colors.forest },
  optionIconGallery: { backgroundColor: colors.soft, borderWidth: 1, borderColor: 'rgba(30,142,78,0.15)' },
  optionText: { flex: 1 },
  optionLabel: { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink },
  optionSub: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 2, lineHeight: 17 },
  cancel: {
    marginTop: spacing.sm,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: colors.bg,
  },
  cancelText: { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.muted },
});
