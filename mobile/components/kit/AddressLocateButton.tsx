import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight, LocateFixed } from 'lucide-react-native';
import { colors, fonts, gradients, spacing } from '@/constants/theme';

export function AddressLocateButton({
  loading,
  onPress,
}: {
  loading?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}
      onPress={onPress}
      disabled={loading}
    >
      <LinearGradient
        colors={[gradients.primary[0], gradients.primary[1]]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.iconWrap}>
          {loading ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <LocateFixed size={20} color={colors.white} strokeWidth={2.2} />
          )}
        </View>
        <View style={styles.textCol}>
          <Text style={styles.title}>{loading ? 'Finding location…' : 'Use current location'}</Text>
          <Text style={styles.sub}>Auto-fill from GPS</Text>
        </View>
        {!loading ? <ChevronRight size={18} color="rgba(255,255,255,0.85)" /> : null}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: 16, overflow: 'hidden' },
  pressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: { flex: 1 },
  title: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.white },
  sub: { fontFamily: fonts.body, fontSize: 11.5, color: 'rgba(255,255,255,0.82)', marginTop: 2 },
});
