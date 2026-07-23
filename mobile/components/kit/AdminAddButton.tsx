import { LinearGradient } from 'expo-linear-gradient';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors } from '@/constants/theme';

/** Circular add action for admin list headers. */
export function AdminAddButton({ onPress }: { label?: string; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Add"
      hitSlop={6}
    >
      <LinearGradient
        colors={['#8FD03C', '#27A747', '#0A6423']}
        style={styles.btn}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.ring}>
          <PremiumIcon icon={AppIcons.ui.plus} variant="plain" size={20} color={colors.white} strokeWidth={2.5} />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    shadowColor: '#043813',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  btn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  ring: {
    flex: 1,
    width: '100%',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.97 }] },
});
