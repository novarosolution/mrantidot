import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { GlassPanel } from '@/components/kit/GlassScreenKit';
import { homeShadow } from '@/components/kit/homeUi';
import { PremiumAppHeader } from '@/components/kit/PremiumAppHeader';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { formatRupee } from '@/components/kit/format';
import { useLocation } from '@/context/LocationContext';
import type { DayAttendanceStatus, TechnicianStats } from '@/types/api';
import { colors, fonts, gradients, premium, premiumType, spacing, surfaces, ui } from '@/constants/theme';

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
  const { displayLabel } = useLocation();
  const placeLabel = displayLabel || city;
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
        <LinearGradient colors={[colors.greenBright, colors.forest]} style={styles.compactAvatar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={styles.compactAvatarText}>{initial}</Text>
        </LinearGradient>
      </LinearGradient>
      <View style={styles.compactBody}>
        <Text style={styles.compactName} numberOfLines={1}>
          {name}
        </Text>
        <View style={styles.compactMeta}>
          {placeLabel ? (
            <View style={styles.compactMetaItem}>
              <PremiumIcon icon={AppIcons.techProfile.location} variant="plain" size="xs" color={colors.muted} />
              <Text style={styles.compactMetaText} numberOfLines={1}>
                {placeLabel}
              </Text>
            </View>
          ) : null}
          {phone ? (
            <View style={styles.compactMetaItemPhone}>
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

  const displayRating = stats && stats.rating > 0 ? stats.rating : 5;

  const statsBlock =
    stats && showStats ? (
      <View style={styles.statsRow}>
        <View style={styles.statCell}>
          <Text style={styles.statVal}>★ {displayRating.toFixed(1)}</Text>
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
          <Text style={styles.statLabel}>{compact ? 'Month' : 'This month'}</Text>
        </View>
      </View>
    ) : null;

  if (compact) {
    return (
      <View style={styles.compactRoot}>
        <PremiumAppHeader
          eyebrow="FIELD CREW"
          title="My Profile"
          subtitle="Verified technician · performance & schedule"
        />

        <View style={styles.compactWrap}>
          <View style={styles.compactShell}>
            <GlassPanel style={styles.compactCard} padded={false} tone="light" intensity={42}>
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
                <LinearGradient colors={[colors.greenBright, colors.forest]} style={styles.avatar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
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

              {(placeLabel || phone) && (
                <View style={styles.metaRow}>
                  {placeLabel ? (
                    <View style={styles.metaChip}>
                      <PremiumIcon icon={AppIcons.techProfile.location} variant="plain" size="sm" color={colors.forest} />
                      <Text style={styles.metaText} numberOfLines={1}>
                        {placeLabel}
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
  compactWrap: {
    paddingHorizontal: spacing.md,
    marginTop: 4,
  },
  compactShell: {
    borderRadius: 20,
    ...homeShadow.card,
  },
  compactCard: {
    borderRadius: 20,
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
  compactName: { ...premiumType.cardTitle, fontSize: 18, color: ui.text },
  compactMeta: { marginTop: 4, gap: 4 },
  compactMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 0 },
  compactMetaItemPhone: { flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 0 },
  compactMetaText: { fontFamily: fonts.body, fontSize: 12, color: ui.textSecondary, flexShrink: 1 },
  dutyPill: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dutyCentered: { alignSelf: 'center' },
  dutyOn: { backgroundColor: ui.brandSoft, borderColor: ui.border },
  dutyOff: { backgroundColor: colors.errorBg, borderColor: 'rgba(179,63,40,0.2)' },
  dutyLeave: { backgroundColor: colors.blueBg, borderColor: 'rgba(46,86,158,0.2)' },
  dutyPending: { backgroundColor: colors.amberBg, borderColor: 'rgba(154,111,18,0.25)' },
  dutyDot: { width: 6, height: 6, borderRadius: 3 },
  dutyDotOn: { backgroundColor: colors.green },
  dutyDotOff: { backgroundColor: colors.error },
  dutyDotLeave: { backgroundColor: colors.blue },
  dutyDotPending: { backgroundColor: colors.amber },
  dutyText: { fontFamily: fonts.bodySemi, fontSize: 11, lineHeight: 14, includeFontPadding: false },
  dutyTextOn: { color: ui.brand },
  dutyTextOff: { color: colors.error },
  dutyTextLeave: { color: colors.blue },
  dutyTextPending: { color: colors.amberInk },
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
    backgroundColor: colors.mint,
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
  },
  verifiedText: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.forest },
  name: { ...premiumType.brandTitle, fontSize: 24, marginTop: spacing.sm, textAlign: 'center', color: colors.ink },
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
    backgroundColor: colors.bg,
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
