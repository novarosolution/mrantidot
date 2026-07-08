import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { formatRupee } from '@/components/kit/format';
import type { DayAttendanceStatus, TechnicianStats } from '@/types/api';
import { colors, fonts, gradients, headerTopPad, premium, premiumType, shadows, spacing } from '@/constants/theme';

export function TechProfileHero({
  name,
  phone,
  city,
  stats,
  todayStatus,
  compact = false,
  showStats = true,
}: {
  name: string;
  phone?: string;
  city?: string;
  stats: TechnicianStats | null;
  todayStatus: DayAttendanceStatus;
  /** Tab root — no full-screen gradient header (avoids blocking content). */
  compact?: boolean;
  showStats?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const initial = name[0]?.toUpperCase() ?? 'T';
  const dutyVariant = todayStatus === 'came' ? 'on' : 'off';
  const dutyLabel =
    todayStatus === 'came' ? 'On duty' : todayStatus === 'not_came' ? 'Off duty' : 'Check in pending';

  if (compact) {
    return (
      <View style={[styles.compactWrap, { paddingTop: headerTopPad(insets.top) }]}>
        <View style={styles.compactCard}>
          <LinearGradient colors={['#D4A017', '#B6841C']} style={styles.goldBar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
          <View style={styles.compactRow}>
            <LinearGradient colors={[...gradients.avatarRing]} style={styles.compactAvatarRing}>
              <LinearGradient colors={['#14532D', '#1E8E4E']} style={styles.compactAvatar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Text style={styles.compactAvatarText}>{initial}</Text>
              </LinearGradient>
            </LinearGradient>
            <View style={styles.compactBody}>
              <Text style={styles.compactName} numberOfLines={1}>
                {name}
              </Text>
              <View style={styles.compactMeta}>
                {city ? (
                  <View style={styles.compactMetaItem}>
                    <PremiumIcon icon={AppIcons.techProfile.location} variant="plain" size="xs" color={colors.muted} />
                    <Text style={styles.compactMetaText} numberOfLines={1}>
                      {city}
                    </Text>
                  </View>
                ) : null}
                {phone ? (
                  <View style={styles.compactMetaItem}>
                    <PremiumIcon icon={AppIcons.techProfile.phone} variant="plain" size="xs" color={colors.muted} />
                    <Text style={styles.compactMetaText} numberOfLines={1}>
                      {phone}
                    </Text>
                  </View>
                ) : null}
              </View>
              <View style={[styles.dutyPill, dutyVariant === 'on' ? styles.dutyOn : styles.dutyOff]}>
                <Text style={[styles.dutyText, dutyVariant === 'on' ? styles.dutyTextOn : styles.dutyTextOff]}>
                  {dutyLabel}
                </Text>
              </View>
            </View>
          </View>
          {stats && showStats ? (
            <View style={styles.statsRow}>
              <View style={styles.statCell}>
                <Text style={styles.statVal}>★ {stats.rating.toFixed(1)}</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCell}>
                <Text style={styles.statVal}>{stats.jobsDone ?? stats.completed}</Text>
                <Text style={styles.statLabel}>Done</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCell}>
                <Text style={styles.statVal}>
                  {stats.earnings >= 1000 ? formatRupee(stats.earnings) : `₹${stats.earnings}`}
                </Text>
                <Text style={styles.statLabel}>Earned</Text>
              </View>
            </View>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.cardOuter}>
        <View style={styles.card}>
          <LinearGradient colors={['#D4A017', '#B6841C']} style={styles.goldBar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />

          <LinearGradient colors={[...gradients.avatarRing]} style={styles.avatarRing}>
            <LinearGradient colors={['#14532D', '#1E8E4E']} style={styles.avatar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={styles.avatarText}>{initial}</Text>
            </LinearGradient>
          </LinearGradient>

          <View style={styles.verifiedBadge}>
            <PremiumIcon icon={AppIcons.techProfile.verified} variant="plain" size="sm" color={colors.forest} strokeWidth={2.2} />
            <Text style={styles.verifiedText}>Verified technician</Text>
          </View>

          <Text style={styles.name}>{name}</Text>
          <View style={[styles.dutyPill, dutyVariant === 'on' ? styles.dutyOn : styles.dutyOff]}>
            <Text style={[styles.dutyText, dutyVariant === 'on' ? styles.dutyTextOn : styles.dutyTextOff]}>{dutyLabel}</Text>
          </View>

          {(city || phone) && (
            <View style={styles.metaRow}>
              {city ? (
                <View style={styles.metaChip}>
                  <PremiumIcon icon={AppIcons.techProfile.location} variant="plain" size="sm" color={colors.forest} />
                  <Text style={styles.metaText} numberOfLines={1}>
                    {city}
                  </Text>
                </View>
              ) : null}
              {phone ? (
                <View style={styles.metaChip}>
                  <PremiumIcon icon={AppIcons.techProfile.phone} variant="plain" size="sm" color={colors.secondaryDark} />
                  <Text style={styles.metaText} numberOfLines={1}>
                    {phone}
                  </Text>
                </View>
              ) : null}
            </View>
          )}

          {stats && showStats ? (
            <View style={styles.statsRow}>
              <View style={styles.statCell}>
                <Text style={styles.statVal}>★ {stats.rating.toFixed(1)}</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCell}>
                <Text style={styles.statVal}>{stats.jobsDone ?? stats.completed}</Text>
                <Text style={styles.statLabel}>Jobs done</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCell}>
                <Text style={styles.statVal}>
                  {stats.earnings >= 1000 ? formatRupee(stats.earnings) : `₹${stats.earnings}`}
                </Text>
                <Text style={styles.statLabel}>Earnings</Text>
              </View>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.sm },
  compactWrap: { paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  compactCard: {
    backgroundColor: colors.white,
    borderRadius: premium.radiusCard,
    padding: spacing.md,
    paddingTop: spacing.md + 6,
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.06)',
    overflow: 'hidden',
    ...shadows.card,
  },
  compactRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  compactAvatarRing: {
    width: 64,
    height: 64,
    borderRadius: 22,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactAvatar: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactAvatarText: { fontFamily: fonts.displayExtra, fontSize: 24, color: colors.white },
  compactBody: { flex: 1, minWidth: 0 },
  compactName: { ...premiumType.cardTitle, fontSize: 18 },
  compactMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  compactMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: '100%' },
  compactMetaText: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, flexShrink: 1 },
  cardOuter: { paddingHorizontal: spacing.md },
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
  goldBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 3 },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 32,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.displayExtra, fontSize: 34, color: colors.white },
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
  verifiedText: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.forest },
  name: { ...premiumType.brandTitle, fontSize: 24, marginTop: spacing.sm, textAlign: 'center' },
  dutyPill: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  dutyOn: { backgroundColor: colors.soft, borderColor: 'rgba(30,142,78,0.15)' },
  dutyOff: { backgroundColor: '#FEF2F2', borderColor: 'rgba(220,38,38,0.15)' },
  dutyText: { fontFamily: fonts.bodySemi, fontSize: 11 },
  dutyTextOn: { color: colors.forest },
  dutyTextOff: { color: '#B91C1C' },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: spacing.md,
    width: '100%',
    justifyContent: 'center',
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: '100%',
  },
  metaText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.ink },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    width: '100%',
  },
  statCell: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 32, backgroundColor: colors.border },
  statVal: { fontFamily: fonts.displayExtra, fontSize: 15, color: colors.forest, letterSpacing: -0.3 },
  statLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 9,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 3,
  },
});
