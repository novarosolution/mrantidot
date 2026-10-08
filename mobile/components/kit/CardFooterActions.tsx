import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, ui } from '@/constants/theme';

type Action = { label: string; onPress: () => void; tone?: 'brand' | 'danger' };

/** Inline action row for the bottom of a list card (Set default · Delete). */
export function CardFooterActions({ actions, note }: { actions: Action[]; note?: string }) {
  return (
    <View style={styles.row}>
      {note ? <Text style={styles.note}>{note}</Text> : <View style={styles.spacer} />}
      <View style={styles.actions}>
        {actions.map((a) => (
          <Pressable
            key={a.label}
            onPress={a.onPress}
            accessibilityRole="button"
            accessibilityLabel={a.label}
            hitSlop={6}
            style={({ pressed }) => [styles.btn, a.tone === 'danger' && styles.btnDanger, pressed && styles.pressed]}
          >
            <Text style={[styles.btnText, a.tone === 'danger' && styles.btnTextDanger]}>{a.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ui.border,
  },
  spacer: { flex: 1 },
  note: { flex: 1, fontFamily: fonts.bodySemi, fontSize: 12, color: ui.textSecondary },
  actions: { flexDirection: 'row', gap: 8 },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: ui.brandSoft,
  },
  btnDanger: { backgroundColor: colors.errorBg },
  pressed: { opacity: 0.8 },
  btnText: { fontFamily: fonts.bodyBold, fontSize: 12.5, color: ui.brand },
  btnTextDanger: { color: colors.error },
});
