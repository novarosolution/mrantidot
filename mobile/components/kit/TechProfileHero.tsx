import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HeroDarkSlice } from '@/components/kit/HeroDarkSlice';
import { GlassPanel } from '@/components/kit/GlassScreenKit';
import { homeShadow } from '@/components/kit/homeUi';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { formatRupee } from '@/components/kit/format';
import type { DayAttendanceStatus, TechnicianStats } from '@/types/api';
import { colors, fonts, gradients, headerTopPad, premium, premiumType, spacing, surfaces } from '@/constants/theme';

export function TechProfileHero({
  name,
  phone,
  city,
  stats,
  todayStatus,
  onDuty = false,
  compact = false,
  showStats = true,
}: {
  name: string;
  phone?: string;
  city?: string;
  stats: TechnicianStats | null;
  todayStatus: DayAttendanceStatus;
  /** Present + not checked out. */
  onDuty?: boolean;
  /** Tab root — no full-screen gradient header (avoids blocking content). */
  compact?: boolean;
  showStats?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const initial = name[0]?.toUpperCase() ?? 'T';
  const dutyVariant: 'on' | 'off' | 'leave' | 'pending' =
    todayStatus === 'leave'
      ? 'leave'
      : todayStatus === 'came' && onDuty
        ? 'on'
        : todayStatus === 'pending' || todayStatus === 'future'
          ? 'pending'
          : 'off';
  const dutyLabel =
    todayStatus === 'leave'
      ? 'On leave'
      : todayStatus === 'came' && onDuty
        ? 'On duty'
        : todayStatus === 'came'
          ? 'Checked out'
          : todayStatus === 'not_came'
            ? 'Absent'
            : 'Check in pending';

  const dutyPillStyle =
    dutyVariant === 'on'
      ? styles.dutyOn
      : dutyVariant === 'leave'
        ? styles.dutyLeave
        : dutyVariant === 'pending'
          ? styles.dutyPending
          : styles.dutyOff;
  const dutyDotStyle =
    dutyVariant === 'on'
      ? styles.dutyDotOn
      : dutyVariant === 'leave'
        ? styles.dutyDotLeave
        : dutyVariant === 'pending'
          ? styles.dutyDotPending
          : styles.dutyDotOff;
  const dutyTextStyle =
    dutyVariant === 'on'
      ? styles.dutyTextOn
      : dutyVariant === 'leave'
        ? styles.dutyTextLeave
        : dutyVariant === 'pending'
          ? styles.dutyTextPending
          : styles.dutyTextOff;

  const identity = (
    <View style={styles.identityRow}>
      <LinearGradient colors={[...gradients.avatarRing]} style={styles.compactAvatarRing}>
        <LinearGradient colors={['#30B84F', '#0A6423']} style={styles.compactAvatar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
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
        <View style={[styles.dutyPill, dutyPillStyle]}>
          <View style={[styles.dutyDot, dutyDotStyle]} />
          <Text style={[styles.dutyText, dutyTextStyle]}>
            {dutyLabel}
          </Text>
        </View>
      </View>
    </View>
  );

  const statsBlock =
    stats && showStats ? (
      <View style={styles.statsRow}>
        <View style={styles.statCell}>
          <Text style={styles.statVal}>★ {stats.rating.toFixed(1)}</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCell}>
          <Text style={styles.statVal}>{stats.jobsDone ?? stats.completed}</Text>
          <Text style={styles.statLabel}>{compact ? 'Done' : 'Jobs done'}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCell}>
          <Text style={styles.statVal}>
            {stats.earnings >= 1000 ? formatRupee(stats.earnings) : `₹${stats.earnings}`}
          </Text>
          <Text style={styles.statLabel}>{compact ? 'Earned' : 'Earnings'}</Text>
        </View>
      </View>
    ) : null;

  if (compact) {
    return (
      <View style={styles.compactRoot}>
        <HeroDarkSlice
          style={styles.bannerShell}
          sliceHeight={18}
          contentStyle={[styles.bannerContent, { paddingTop: headerTopPad(insets.top) }]}
        >
          <View style={styles.eyebrowRow}>
            <LinearGradient
              colors={['#C8F07A', '#8FD03C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.eyebrowBar}
            />
            <Text style={styles.eyebrow}>FIELD CREW</Text>
          </View>
          <Text style={styles.bannerTitle}>My Profile</Text>
          <Text style={styles.bannerSub}>Verified technician · performance & schedule</Text>
        </HeroDarkSlice>

        <View style={styles.compactWrap}>
          <View style={styles.compactShell}>
            <GlassPanel style={styles.compactCard} padded={false} tone="light" intensity={42} goldEdge>
              <View style={styles.compactInner}>
                {identity}
                {statsBlock}
              </View>
            </GlassPanel>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.cardOuter}>
        <View style={styles.cardShell}>
          <GlassPanel style={styles.card} padded={false} tone="light" intensity={42} goldEdge>
            <View style={styles.cardInner}>
              <LinearGradient colors={[...gradients.avatarRing]} style={styles.avatarRing}>
                <LinearGradient colors={['#30B84F', '#0A6423']} style={styles.avatar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Text style={styles.avatarText}>{initial}</Text>
                </LinearGradient>
              </LinearGradient>

              <View style={styles.verifiedBadge}>
                <PremiumIcon icon={AppIcons.techProfile.verified} variant="plain" size="sm" color={colors.forest} strokeWidth={2.2} />
                <Text style={styles.verifiedText}>Verified technician</Text>
              </View>

              <Text style={styles.name}>{name}</Text>
              <View style={[styles.dutyPill, dutyPillStyle, styles.dutyCentered]}>
                <View style={[styles.dutyDot, dutyDotStyle]} />
                <Text style={[styles.dutyText, dutyTextStyle]}>{dutyLabel}</Text>
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
                      <PremiumIcon icon={AppIcons.techProfile.phone} variant="plain" size="sm" color={colors.forest} />
                      <Text style={styles.metaText} numberOfLines={1}>
                        {phone}
                      </Text>
                    </View>
                  ) : null}
                </View>
              )}

              {statsBlock}
            </View>
          </GlassPanel>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.sm },
  compactRoot: { marginBottom: spacing.sm },
  bannerShell: { marginBottom: -4 },
  bannerContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md + 20,
  },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  eyebrowBar: { width: 18, height: 3, borderRadius: 2 },
  eyebrow: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    letterSpacing: 1.2,
    color: 'rgba(255,255,255,0.92)',
  },
  bannerTitle: {
    fontFamily: fonts.displayExtra,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.6,
    color: '#FFFFFF',
  },
  bannerSub: {
    fontFamily: fonts.body,
    fontSize: 13.5,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.86)',
    marginTop: 4,
  },
  compactWrap: {
    paddingHorizontal: spacing.md,
    marginTop: -22,
  },
  compactShell: {
    borderRadius: 24,
    ...homeShadow.card,
  },
  compactCard: {
    borderRadius: 24,
  },
  compactInner: {
    padding: spacing.md,
  },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
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
  compactName: { ...premiumType.cardTitle, fontSize: 18, color: colors.ink },
  compactMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  compactMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: '100%' },
  compactMetaText: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, flexShrink: 1 },
  cardOuter: { paddingHorizontal: spacing.md },
  cardShell: {
    borderRadius: premium.radiusCard,
    ...homeShadow.card,
  },
  card: {
    borderRadius: premium.radiusCard,
  },
  cardInner: {
    padding: spacing.lg,
    paddingTop: spacing.lg + 8,
    alignItems: 'center',
  },
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
    backgroundColor: '#EEF8E6',
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
  },
  verifiedText: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.forest },
  name: { ...premiumType.brandTitle, fontSize: 24, marginTop: spacing.sm, textAlign: 'center', color: colors.ink },
  dutyPill: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dutyCentered: { alignSelf: 'center' },
  dutyOn: { backgroundColor: '#EEF8E6', borderColor: surfaces.glassBorderStrong },
  dutyOff: { backgroundColor: '#FEF2F2', borderColor: 'rgba(220,38,38,0.2)' },
  dutyLeave: { backgroundColor: '#EFF6FF', borderColor: 'rgba(59,130,246,0.25)' },
  dutyPending: { backgroundColor: '#FFF8E8', borderColor: 'rgba(245,184,46,0.35)' },
  dutyDot: { width: 6, height: 6, borderRadius: 3 },
  dutyDotOn: { backgroundColor: '#27A747' },
  dutyDotOff: { backgroundColor: '#DC2626' },
  dutyDotLeave: { backgroundColor: '#3B82F6' },
  dutyDotPending: { backgroundColor: '#F5B82E' },
  dutyText: { fontFamily: fonts.bodySemi, fontSize: 11 },
  dutyTextOn: { color: colors.forest },
  dutyTextOff: { color: '#B91C1C' },
  dutyTextLeave: { color: '#1D4ED8' },
  dutyTextPending: { color: '#9A6F12' },
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
    backgroundColor: '#F6FAF2',
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
    maxWidth: '100%',
  },
  metaText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.ink },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: surfaces.glassBorderStrong,
    width: '100%',
  },
  statCell: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 32, backgroundColor: surfaces.glassBorderStrong },
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
