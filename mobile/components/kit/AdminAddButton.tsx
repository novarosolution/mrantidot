import { LinearGradient } from 'expo-linear-gradient';
import { Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, fonts, premium, spacing } from '@/constants/theme';

/** Shared "+ Add" header action used across admin list screens. */
export function AdminAddButton({ label = 'Add', onPress }: { label?: string; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
    >
      <LinearGradient
        colors={['#33C76A', '#1E8E4E', '#14532D']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Plus size={16} color={colors.white} strokeWidth={2.5} />
        <Text style={styles.text}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: 14,
    overflow: 'hidden',
    ...premium.shadowSoft,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  pressed: { opacity: 0.92, transform: [{ scale: 0.98 }] },
  text: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.white },
});
