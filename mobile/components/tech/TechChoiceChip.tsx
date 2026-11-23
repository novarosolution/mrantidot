import { StyleSheet, View } from 'react-native';
import { Chip } from '@/components/ui/Chip';
import { PressableScale } from '@/components/ui/PressableScale';

/**
 * Kit `Chip` inside a full 44 pt touch target with the shared press spring and a selection haptic.
 * The chip itself only draws (touches go to the outer target), so its look stays the kit's.
 */
export function TechChoiceChip({
  label,
  selected,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  return (
    <PressableScale
      haptic="select"
      onPress={onPress}
      containerStyle={styles.target}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel ?? label}
    >
      <View pointerEvents="none">
        <Chip label={label} selected={selected} />
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  target: { minHeight: 44, justifyContent: 'center' },
});
