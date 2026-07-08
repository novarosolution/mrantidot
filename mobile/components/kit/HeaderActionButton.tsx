import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';
import { colors, shadows } from '@/constants/theme';

/** Circular header action — consistent across tab screens. */
export function HeaderActionButton({
  icon: Icon,
  onPress,
  accessibilityLabel,
}: {
  icon: LucideIcon;
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
      onPress={onPress}
      hitSlop={8}
      accessibilityLabel={accessibilityLabel}
    >
      <Icon size={20} color={colors.white} strokeWidth={2.5} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  pressed: { opacity: 0.92, transform: [{ scale: 0.97 }] },
});
