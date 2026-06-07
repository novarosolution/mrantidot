import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Bell, Search } from 'lucide-react-native';
import { HomeTrustStrip } from '@/components/kit/HomeTrustStrip';
import { LocationChip } from '@/components/kit/LocationChip';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import { colors, fonts, headerTopPad, premium, shadows, spacing } from '@/constants/theme';
import { textInputDefaults } from '@/components/ui/textInputDefaults';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function HomeHero({
  topInset,
  searchPlaceholder,
  query,
  onChangeQuery,
  onSubmitSearch,
  unread,
}: {
  topInset: number;
  searchPlaceholder: string;
  query: string;
  onChangeQuery: (v: string) => void;
  onSubmitSearch: () => void;
  unread: number;
}) {
  const { user } = useAuth();
  const { displayLabel, locating, refreshLocation } = useLocation();
  const firstName = (user?.name?.trim() || 'Guest').split(' ')[0];
  const cityLabel = displayLabel;

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={['#2BB563', '#1A6B3C', '#0E3A20']}
        style={[styles.hero, { paddingTop: headerTopPad(topInset) }]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.95, y: 1 }}
      >
        <View style={styles.glowA} />
        <View style={styles.glowB} />

        <View style={styles.top}>
          <Pressable onPress={() => router.push('/(customer)/profile')} style={styles.greetCol}>
            <Text style={styles.eyebrow}>{greeting()}</Text>
            <Text style={styles.greet}>{firstName}</Text>
            {cityLabel ? (
              <View style={styles.cityRow}>
                <LocationChip
                  label={cityLabel}
                  loading={locating}
                  variant="dark"
                  onPress={() => void refreshLocation()}
                />
              </View>
            ) : null}
          </Pressable>
          <View style={styles.topRight}>
            <Pressable style={styles.iconBtn} onPress={() => router.push('/(customer)/notifications')}>
              <Bell size={19} color={colors.forest} strokeWidth={2} />
              {unread > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
                </View>
              ) : null}
            </Pressable>
            <Pressable style={styles.avatar} onPress={() => router.push('/(customer)/profile')}>
              <LinearGradient
                colors={['rgba(168,224,78,0.35)', 'rgba(255,255,255,0.08)']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() ?? 'U'}</Text>
            </Pressable>
          </View>
        </View>

        <HomeTrustStrip />
      </LinearGradient>

      <View style={styles.searchOuter}>
        <View style={styles.searchWrap}>
          <View style={styles.searchIcon}>
            <Search size={17} color={colors.forest} strokeWidth={2.2} />
          </View>
          <TextInput
            style={styles.search}
            {...textInputDefaults}
            placeholder={searchPlaceholder}
            placeholderTextColor={colors.muted}
            value={query}
            onChangeText={onChangeQuery}
            onSubmitEditing={onSubmitSearch}
            returnKeyType="search"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.xs },
  hero: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl + 28,
    overflow: 'hidden',
  },
  glowA: {
    position: 'absolute',
    top: -70,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(168,224,78,0.14)',
  },
  glowB: {
    position: 'absolute',
    bottom: 20,
    left: -60,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greetCol: { flex: 1, paddingRight: spacing.sm },
  eyebrow: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: 'rgba(255,255,255,0.72)',
    letterSpacing: 0.2,
  },
  greet: {
    fontFamily: fonts.displayExtra,
    fontSize: 30,
    lineHeight: 36,
    color: colors.white,
    letterSpacing: -0.6,
    marginTop: 2,
  },
  cityRow: { marginTop: 8 },
  topRight: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...premium.shadowSoft,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  badgeText: { fontFamily: fonts.bodyBold, fontSize: 9, color: colors.white },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(168,224,78,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.displayExtra, color: colors.white, fontSize: 17 },
  searchOuter: {
    marginTop: -30,
    paddingHorizontal: spacing.md,
    zIndex: 2,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 18,
    paddingHorizontal: 6,
    height: 56,
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.08)',
    ...shadows.floating,
  },
  searchIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  search: { flex: 1, fontSize: 15, color: colors.ink, paddingRight: spacing.sm },
});
