import { LinearGradient } from 'expo-linear-gradient';
import { type LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { GlassPanel } from '@/components/kit/GlassScreenKit';
import { homeShadow } from '@/components/kit/homeUi';
import { Button } from '@/components/ui/Button';
import { adminType, colors, fonts, spacing, ui } from '@/constants/theme';

export function TechSectionTitle({
  title,
  hint,
  actionLabel,
  onAction,
  flush,
}: {
  title: string;
  hint?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Use inside TechScreenGutter — drops extra horizontal inset. */
  flush?: boolean;
}) {
  return (
    <View style={[styles.sectionBlock, flush && styles.sectionFlush]}>
      <View style={styles.sectionRow}>
        <View style={styles.sectionText}>
          <View style={styles.titleCol}>
            <LinearGradient
              colors={[colors.limeBright, colors.green]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.sectionAccent}
            />
            <View style={styles.sectionCopy}>
              <Text style={styles.sectionTitle}>{title}</Text>
              {hint ? <Text style={styles.sectionHint}>{hint}</Text> : null}
            </View>
          </View>
        </View>
        {actionLabel && onAction ? (
          <Pressable onPress={onAction} hitSlop={8}>
            <Text style={styles.sectionAction}>{actionLabel}</Text>
          </Pressable>
        ) : null}
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
  flush,
}: {
  title: string;
  subtitle: string;
  onDutyLabel: string;
  offDutyLabel: string;
  onCheckIn: () => void;
  onMarkAbsent: () => void;
  loading?: boolean;
  flush?: boolean;
}) {
  return (
    <View style={[styles.cardOuter, flush && styles.cardFlush]}>
      <View style={styles.cardShell}>
        <GlassPanel style={styles.checkInShell} padded={false} tone="light" goldEdge intensity={42}>
          <View style={styles.checkInCard}>
            <Text style={styles.checkInTitle}>{title}</Text>
            <Text style={styles.checkInSub}>{subtitle}</Text>
            <View style={styles.checkInActions}>
              <Button title={onDutyLabel} variant="premium" onPress={onCheckIn} loading={loading} style={styles.checkInBtn} />
              <Button title={offDutyLabel} variant="secondary" onPress={onMarkAbsent} loading={loading} style={styles.checkInBtn} />
            </View>
          </View>
        </GlassPanel>
      </View>
    </View>
  );
}

/** Present today + currently on duty — check out ends duty without marking absent. */
export function TechOnDutyCard({
  badgeLabel,
  checkedInAt,
  onCheckOut,
  onMarkAbsent,
  loading,
  flush,
}: {
  badgeLabel: string;
  checkedInAt?: string;
  onCheckOut: () => void;
  onMarkAbsent: () => void;
  loading?: boolean;
  flush?: boolean;
}) {
  const inLabel = checkedInAt
    ? `In since ${new Date(checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : 'On duty today';
  return (
    <View style={[styles.cardOuter, flush && styles.cardFlush]}>
      <View style={styles.cardShell}>
        <GlassPanel style={styles.checkInShell} padded={false} tone="mint" intensity={42}>
          <View style={styles.checkInCard}>
            <View style={styles.dutyRow}>
              <View style={styles.dutyIcon}>
                <View style={styles.dutyDotOuter}>
                  <View style={styles.dutyDot} />
                </View>
              </View>
              <View style={styles.dutyCopy}>
                <Text style={styles.checkInTitle}>{badgeLabel.replace(/^[●•]\s*/, '')}</Text>
                <Text style={styles.dutySub}>{inLabel}</Text>
              </View>
              <View style={styles.livePill}>
                <Text style={styles.livePillText}>LIVE</Text>
              </View>
            </View>
            <View style={styles.checkInActions}>
              <Button title="Check out" variant="premium" onPress={onCheckOut} loading={loading} style={styles.checkInBtn} />
              <Button title="Mark absent" variant="secondary" onPress={onMarkAbsent} loading={loading} style={styles.checkInBtn} />
            </View>
          </View>
        </GlassPanel>
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
  flush,
  showAction = true,
  tone = 'danger',
}: {
  badgeLabel: string;
  hint: string;
  backOnDutyLabel?: string;
  onGoOnDuty?: () => void;
  loading?: boolean;
  flush?: boolean;
  /** When false, only status + hint (e.g. approved leave). */
  showAction?: boolean;
  tone?: 'danger' | 'leave';
}) {
  const barColors = tone === 'leave' ? (['#93C5FD', '#3B82F6'] as const) : (['#FCA5A5', '#EF4444'] as const);
  return (
    <View style={[styles.cardOuter, flush && styles.cardFlush]}>
      <View style={styles.cardShell}>
        <GlassPanel
          style={[styles.offDutyShell, tone === 'leave' && styles.leaveShell]}
          padded={false}
          tone="light"
          intensity={42}
        >
          <LinearGradient colors={[...barColors]} style={styles.cardGold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
          <View style={styles.offDutyCard}>
            <View style={[styles.offDutyBadgeRow, tone === 'leave' && styles.leaveBadgeRow]}>
              <Text style={[styles.offDutyBadgeText, tone === 'leave' && styles.leaveBadgeText]}>{badgeLabel}</Text>
            </View>
            <Text style={[styles.offDutyHint, !showAction && styles.offDutyHintSolo]}>{hint}</Text>
            {showAction && backOnDutyLabel && onGoOnDuty ? (
              <Button title={backOnDutyLabel} variant="premium" onPress={onGoOnDuty} loading={loading} />
            ) : null}
          </View>
        </GlassPanel>
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
  icon,
  label,
  onPress,
}: {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.quickLink, pressed && styles.pressed]} onPress={onPress}>
      <PremiumIcon icon={icon} variant="mint" size="sm" color={colors.forest} bg={colors.soft} bgTo={colors.white} boxSize={28} />
      <Text style={styles.quickLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sectionBlock: { paddingHorizontal: spacing.md, marginTop: spacing.md, marginBottom: spacing.xs },
  sectionFlush: { paddingHorizontal: 0 },
  sectionRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  sectionText: { flex: 1 },
  titleCol: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  sectionAccent: { width: 3, height: 18, borderRadius: 2, marginTop: 2 },
  sectionCopy: { flex: 1, minWidth: 0 },
  sectionTitle: { ...adminType.sectionTitle, fontSize: 18, color: ui.text },
  sectionHint: { ...adminType.sectionHint, color: ui.textSecondary },
  sectionAction: { ...adminType.sectionLink, paddingTop: 2 },
  cardOuter: { marginHorizontal: spacing.md, marginTop: spacing.sm },
  cardShell: { borderRadius: 18, ...homeShadow.card },
  checkInShell: { borderRadius: 18 },
  checkInCard: { padding: spacing.md },
  cardGold: { height: 3, marginBottom: spacing.sm },
  checkInTitle: { ...adminType.formTitle, color: ui.text },
  checkInSub: { ...adminType.formSub, marginTop: 4, marginBottom: spacing.md, color: ui.textSecondary },
  checkInActions: { flexDirection: 'row', gap: spacing.sm },
  dutyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md },
  dutyIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: ui.hairline,
  },
  dutyDotOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(34,197,94,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dutyDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#22C55E' },
  dutyCopy: { flex: 1, minWidth: 0 },
  dutySub: { ...adminType.formSub, marginTop: 2, color: ui.textSecondary },
  livePill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: ui.brand,
  },
  livePillText: { fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 0.8, color: colors.white },
  checkInBtn: { flex: 1 },
  cardFlush: { marginHorizontal: 0 },
  offDutyShell: {
    borderRadius: 18,
    borderColor: 'rgba(179,63,40,0.12)',
    overflow: 'hidden',
  },
  offDutyCard: { padding: spacing.md, paddingTop: spacing.sm + 6 },
  offDutyBadgeRow: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.errorBg,
    borderWidth: 1,
    borderColor: 'rgba(179,63,40,0.18)',
    marginBottom: spacing.sm,
  },
  offDutyBadgeText: { ...adminType.chipText, color: colors.error },
  leaveShell: {
    borderColor: 'rgba(46,86,158,0.16)',
  },
  leaveBadgeRow: {
    backgroundColor: colors.blueBg,
    borderColor: 'rgba(46,86,158,0.2)',
  },
  leaveBadgeText: { color: colors.blue },
  offDutyHint: { ...adminType.formSub, marginBottom: spacing.md, color: ui.textSecondary },
  offDutyHintSolo: { marginBottom: 0 },
  onDutyShell: { borderRadius: 18, overflow: 'hidden' },
  onDutyInner: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 6 },
  onDutyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  onDutyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: ui.brandSoft,
    borderWidth: 1,
    borderColor: ui.border,
  },
  onDutyBadgeText: { ...adminType.chipText },
  markOffLink: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.error },
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
  dutyOn: { backgroundColor: ui.brandSoft, borderColor: ui.border },
  dutyOff: { backgroundColor: colors.errorBg, borderColor: 'rgba(179,63,40,0.18)' },
  dutyText: { ...adminType.chipText },
  dutyTextOn: { color: ui.brand },
  dutyTextOff: { color: colors.error },
  quickLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.border,
    ...homeShadow.soft,
  },
  pressed: { opacity: 0.88 },
  quickLabel: { ...adminType.quickLabel, color: ui.text },
});
