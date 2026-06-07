import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { MapPin, RefreshCw } from 'lucide-react-native';
import { colors, fonts } from '@/constants/theme';

export function LocationChip({
  label,
  loading,
  onPress,
  variant = 'dark',
}: {
  label: string;
  loading?: boolean;
  onPress?: () => void;
  variant?: 'dark' | 'light';
}) {
  const dark = variant === 'dark';
  return (
    <Pressable
      style={({ pressed }) => [
        styles.pill,
        dark ? styles.pillDark : styles.pillLight,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
      disabled={!onPress || loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color={dark ? colors.lime : colors.forest} />
      ) : (
        <MapPin size={11} color={dark ? colors.lime : colors.forest} />
      )}
      <Text style={[styles.text, dark ? styles.textDark : styles.textLight]} numberOfLines={1}>
        {label}
      </Text>
      {onPress && !loading ? (
        <RefreshCw size={10} color={dark ? 'rgba(255,255,255,0.65)' : colors.muted} />
      ) : null}
    </Pressable>
  );
}

export function LocationBanner({
  label,
  hint,
  loading,
  onRefresh,
}: {
  label: string;
  hint?: string;
  loading?: boolean;
  onRefresh?: () => void;
}) {
  return (
    <View style={styles.banner}>
      <View style={styles.bannerBody}>
        <Text style={styles.bannerLabel}>Service area</Text>
        <Text style={styles.bannerValue} numberOfLines={1}>
          {label}
        </Text>
        {hint ? <Text style={styles.bannerHint}>{hint}</Text> : null}
      </View>
      {onRefresh ? (
        <Pressable style={styles.bannerBtn} onPress={onRefresh} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color={colors.forest} />
          ) : (
            <RefreshCw size={16} color={colors.forest} />
          )}
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    maxWidth: '100%',
  },
  pillDark: { backgroundColor: 'rgba(0,0,0,0.12)' },
  pillLight: {
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: 'rgba(30,142,78,0.12)',
  },
  pressed: { opacity: 0.88 },
  text: { fontFamily: fonts.bodySemi, fontSize: 12, flexShrink: 1 },
  textDark: { color: 'rgba(255,255,255,0.88)' },
  textLight: { color: colors.forest },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: 'rgba(30,142,78,0.12)',
    marginBottom: 12,
  },
  bannerBody: { flex: 1, minWidth: 0 },
  bannerLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  bannerValue: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.ink, marginTop: 2 },
  bannerHint: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 2 },
  bannerBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
