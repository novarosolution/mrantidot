import { LinearGradient } from 'expo-linear-gradient';
import { type LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { colors, fonts, premium, shadows, spacing } from '@/constants/theme';

export function TechSectionTitle({
  title,
  hint,
  actionLabel,
  onAction,
}: {
  title: string;
  hint?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionBlock}>
      <View style={styles.sectionRow}>
        <View style={styles.sectionText}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {hint ? <Text style={styles.sectionHint}>{hint}</Text> : null}
        </View>
        {actionLabel && onAction ? (
          <Pressable onPress={onAction} hitSlop={8}>
            <Text style={styles.sectionAction}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.sectionRule}>
        <LinearGradient colors={['#D4A017', '#B6841C']} style={styles.sectionGold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
        <View style={styles.sectionLine} />
      </View>
    </View>
  );
}

export function TechCheckInCard({
  title,
  subtitle,
  onDutyLabel,
  offDutyLabel,
  onCheckIn,
  onMarkAbsent,
  loading,
}: {
  title: string;
  subtitle: string;
  onDutyLabel: string;
  offDutyLabel: string;
  onCheckIn: () => void;
  onMarkAbsent: () => void;
  loading?: boolean;
}) {
  return (
    <View style={styles.checkInCard}>
      <LinearGradient colors={['#D4A017', '#B6841C']} style={styles.cardGold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
      <Text style={styles.checkInTitle}>{title}</Text>
      <Text style={styles.checkInSub}>{subtitle}</Text>
      <View style={styles.checkInActions}>
        <Button title={onDutyLabel} variant="premium" onPress={onCheckIn} loading={loading} style={styles.checkInBtn} />
        <Button title={offDutyLabel} variant="secondary" onPress={onMarkAbsent} loading={loading} style={styles.checkInBtn} />
      </View>
    </View>
  );
}

export function TechOffDutyCard({
  badgeLabel,
  hint,
  backOnDutyLabel,
  onGoOnDuty,
  loading,
}: {
  badgeLabel: string;
  hint: string;
  backOnDutyLabel: string;
  onGoOnDuty: () => void;
  loading?: boolean;
}) {
  return (
    <View style={styles.offDutyCard}>
      <LinearGradient colors={['#FCA5A5', '#EF4444']} style={styles.cardGold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
      <View style={styles.offDutyBadgeRow}>
        <Text style={styles.offDutyBadgeText}>{badgeLabel}</Text>
      </View>
      <Text style={styles.offDutyHint}>{hint}</Text>
      <Button title={backOnDutyLabel} variant="premium" onPress={onGoOnDuty} loading={loading} />
    </View>
  );
}

export function TechOnDutyCard({
  badgeLabel,
  markOffLabel,
  onMarkOff,
  loading,
}: {
  badgeLabel: string;
  markOffLabel: string;
  onMarkOff: () => void;
  loading?: boolean;
}) {
  return (
    <View style={styles.onDutyCard}>
      <View style={styles.onDutyRow}>
        <Text style={styles.onDutyBadgeText}>{badgeLabel}</Text>
        <Pressable onPress={onMarkOff} disabled={loading} hitSlop={8}>
          <Text style={[styles.markOffLink, loading && styles.markOffDisabled]}>{markOffLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function TechDutyBadge({ label, variant }: { label: string; variant: 'on' | 'off' }) {
  return (
    <View style={[styles.dutyBadge, variant === 'on' ? styles.dutyOn : styles.dutyOff]}>
      <Text style={[styles.dutyText, variant === 'on' ? styles.dutyTextOn : styles.dutyTextOff]}>{label}</Text>
    </View>
  );
}

export function TechQuickLink({
  icon: Icon,
  label,
  onPress,
}: {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.quickLink, pressed && styles.pressed]} onPress={onPress}>
      <View style={styles.quickIcon}>
        <Icon size={16} color={colors.forest} strokeWidth={2.2} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sectionBlock: { paddingHorizontal: spacing.md, marginTop: spacing.md, marginBottom: spacing.xs },
  sectionRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  sectionText: { flex: 1 },
  sectionTitle: { fontFamily: fonts.displayExtra, fontSize: 17, color: colors.ink, letterSpacing: -0.3 },
  sectionHint: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 3, lineHeight: 17 },
  sectionAction: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.forest, paddingTop: 2 },
  sectionRule: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, gap: spacing.sm },
  sectionGold: { width: 28, height: 3, borderRadius: 2 },
  sectionLine: { flex: 1, height: 1, backgroundColor: colors.border },
  checkInCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: premium.radiusCard,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.07)',
    padding: spacing.md,
    paddingTop: spacing.sm + 4,
    overflow: 'hidden',
    ...shadows.card,
  },
  cardGold: { height: 3, marginHorizontal: -spacing.md, marginTop: -spacing.sm - 4, marginBottom: spacing.sm },
  checkInTitle: { fontFamily: fonts.display, fontSize: 15, color: colors.ink },
  checkInSub: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 4, marginBottom: spacing.md, lineHeight: 17 },
  checkInActions: { flexDirection: 'row', gap: spacing.sm },
  checkInBtn: { flex: 1 },
  offDutyCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: premium.radiusCard,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.12)',
    padding: spacing.md,
    paddingTop: spacing.sm + 4,
    overflow: 'hidden',
    ...shadows.card,
  },
  offDutyBadgeRow: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.15)',
    marginBottom: spacing.sm,
  },
  offDutyBadgeText: { fontFamily: fonts.bodySemi, fontSize: 13, color: '#B91C1C' },
  offDutyHint: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginBottom: spacing.md, lineHeight: 17 },
  onDutyCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: premium.radiusCard,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.07)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    ...shadows.card,
  },
  onDutyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  onDutyBadgeText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.forest, flex: 1 },
  markOffLink: { fontFamily: fonts.bodySemi, fontSize: 12, color: '#B91C1C' },
  markOffDisabled: { opacity: 0.5 },
  dutyBadge: {
    alignSelf: 'flex-start',
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  dutyOn: { backgroundColor: colors.soft, borderColor: 'rgba(20,83,45,0.12)' },
  dutyOff: { backgroundColor: '#FEF2F2', borderColor: 'rgba(220,38,38,0.15)' },
  dutyText: { fontFamily: fonts.bodySemi, fontSize: 13 },
  dutyTextOn: { color: colors.forest },
  dutyTextOff: { color: '#B91C1C' },
  quickLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.1)',
  },
  pressed: { opacity: 0.88 },
  quickIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.forest },
});
