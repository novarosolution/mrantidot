import { Pressable, StyleSheet, View } from 'react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { colors, ui } from '@/constants/theme';

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
      <View style={styles.fill}>
        <PremiumIcon icon={AppIcons.ui.plus} variant="plain" size={22} color={colors.white} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    width: 44,
    height: 44,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: ui.brand,
  },
  fill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.96 }] },
});
