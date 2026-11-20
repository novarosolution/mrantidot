import { memo } from 'react';
import { LayoutAnimation, Pressable, StyleSheet, View } from 'react-native';
import { ArrowDown, ArrowUp } from 'lucide-react-native';
import { haptic } from '@/lib/motion';
import { colors, ui } from '@/constants/theme';

/** Returns a copy of `list` with the item at `from` moved to `to` (indexes clamped). */
export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  const next = [...list];
  if (from < 0 || from >= next.length) return next;
  const target = Math.max(0, Math.min(next.length - 1, to));
  const [item] = next.splice(from, 1);
  next.splice(target, 0, item as T);
  return next;
}

/** Smooth slide for the next layout change (reorders, add/remove rows). */
export function animateNextLayout(): void {
  LayoutAnimation.configureNext(LayoutAnimation.create(200, 'easeInEaseOut', 'opacity'));
}

/** Compact up / down pair for reordering rows. Disabled at the ends of the list. */
export const ReorderButtons = memo(function ReorderButtons({
  index,
  count,
  onMove,
  label,
}: {
  index: number;
  count: number;
  onMove: (from: number, to: number) => void;
  /** Spoken name of the row, e.g. "Hero banner". */
  label?: string;
}) {
  const canUp = index > 0;
  const canDown = index < count - 1;
  const press = (to: number) => {
    haptic('select');
    animateNextLayout();
    onMove(index, to);
  };
  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => press(index - 1)}
        disabled={!canUp}
        hitSlop={6}
        style={({ pressed }) => [styles.btn, !canUp && styles.off, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={label ? `Move ${label} up` : 'Move up'}
        accessibilityState={{ disabled: !canUp }}
      >
        <ArrowUp size={16} color={canUp ? ui.brand : ui.textTertiary} strokeWidth={2.4} />
      </Pressable>
      <Pressable
        onPress={() => press(index + 1)}
        disabled={!canDown}
        hitSlop={6}
        style={({ pressed }) => [styles.btn, !canDown && styles.off, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={label ? `Move ${label} down` : 'Move down'}
        accessibilityState={{ disabled: !canDown }}
      >
        <ArrowDown size={16} color={canDown ? ui.brand : ui.textTertiary} strokeWidth={2.4} />
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', gap: 6 },
  btn: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: ui.brandSoft,
    borderWidth: 1,
    borderColor: ui.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  off: { backgroundColor: colors.white, opacity: 0.55 },
  pressed: { opacity: 0.7, transform: [{ scale: 0.96 }] },
});
