import { Keyboard, X } from 'lucide-react-native';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { colors, fonts, ui } from '@/constants/theme';
import { modKeyLabel } from '@/lib/webKeys';

type Shortcut = { keys: string[]; label: string; then?: boolean };

function groups(mod: string): { title: string; items: Shortcut[] }[] {
  return [
    {
      title: 'Anywhere',
      items: [
        { keys: ['/'], label: 'Search' },
        { keys: [mod, 'K'], label: 'Open or close search' },
        { keys: ['N'], label: 'New booking' },
        { keys: ['?'], label: 'Show these shortcuts' },
      ],
    },
    {
      title: 'Go to',
      items: [
        { keys: ['G', 'D'], label: 'Dashboard', then: true },
        { keys: ['G', 'B'], label: 'Bookings', then: true },
        { keys: ['G', 'C'], label: 'Customers', then: true },
        { keys: ['G', 'T'], label: 'Technicians', then: true },
        { keys: ['G', 'S'], label: 'Services', then: true },
        { keys: ['G', 'R'], label: 'Reports', then: true },
      ],
    },
    {
      title: 'Search',
      items: [
        { keys: ['↑', '↓'], label: 'Move between results' },
        { keys: ['↵'], label: 'Open the highlighted result' },
        { keys: ['Esc'], label: 'Close' },
      ],
    },
    {
      title: 'Lists',
      items: [
        { keys: ['Shift', 'Click'], label: 'Select a range of rows' },
        { keys: ['Esc'], label: 'Clear the selection' },
      ],
    },
  ];
}

function Keys({ keys, then }: { keys: string[]; then?: boolean }) {
  return (
    <View style={styles.keys}>
      {keys.map((k, i) => (
        <View key={`${k}-${i}`} style={styles.keyWrap}>
          {i > 0 ? <Text style={styles.joiner}>{then ? 'then' : '+'}</Text> : null}
          <View style={styles.kbd}>
            <Text style={styles.kbdText}>{k}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

/** "?" on the admin web: every keyboard shortcut in one card. Single keys are ignored while typing. */
export function ShortcutsDialog({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { width, height } = useWindowDimensions();
  const twoCols = width >= 760;
  const list = groups(modKeyLabel());
  const columns = twoCols ? [list.slice(0, 2), list.slice(2)] : [list];
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} focusable={false} accessibilityLabel="Close shortcuts" />
      <View style={styles.frame} pointerEvents="box-none">
        <View style={[styles.card, { width: Math.min(twoCols ? 720 : 440, width - 32), maxHeight: height - 64 }]} role="dialog" aria-label="Keyboard shortcuts">
          <View style={styles.head}>
            <View style={styles.headIcon}>
              <Keyboard size={19} color={colors.forest} strokeWidth={2.2} />
            </View>
            <View style={styles.headText}>
              <Text style={styles.title}>Keyboard shortcuts</Text>
              <Text style={styles.sub}>Single keys work anywhere except while typing in a field.</Text>
            </View>
            <Pressable onPress={onClose} style={({ pressed }) => [styles.close, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel="Close">
              <X size={17} color={ui.textSecondary} strokeWidth={2.3} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={[styles.body, twoCols && styles.bodyCols]}>
            {columns.map((col, ci) => (
              <View key={ci} style={twoCols ? styles.col : undefined}>
                {col.map((group) => (
                  <View key={group.title} style={styles.group}>
                    <Text style={styles.groupTitle}>{group.title}</Text>
                    {group.items.map((item) => (
                      <View key={`${group.title}-${item.label}`} style={styles.item}>
                        <Text style={styles.itemLabel}>{item.label}</Text>
                        <Keys keys={item.keys} then={item.then} />
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(8,20,13,0.42)' },
  frame: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  card: {
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(17,26,21,0.08)',
    shadowColor: '#02180C',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.26,
    shadowRadius: 48,
    overflow: 'hidden',
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ui.border,
  },
  headIcon: { width: 38, height: 38, borderRadius: 11, backgroundColor: ui.brandSoft, alignItems: 'center', justifyContent: 'center' },
  headText: { flex: 1, minWidth: 0 },
  title: { fontFamily: fonts.displayExtra, fontSize: 17, color: ui.text, letterSpacing: -0.3 },
  sub: { fontFamily: fonts.body, fontSize: 12.5, color: ui.textSecondary, marginTop: 2 },
  close: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.7 },
  body: { padding: 20, gap: 18 },
  bodyCols: { flexDirection: 'row', gap: 28 },
  col: { flex: 1, gap: 18 },
  group: { gap: 2 },
  groupTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 10.5,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: ui.textTertiary,
    marginBottom: 6,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    minHeight: 36,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ui.hairline,
  },
  itemLabel: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 13.5, color: ui.text },
  keys: { flexDirection: 'row', alignItems: 'center' },
  keyWrap: { flexDirection: 'row', alignItems: 'center' },
  joiner: { fontFamily: fonts.body, fontSize: 11.5, color: ui.textTertiary, marginHorizontal: 5 },
  kbd: {
    minWidth: 26,
    height: 26,
    paddingHorizontal: 7,
    borderRadius: 7,
    borderWidth: 1,
    borderBottomWidth: 2,
    borderColor: ui.border,
    backgroundColor: '#FAFBFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kbdText: { fontFamily: fonts.bodySemi, fontSize: 12, color: ui.text },
});
