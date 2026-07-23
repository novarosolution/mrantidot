import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { fonts } from '@/constants/theme';

const FOREST = '#0A6423';
const BORDER = '#E2F0D8';
const TILE = '#EEF8E6';

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
        <ActivityIndicator size="small" color={dark ? '#8FD03C' : FOREST} />
      ) : (
        <PremiumIcon icon={AppIcons.ui.mapPin} variant="plain" size={12} color={dark ? '#8FD03C' : FOREST} strokeWidth={2.2} />
      )}
      <Text style={[styles.text, dark ? styles.textDark : styles.textLight]} numberOfLines={1}>
        {label}
      </Text>
      {onPress && !loading ? (
        <PremiumIcon icon={AppIcons.ui.refresh} variant="plain" size={11} color={dark ? 'rgba(255,255,255,0.7)' : '#7A9A7E'} strokeWidth={2.2} />
      ) : null}
    </Pressable>
  );
}

export function LocationBanner({
  label,
  hint,
  loading,
  onRefresh,
  embedded = false,
}: {
  label: string;
  hint?: string;
  loading?: boolean;
  onRefresh?: () => void;
  /** Transparent row for use inside GlassPanel (no opaque white chrome). */
  embedded?: boolean;
}) {
  return (
    <View style={[styles.banner, embedded && styles.bannerEmbedded]}>
      <PremiumIcon icon={AppIcons.ui.mapPin} variant="gradient" size={16} color="#FFFFFF" strokeWidth={2.2} boxSize={42} />
      <View style={styles.bannerBody}>
        <Text style={styles.bannerLabel}>SERVICE AREA</Text>
        <Text style={styles.bannerValue} numberOfLines={1}>
          {label}
        </Text>
        {hint ? <Text style={styles.bannerHint}>{hint}</Text> : null}
      </View>
      {onRefresh ? (
        <Pressable
          style={({ pressed }) => [styles.bannerBtn, pressed && styles.pressed]}
          onPress={onRefresh}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={FOREST} />
          ) : (
            <PremiumIcon icon={AppIcons.ui.refresh} variant="plain" size={15} color={FOREST} strokeWidth={2.2} />
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
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    maxWidth: '100%',
  },
  pillDark: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  pillLight: {
    backgroundColor: TILE,
    borderWidth: 1,
    borderColor: BORDER,
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.97 }] },
  text: { fontFamily: fonts.bodySemi, fontSize: 12.5, flexShrink: 1 },
  textDark: { color: '#FFFFFF' },
  textLight: { color: FOREST },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(226,240,216,0.9)',
    marginBottom: 12,
    shadowColor: '#043813',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  bannerEmbedded: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    marginBottom: 0,
    padding: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  bannerBody: { flex: 1, minWidth: 0 },
  bannerLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: '#7A9A7E',
    letterSpacing: 1.1,
  },
  bannerValue: {
    fontFamily: fonts.bodyBold,
    fontSize: 14.5,
    color: '#0B2213',
    marginTop: 2,
  },
  bannerHint: {
    fontFamily: fonts.body,
    fontSize: 11.5,
    color: '#7A9A7E',
    marginTop: 2,
  },
  bannerBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: TILE,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
