import { LinearGradient } from 'expo-linear-gradient';
import { Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, fonts, gradients, shadows, spacing } from '@/constants/theme';

/** Shared cyan "+ Add" header action used across admin list screens. */
export function AdminAddButton({ label = 'Add', onPress }: { label?: string; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
    >
      <LinearGradient colors={[...gradients.primary]} style={styles.gradient}>
        <Plus size={15} color={colors.white} />
        <Text style={styles.text}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { borderRadius: 12, overflow: 'hidden', ...shadows.floating },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
  },
  pressed: { opacity: 0.88 },
  text: { fontFamily: fonts.display, fontSize: 12, color: colors.white },
});
