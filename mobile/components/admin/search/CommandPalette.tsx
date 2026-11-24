import { Modal, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { AdminSearchPanel } from './AdminSearchPanel';

/**
 * Desktop command palette (⌘K / Ctrl+K, "/" or the top-bar search field): a centred search card over a
 * dimmed page. The panel mounts fresh on every open (empty box, focus in the input); Escape, a click
 * outside or opening a result closes it.
 */
export function CommandPalette({
  visible,
  onClose,
  openShortcuts,
}: {
  visible: boolean;
  onClose: () => void;
  openShortcuts?: () => void;
}) {
  const { width, height } = useWindowDimensions();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} focusable={false} accessibilityLabel="Close search" />
      <View style={[styles.frame, { paddingTop: Math.max(40, Math.round(height * 0.11)) }]} pointerEvents="box-none">
        <View style={[styles.card, { width: Math.min(680, width - 32) }]} role="dialog" aria-label="Search the admin">
          <AdminSearchPanel variant="palette" onClose={onClose} openShortcuts={openShortcuts} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(8,20,13,0.42)' },
  frame: { ...StyleSheet.absoluteFill, alignItems: 'center' },
  card: {
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(17,26,21,0.08)',
    shadowColor: '#02180C',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.28,
    shadowRadius: 48,
  },
});
