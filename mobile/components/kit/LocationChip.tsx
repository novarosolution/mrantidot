import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { colors, fonts, premium, surfaces } from '@/constants/theme';

/** Compact location pill for dark heroes (home) and light surfaces. */
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
        pressed && onPress && styles.pressed,
      ]}
      onPress={onPress}
      disabled={!onPress || loading}
      accessibilityRole="button"
      accessibilityLabel={loading ? 'Updating location' : `Location ${label}. Tap to refresh`}
    >
      <View style={[styles.iconShell, dark ? styles.iconShellDark : styles.iconShellLight]}>
        {loading ? (
          <ActivityIndicator size="small" color={dark ? colors.forest : colors.forest} />
        ) : (
          <PremiumIcon
            icon={AppIcons.ui.mapPin}
            variant="plain"
            size={13}
            color={colors.forest}
            strokeWidth={2.4}
            fill="rgba(10,100,35,0.16)"
          />
        )}
      </View>
      <Text style={[styles.text, dark ? styles.textDark : styles.textLight]} numberOfLines={1}>
        {loading ? 'Updating…' : label}
      </Text>
      {onPress && !loading ? (
        <PremiumIcon
          icon={AppIcons.ui.refresh}
          variant="plain"
          size={12}
          color={dark ? 'rgba(255,255,255,0.85)' : colors.muted}
          strokeWidth={2.3}
        />
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
    <View style={[styles.bannerShell, embedded && styles.bannerShellEmbedded]}>
      <LinearGradient
        colors={embedded ? ['transparent', 'transparent'] : ['rgba(255,255,255,0.92)', 'rgba(246,250,242,0.88)']}
        style={[styles.banner, embedded && styles.bannerEmbedded]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {!embedded ? (
          <LinearGradient
            colors={[colors.limeBright, colors.green]}
            style={styles.bannerGold}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        ) : null}
        <PremiumIcon
          icon={AppIcons.ui.mapPin}
          variant="gradient"
          size={16}
          color={colors.white}
          strokeWidth={2.2}
          boxSize={44}
        />
        <View style={styles.bannerBody}>
          <Text style={styles.bannerLabel}>YOUR LOCATION</Text>
          <Text style={styles.bannerValue} numberOfLines={2}>
            {loading ? 'Updating…' : label}
          </Text>
          {hint ? <Text style={styles.bannerHint}>{hint}</Text> : null}
        </View>
        {onRefresh ? (
          <Pressable
            style={({ pressed }) => [styles.bannerBtn, pressed && styles.pressed]}
            onPress={onRefresh}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Refresh location"
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.forest} />
            ) : (
              <PremiumIcon icon={AppIcons.ui.refresh} variant="plain" size={15} color={colors.forest} strokeWidth={2.2} />
            )}
          </Pressable>
        ) : null}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    paddingLeft: 5,
    paddingRight: 12,
    paddingVertical: 5,
    borderRadius: 999,
    maxWidth: '100%',
  },
  pillDark: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.34)',
  },
  pillLight: {
    backgroundColor: colors.mint,
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
  },
  iconShell: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconShellDark: {
    backgroundColor: colors.white,
  },
  iconShellLight: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: surfaces.glassBorder,
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.97 }] },
  text: { fontFamily: fonts.bodySemi, fontSize: 13, flexShrink: 1, letterSpacing: -0.1 },
  textDark: { color: colors.white },
  textLight: { color: colors.forest },
  bannerShell: {
    borderRadius: premium.radiusCard,
    marginBottom: 12,
    ...premium.shadowSoft,
  },
  bannerShellEmbedded: {
    marginBottom: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: premium.radiusCard,
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
    overflow: 'hidden',
  },
  bannerEmbedded: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
  },
  bannerGold: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  bannerBody: { flex: 1, minWidth: 0 },
  bannerLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: colors.muted,
    letterSpacing: 1.1,
  },
  bannerValue: {
    fontFamily: fonts.displaySemi,
    fontSize: 15,
    color: colors.ink,
    marginTop: 2,
    letterSpacing: -0.2,
  },
  bannerHint: {
    fontFamily: fonts.body,
    fontSize: 11.5,
    color: colors.muted,
    marginTop: 2,
  },
  bannerBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.mint,
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
