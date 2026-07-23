import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { fonts } from '@/constants/theme';

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
        colors={['#209640', '#0A6423']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.iconWrap}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <PremiumIcon icon={AppIcons.ui.locate} variant="plain" size={20} color="#FFFFFF" strokeWidth={2.2} />
          )}
        </View>
        <View style={styles.textCol}>
          <Text style={styles.title}>{loading ? 'Finding your location…' : 'Use current location'}</Text>
          <Text style={styles.sub}>{loading ? 'Almost there' : 'Auto-fill address from GPS'}</Text>
        </View>
        {!loading ? (
          <PremiumIcon icon={AppIcons.ui.chevronRight} variant="plain" size={18} color="#8FD03C" strokeWidth={2.4} />
        ) : null}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#043813',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 5,
  },
  pressed: { opacity: 0.94, transform: [{ scale: 0.985 }] },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: { flex: 1 },
  title: { fontFamily: fonts.bodyBold, fontSize: 14.5, color: '#FFFFFF' },
  sub: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
});
