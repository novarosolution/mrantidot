import { Plus } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';

/** Circular add action for admin list headers. */
export function AdminAddButton({ onPress }: { label?: string; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Add"
      hitSlop={6}
    >
      <Plus size={20} color={colors.white} strokeWidth={2.5} />
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
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.97 }] },
});
