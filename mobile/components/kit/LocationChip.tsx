import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { colors, fonts, ui } from '@/constants/theme';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { fillCopy } from '@/constants/customerUiCopy';

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
  const copy = useCustomerUiCopy();
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
      accessibilityLabel={loading ? copy.homeLocationUpdatingA11y : fillCopy(copy.homeLocationA11y, { label })}
    >
      <View style={[styles.iconShell, dark ? styles.iconShellDark : styles.iconShellLight]}>
        {loading ? (
          <ActivityIndicator size="small" color={ui.brand} />
        ) : (
          <PremiumIcon
            icon={AppIcons.ui.mapPin}
            variant="plain"
            size={13}
            color={ui.brand}
            strokeWidth={2.4}
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
          color={dark ? 'rgba(255,255,255,0.85)' : ui.textTertiary}
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
  const copy = useCustomerUiCopy();
  return (
    <View style={[styles.bannerShell, embedded && styles.bannerShellEmbedded]}>
      <View style={[styles.banner, embedded && styles.bannerEmbedded]}>
        <PremiumIcon
          icon={AppIcons.ui.mapPin}
          variant="mint"
          size={16}
          color={ui.brand}
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
            accessibilityLabel={copy.homeLocationRefreshA11y}
          >
            {loading ? (
              <ActivityIndicator size="small" color={ui.brand} />
            ) : (
              <PremiumIcon icon={AppIcons.ui.refresh} variant="plain" size={15} color={ui.brand} strokeWidth={2.2} />
            )}
          </Pressable>
        ) : null}
      </View>
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
    backgroundColor: ui.brandSoft,
    borderWidth: 1,
    borderColor: ui.hairline,
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
    borderColor: ui.hairline,
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.97 }] },
  text: { fontFamily: fonts.bodySemi, fontSize: 13, flexShrink: 1, letterSpacing: -0.1 },
  textDark: { color: colors.white },
  textLight: { color: ui.brand },
  bannerShell: {
    borderRadius: 18,
    marginBottom: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    ...ui.shadow,
  },
  bannerShellEmbedded: {
    marginBottom: 0,
    shadowOpacity: 0,
    elevation: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
  },
  bannerEmbedded: {
    backgroundColor: 'transparent',
    padding: 0,
  },
  bannerBody: { flex: 1, minWidth: 0 },
  bannerLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: ui.brand,
    letterSpacing: 1.1,
  },
  bannerValue: {
    fontFamily: fonts.displaySemi,
    fontSize: 15,
    color: ui.text,
    marginTop: 2,
    letterSpacing: -0.2,
  },
  bannerHint: {
    fontFamily: fonts.body,
    fontSize: 11.5,
    color: ui.textSecondary,
    marginTop: 2,
  },
  bannerBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: ui.brandSoft,
    borderWidth: 1,
    borderColor: ui.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
