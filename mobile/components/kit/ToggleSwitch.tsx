import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, gradients, premium } from '@/constants/theme';

export function ToggleSwitch({ value, onToggle }: { value: boolean; onToggle: () => void }) {
  return (
    <Pressable onPress={onToggle} style={styles.hit} hitSlop={6}>
      {value ? (
        <LinearGradient colors={[...gradients.primary]} style={styles.trackOn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <View style={[styles.thumb, styles.thumbOn]} />
        </LinearGradient>
      ) : (
        <View style={styles.trackOff}>
          <View style={[styles.thumb, styles.thumbOff]} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: { padding: 2 },
  trackOff: {
    width: 52,
    height: 30,
    borderRadius: 999,
    backgroundColor: colors.border,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.08)',
  },
  trackOn: {
    width: 52,
    height: 30,
    borderRadius: 999,
    justifyContent: 'center',
    ...premium.shadowSoft,
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.white,
    position: 'absolute',
    shadowColor: '#0E3A20',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  thumbOff: { left: 3 },
  thumbOn: { right: 3 },
});
