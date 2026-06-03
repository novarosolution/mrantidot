import { Pressable, StyleSheet, View } from 'react-native';
import { colors } from '@/constants/theme';

export function ToggleSwitch({ value, onToggle }: { value: boolean; onToggle: () => void }) {
  return (
    <Pressable onPress={onToggle} style={[styles.track, value ? styles.trackOn : styles.trackOff]}>
      <View style={[styles.thumb, value ? styles.thumbOn : styles.thumbOff]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 40,
    height: 24,
    borderRadius: 999,
    justifyContent: 'center',
  },
  trackOff: { backgroundColor: colors.border },
  trackOn: { backgroundColor: colors.secondaryDark },
  thumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.white,
    position: 'absolute',
  },
  thumbOff: { left: 3 },
  thumbOn: { right: 3 },
});
