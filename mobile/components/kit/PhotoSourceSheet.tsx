import { StyleSheet, View } from 'react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AdminActionSheet } from '@/components/kit/AdminActionSheet';
import { AppIcons } from '@/constants/appIcons';
import { colors, radii, ui } from '@/constants/theme';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';

/**
 * "Take photo / Choose from gallery" picker on the shared action sheet. The camera or library opens
 * only after the sheet has fully closed (iOS can't present a picker while a modal is dismissing).
 */
export function PhotoSourceSheet({
  visible,
  title,
  subtitle,
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
  const copy = useCustomerUiCopy();
  return (
    <AdminActionSheet
      visible={visible}
      title={title ?? copy.photoSheetTitle}
      message={subtitle ?? copy.photoSheetSub}
      onClose={onClose}
      options={[
        {
          key: 'camera',
          label: copy.photoTake,
          subtitle: copy.photoTakeSub,
          icon: (
            <View style={[styles.icon, styles.iconCamera]}>
              <PremiumIcon icon={AppIcons.ui.camera} variant="plain" size={18} color={colors.white} strokeWidth={2.2} />
            </View>
          ),
          onPress: onCamera,
        },
        {
          key: 'gallery',
          label: copy.photoGallery,
          subtitle: copy.photoGallerySub,
          icon: (
            <View style={[styles.icon, styles.iconGallery]}>
              <PremiumIcon icon={AppIcons.ui.image} variant="plain" size={18} color={ui.brand} strokeWidth={2.2} />
            </View>
          ),
          onPress: onGallery,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  icon: { width: 36, height: 36, borderRadius: radii.thumb, alignItems: 'center', justifyContent: 'center' },
  iconCamera: { backgroundColor: ui.brand },
  iconGallery: { backgroundColor: ui.brandSoft },
});
