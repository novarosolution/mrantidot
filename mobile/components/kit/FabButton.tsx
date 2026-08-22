import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet } from 'react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { colors } from '@/constants/theme';

/** Shared circular “+” header action used on addresses / payment methods. */
export function FabButton({
  onPress,
  accessibilityLabel = 'Add',
}: {
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.fab, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
    >
      <LinearGradient
        colors={[colors.limeBright, colors.green, colors.forest]}
        style={styles.fill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <PremiumIcon icon={AppIcons.ui.plus} variant="plain" size={22} color={colors.white} />
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  fill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.96 }] },
});
