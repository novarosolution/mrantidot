import type { LucideIcon } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet } from 'react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { IconGradients } from '@/constants/appIcons';
import { shadows } from '@/constants/theme';

/** Circular header action — consistent across tab screens. */
export function HeaderActionButton({
  icon,
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
      <LinearGradient colors={[...IconGradients.forest]} style={styles.grad} start={{ x: 0.2, y: 0 }} end={{ x: 0.9, y: 1 }}>
        <PremiumIcon icon={icon} variant="plain" size="lg" color="#FFFFFF" strokeWidth={2.3} />
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    ...shadows.card,
  },
  grad: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.92, transform: [{ scale: 0.97 }] },
});
