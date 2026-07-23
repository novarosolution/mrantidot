import { LinearGradient } from 'expo-linear-gradient';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { appToast } from '@/lib/toast';
import * as Clipboard from 'expo-clipboard';
import { colors, customerType, fonts, gradients, headerTopPad, premium, shadows, spacing } from '@/constants/theme';
import { customerRoutes, appPush } from '@/lib/routes';

function digits(v: string) {
  return v.replace(/[^\d+]/g, '');
}

export function ProfileHeroCard({
  name,
  phone,
  email,
  city,
  memberSince,
  unread = 0,
  verified = true,
  rating,
}: {
  name: string;
  phone?: string;
  email?: string;
  city?: string;
  memberSince?: string;
  unread?: number;
  verified?: boolean;
  rating?: number | null;
}) {
  const insets = useSafeAreaInsets();
  const initial = name[0]?.toUpperCase() ?? 'U';
  const showRating = rating != null && rating > 0;

  async function copyText(label: string, value: string) {
    await Clipboard.setStringAsync(value);
    appToast.success(`${label} copied`);
  }

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={[...gradients.premiumHero]}
        style={[styles.hero, { paddingTop: headerTopPad(insets.top) }]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.95, y: 1 }}
      >
        <View style={styles.glowA} />
        <View style={styles.glowB} />
        <View style={styles.glowC} />

        <View style={styles.heroTop}>
          <View>
            <View style={styles.eyebrowRow}>
              <PremiumIcon icon={AppIcons.ui.sparkles} variant="plain" size={12} color={colors.lime} strokeWidth={2.2} />
              <Text style={styles.eyebrow}>Your profile</Text>
            </View>
            <Text style={styles.screenTitle}>My account</Text>
          </View>
          <View style={styles.heroActions}>
            <Pressable style={styles.heroIconBtn} onPress={() => appPush(customerRoutes.notifications)}>
              <PremiumIcon icon={AppIcons.ui.bell} variant="plain" size={18} color={colors.white} strokeWidth={2} />
              {unread > 0 ? (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>{unread > 9 ? '9+' : unread}</Text>
                </View>
              ) : null}
            </Pressable>
            <Pressable style={styles.heroIconBtn} onPress={() => appPush(customerRoutes.settings)}>
              <PremiumIcon icon={AppIcons.ui.settings} variant="plain" size={18} color={colors.white} strokeWidth={2} />
            </Pressable>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.cardOuter}>
        <View style={styles.card}>
          <LinearGradient colors={[...gradients.goldBar]} style={styles.goldBar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />

          <LinearGradient colors={[...gradients.avatarRing]} style={styles.avatarRing}>
            <LinearGradient colors={['#14532D', '#1E8E4E']} style={styles.avatar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={styles.avatarText}>{initial}</Text>
            </LinearGradient>
          </LinearGradient>

          {verified ? (
            <View style={styles.verifiedBadge}>
              <PremiumIcon icon={AppIcons.techProfile.verified} variant="plain" size={13} color={colors.forest} strokeWidth={2.2} />
              <Text style={styles.verifiedText}>Verified customer</Text>
            </View>
          ) : null}

          <Text style={styles.name}>{name}</Text>

          <View style={styles.pillRow}>
            <View style={styles.rolePill}>
              <Text style={styles.roleText}>Customer</Text>
            </View>
            {showRating ? (
              <View style={styles.ratingPill}>
                <Text style={styles.ratingText}>★ {rating!.toFixed(1)}</Text>
              </View>
            ) : null}
          </View>

          {memberSince ? <Text style={styles.member}>{memberSince}</Text> : null}

          <View style={styles.metaGrid}>
            {city ? (
              <View style={styles.metaChip}>
                  <PremiumIcon icon={AppIcons.ui.mapPin} variant="mint" size={14} color={colors.forest} boxSize={30} bg={colors.soft} />
                <Text style={styles.metaText} numberOfLines={1}>
                  {city}
                </Text>
              </View>
            ) : null}
            {phone ? (
              <View style={styles.metaChip}>
                <Pressable style={styles.metaInner} onPress={() => Linking.openURL(`tel:${digits(phone)}`)}>
                    <PremiumIcon icon={AppIcons.ui.phone} variant="mint" size={14} color={colors.secondaryDark} boxSize={30} bg={colors.secondarySoft} />
                  <Text style={styles.metaText} numberOfLines={1}>
                    {phone}
                  </Text>
                </Pressable>
                <Pressable hitSlop={8} onPress={() => void copyText('Phone', phone)}>
                  <PremiumIcon icon={AppIcons.ui.copy} variant="plain" size={13} color={colors.muted} />
                </Pressable>
              </View>
            ) : null}
            {email ? (
              <View style={[styles.metaChip, styles.metaChipWide]}>
                <Pressable style={styles.metaInner} onPress={() => Linking.openURL(`mailto:${email}`)}>
                    <PremiumIcon icon={AppIcons.ui.mail} variant="mint" size={14} color={colors.blue} boxSize={30} bg={colors.blueBg} />
                  <Text style={styles.metaText} numberOfLines={1}>
                    {email}
                  </Text>
                </Pressable>
                <Pressable hitSlop={8} onPress={() => void copyText('Email', email)}>
                  <PremiumIcon icon={AppIcons.ui.copy} variant="plain" size={13} color={colors.muted} />
                </Pressable>
              </View>
            ) : null}
            {!phone && !email && !city ? (
              <Pressable style={[styles.metaChip, styles.metaChipWide]} onPress={() => appPush(customerRoutes.settings)}>
                <Text style={styles.metaHint}>Complete your profile in settings →</Text>
              </Pressable>
            ) : null}
          </View>

          <Pressable style={({ pressed }) => [styles.editRow, pressed && styles.editPressed]} onPress={() => appPush(customerRoutes.settings)}>
            <LinearGradient colors={['#14532D', '#1A6B3C']} style={styles.editGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={styles.editLabel}>Edit profile & account</Text>
              <PremiumIcon icon={AppIcons.ui.chevronRight} variant="plain" size={16} color={colors.lime} strokeWidth={2.5} />
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.sm },
  hero: {
    paddingHorizontal: spacing.md,
    paddingBottom: 72,
    overflow: 'hidden',
  },
  glowA: {
    position: 'absolute',
    top: -50,
    right: -30,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(168,224,78,0.14)',
  },
  glowB: {
    position: 'absolute',
    bottom: 0,
    left: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  glowC: {
    position: 'absolute',
    top: 40,
    left: '35%',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(212,160,23,0.08)',
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  eyebrow: { ...customerType.heroEyebrow, color: 'rgba(255,255,255,0.75)' },
  screenTitle: { ...customerType.pageTitleCompact },
  heroActions: { flexDirection: 'row', gap: 8 },
  heroIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadge: {
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
    borderColor: colors.forest,
  },
  notifBadgeText: { ...customerType.badgeCount },
  cardOuter: {
    marginTop: -56,
    paddingHorizontal: spacing.md,
    zIndex: 2,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: premium.radiusCard,
    padding: spacing.lg,
    paddingTop: spacing.lg + 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.06)',
    overflow: 'hidden',
    ...shadows.floating,
  },
  goldBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  avatarRing: {
    width: 100,
    height: 100,
    borderRadius: 32,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  avatar: {
    width: 94,
    height: 94,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.displayExtra, fontSize: 36, color: colors.white, letterSpacing: -0.4 },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: spacing.sm,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: 'rgba(30,142,78,0.15)',
  },
  verifiedText: { ...customerType.pillLabel, fontSize: 11, color: colors.forest },
  name: {
    ...customerType.profileName,
    marginTop: spacing.sm,
  },
  pillRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  rolePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.greyBg,
  },
  roleText: {
    ...customerType.pillLabel,
    color: colors.muted,
  },
  ratingPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: '#D8EDC8',
  },
  ratingText: { ...customerType.pillLabel, color: colors.forest },
  member: {
    ...customerType.accountMeta,
    marginTop: 6,
  },
  metaGrid: {
    width: '100%',
    marginTop: spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: '46%',
    maxWidth: '100%',
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metaChipWide: { minWidth: '100%', flex: undefined, width: '100%' },
  metaInner: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0 },
  metaIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaText: {
    flex: 1,
    ...customerType.listMeta,
    fontSize: 13,
    color: colors.ink,
  },
  metaHint: {
    flex: 1,
    ...customerType.listMeta,
    fontSize: 13,
    textAlign: 'center',
  },
  editRow: {
    marginTop: spacing.md,
    alignSelf: 'stretch',
    borderRadius: 999,
    overflow: 'hidden',
    ...shadows.card,
  },
  editPressed: { opacity: 0.94, transform: [{ scale: 0.99 }] },
  editGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
  },
  editLabel: {
    ...customerType.sectionLink,
    fontSize: 14,
    color: colors.white,
    letterSpacing: 0.25,
  },
});
