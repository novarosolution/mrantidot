import { type ReactNode } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Dimensions, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Bell, MapPin, RefreshCw, Search, X } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import { homeGreetingName } from '@/lib/profile-display';
import { colors, design, fonts, gradients, headerTopPad, shadows, spacing } from '@/constants/theme';
import { textInputDefaults } from '@/components/ui/textInputDefaults';

const ACTION = 44;

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function HeroAction({
  onPress,
  children,
  badge,
}: {
  onPress: () => void;
  children: ReactNode;
  badge?: number;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.actionBtn, pressed && styles.actionPressed]} onPress={onPress}>
      {children}
      {badge != null && badge > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
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
  const firstName = homeGreetingName(user);
  const initial = user?.name?.[0]?.toUpperCase() ?? 'U';

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={[...gradients.premiumHero]}
        style={[styles.hero, { paddingTop: headerTopPad(topInset) }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.glowA} />
        <View style={styles.glowB} />

        <View style={styles.topRow}>
          <View style={styles.greetCol}>
            <Text style={styles.eyebrow}>{greeting()}</Text>
            <Text style={styles.greet}>{firstName}</Text>
          </View>
          <View style={styles.actions}>
            <HeroAction onPress={() => router.push('/(customer)/notifications')} badge={unread}>
              <Bell size={20} color={colors.forest} strokeWidth={2} />
            </HeroAction>
            <Pressable
              style={({ pressed }) => [styles.avatarBtn, pressed && styles.actionPressed]}
              onPress={() => router.push('/(customer)/profile')}
            >
              <LinearGradient
                colors={['#2A9D5C', '#14532D']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <Text style={styles.avatarText}>{initial}</Text>
            </Pressable>
          </View>
        </View>

        {displayLabel ? (
          <Pressable
            style={({ pressed }) => [styles.locationRow, pressed && styles.actionPressed]}
            onPress={() => void refreshLocation()}
            disabled={locating}
          >
            <MapPin size={14} color={colors.lime} strokeWidth={2.2} />
            <Text style={styles.locationText} numberOfLines={1}>
              {displayLabel}
            </Text>
            <RefreshCw size={13} color="rgba(255,255,255,0.7)" />
          </Pressable>
        ) : null}

        <View style={styles.heroCurve} />
      </LinearGradient>

      <View style={styles.searchOuter}>
        <View style={styles.searchWrap}>
          <Search size={18} color={colors.forest} strokeWidth={2.2} />
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
          {query.length > 0 ? (
            <Pressable style={styles.clearBtn} onPress={() => onChangeQuery('')} hitSlop={8}>
              <X size={16} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.sm },
  hero: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl + 32,
    overflow: 'hidden',
  },
  glowA: {
    position: 'absolute',
    top: -60,
    right: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(168,224,78,0.14)',
  },
  glowB: {
    position: 'absolute',
    bottom: 20,
    left: -50,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  heroCurve: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 24,
    backgroundColor: design.screenBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  greetCol: { flex: 1, paddingTop: 2 },
  eyebrow: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: 'rgba(255,255,255,0.72)',
  },
  greet: {
    fontFamily: fonts.displayExtra,
    fontSize: 30,
    lineHeight: 36,
    color: colors.white,
    letterSpacing: -0.6,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 2,
  },
  actionBtn: {
    width: ACTION,
    height: ACTION,
    borderRadius: ACTION / 2,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  avatarBtn: {
    width: ACTION,
    height: ACTION,
    borderRadius: ACTION / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  actionPressed: { opacity: 0.9, transform: [{ scale: 0.97 }] },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
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
  avatarText: { fontFamily: fonts.displayExtra, color: colors.white, fontSize: 17 },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    marginTop: spacing.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    maxWidth: '100%',
  },
  locationText: {
    flexShrink: 1,
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: 'rgba(255,255,255,0.92)',
  },
  searchOuter: {
    marginTop: -28,
    paddingHorizontal: spacing.md,
    zIndex: 2,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    height: 52,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.08)',
    ...shadows.floating,
  },
  search: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.ink,
    paddingVertical: 0,
  },
  clearBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
