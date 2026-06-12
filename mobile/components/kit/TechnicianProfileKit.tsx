import { LinearGradient } from 'expo-linear-gradient';
import { type LucideIcon, Calendar, ClipboardList, BarChart3, Phone, Pencil, Clock, UserPlus } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { formatRupee } from '@/components/kit/format';
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge';
import { technicianDisplayRating, technicianRealRating } from '@/lib/ratings';
import type { TechnicianDetailStats, TechnicianMetricKey, User } from '@/types/api';
import { colors, fonts, premium, shadows, spacing, surfaces } from '@/constants/theme';

export type TechnicianViewMode = 'calendar' | 'list' | 'analytics';

type MetricTile = {
  key: TechnicianMetricKey | 'public_rating' | 'real_rating';
  label: string;
  value: string;
  wide?: boolean;
  onPress?: () => void;
};

export function TechnicianIdentityCard({
  technician,
  statusLabel,
  statusTone,
  isDisabled,
}: {
  technician: User;
  statusLabel: string;
  statusTone: BadgeTone;
  isDisabled?: boolean;
}) {
  const initials = technician.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={styles.identityCard}>
      <LinearGradient colors={['#D4A017', '#B6841C']} style={styles.goldBar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
      <View style={styles.identityRow}>
        <LinearGradient colors={['#14532D', '#1E8E4E']} style={styles.avatar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={styles.avatarText}>{initials}</Text>
        </LinearGradient>
        <View style={styles.identityText}>
          <View style={styles.statusRow}>
            <StatusBadge label={statusLabel} tone={statusTone} />
            {isDisabled ? <Text style={styles.disabledHint}>Account disabled</Text> : null}
          </View>
          {technician.city ? <Text style={styles.location}>{technician.city}</Text> : null}
        </View>
      </View>
      <View style={styles.contactBlock}>
        <Text style={styles.contactLine}>{technician.email}</Text>
        {technician.phone ? <Text style={styles.contactLine}>{technician.phone}</Text> : null}
      </View>
    </View>
  );
}

export function TechnicianMetricGrid({
  technician,
  stats,
  inProgress,
  awaitingVerify,
  onMetricPress,
}: {
  technician: User;
  stats: TechnicianDetailStats;
  inProgress: number;
  awaitingVerify: number;
  onMetricPress: (key: TechnicianMetricKey) => void;
}) {
  const publicRating =
    technicianDisplayRating(technician) > 0 ? `★ ${technicianDisplayRating(technician).toFixed(1)}` : '—';
  const realRating =
    technicianRealRating(technician) != null ? technicianRealRating(technician)!.toFixed(1) : '—';

  const tiles: MetricTile[] = [
    { key: 'public_rating', label: 'Public rating', value: publicRating },
    { key: 'real_rating', label: 'Real rating', value: realRating },
    { key: 'active', label: 'Active', value: String(stats.activeJobs), onPress: () => onMetricPress('active') },
    {
      key: 'in_progress',
      label: 'In progress',
      value: String(inProgress),
      onPress: () => onMetricPress('in_progress'),
    },
    {
      key: 'verify',
      label: 'Verify',
      value: String(awaitingVerify),
      onPress: () => onMetricPress('verify'),
    },
    {
      key: 'completed',
      label: 'Completed',
      value: String(stats.completedJobs),
      onPress: () => onMetricPress('completed'),
    },
    {
      key: 'earnings',
      label: 'Earnings',
      value: stats.earnings >= 1000 ? formatRupee(stats.earnings) : `₹${stats.earnings}`,
      wide: true,
      onPress: () => onMetricPress('earnings'),
    },
  ];

  return (
    <View style={styles.metricGrid}>
      {tiles.map((tile) => {
        const inner = (
          <>
            <Text style={styles.metricVal}>{tile.value}</Text>
            <Text style={styles.metricLabel}>{tile.label}</Text>
          </>
        );
        if (tile.onPress) {
          return (
            <Pressable
              key={tile.key}
              style={({ pressed }) => [
                styles.metricTile,
                tile.wide && styles.metricTileWide,
                pressed && styles.pressed,
              ]}
              onPress={tile.onPress}
            >
              {inner}
            </Pressable>
          );
        }
        return (
          <View key={tile.key} style={[styles.metricTile, tile.wide && styles.metricTileWide]}>
            {inner}
          </View>
        );
      })}
    </View>
  );
}

export function TechnicianMetaLine({
  totalJobs,
  lastJobDate,
  reviewCount,
}: {
  totalJobs: number;
  lastJobDate?: string;
  reviewCount: number;
}) {
  const parts = [`${totalJobs} total jobs`];
  if (lastJobDate) parts.push(`Last job ${lastJobDate}`);
  if (reviewCount > 0) parts.push(`${reviewCount} reviews`);
  return <Text style={styles.metaLine}>{parts.join(' · ')}</Text>;
}

type ActionItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  onPress: () => void;
  primary?: boolean;
};

export function TechnicianActionBar({ actions }: { actions: ActionItem[] }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionRow}>
      {actions.map(({ key, label, icon: Icon, onPress, primary }) => (
        <Pressable
          key={key}
          style={({ pressed }) => [
            styles.actionBtn,
            primary && styles.actionBtnPrimary,
            pressed && styles.pressed,
          ]}
          onPress={onPress}
        >
          <Icon size={15} color={primary ? colors.white : colors.forest} strokeWidth={2.2} />
          <Text style={[styles.actionLabel, primary && styles.actionLabelPrimary]}>{label}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const VIEW_TABS: { key: TechnicianViewMode; label: string; icon: LucideIcon }[] = [
  { key: 'calendar', label: 'Calendar', icon: Calendar },
  { key: 'list', label: 'List', icon: ClipboardList },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
];

export function TechnicianViewTabs({
  active,
  onChange,
}: {
  active: TechnicianViewMode;
  onChange: (mode: TechnicianViewMode) => void;
}) {
  return (
    <View style={styles.tabsWrap}>
      <LinearGradient colors={['#D4A017', '#B6841C']} style={styles.tabsGold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
      <View style={styles.tabsRow}>
        {VIEW_TABS.map(({ key, label, icon: Icon }) => {
          const selected = active === key;
          return (
            <Pressable
              key={key}
              onPress={() => onChange(key)}
              style={[styles.tab, selected && styles.tabActive]}
            >
              <Icon size={14} color={selected ? colors.white : colors.forest} strokeWidth={2.2} />
              <Text style={[styles.tabLabel, selected && styles.tabLabelActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function TechnicianProfileHeader({
  technician,
  stats,
  inProgress,
  awaitingVerify,
  statusLabel,
  statusTone,
  isDisabled,
  viewMode,
  onViewModeChange,
  onMetricPress,
  onCall,
  onEdit,
  onPending,
  onAssign,
  compact = false,
}: {
  technician: User;
  stats: TechnicianDetailStats;
  inProgress: number;
  awaitingVerify: number;
  statusLabel: string;
  statusTone: BadgeTone;
  isDisabled?: boolean;
  viewMode: TechnicianViewMode;
  onViewModeChange: (mode: TechnicianViewMode) => void;
  onMetricPress: (key: TechnicianMetricKey) => void;
  onCall?: () => void;
  onEdit: () => void;
  onPending: () => void;
  onAssign: () => void;
  /** Hide metric tiles when analytics tab shows full stats below. */
  compact?: boolean;
}) {
  const actions: ActionItem[] = [
    ...(onCall ? [{ key: 'call', label: 'Call', icon: Phone, onPress: onCall, primary: true }] : []),
    { key: 'edit', label: 'Edit account', icon: Pencil, onPress: onEdit },
    { key: 'pending', label: 'Pending', icon: Clock, onPress: onPending },
    { key: 'assign', label: 'Assign job', icon: UserPlus, onPress: onAssign },
  ];

  return (
    <View style={styles.header}>
      <TechnicianIdentityCard
        technician={technician}
        statusLabel={statusLabel}
        statusTone={statusTone}
        isDisabled={isDisabled}
      />
      {!compact ? (
        <>
          <TechnicianMetricGrid
            technician={technician}
            stats={stats}
            inProgress={inProgress}
            awaitingVerify={awaitingVerify}
            onMetricPress={onMetricPress}
          />
          <TechnicianMetaLine
            totalJobs={stats.totalJobs}
            lastJobDate={stats.lastJobDate}
            reviewCount={stats.reviewCount}
          />
        </>
      ) : null}
      <TechnicianActionBar actions={actions} />
      <TechnicianViewTabs active={viewMode} onChange={onViewModeChange} />
    </View>
  );
}

export function TechnicianReviewCard({ stars, comment, tags }: { stars: number; comment?: string; tags: string[] }) {
  return (
    <View style={styles.reviewCard}>
      <LinearGradient colors={['#D4A017', '#B6841C']} style={styles.reviewGold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
      <Text style={styles.reviewStars}>{'★'.repeat(stars)}{'☆'.repeat(5 - stars)}</Text>
      {comment ? <Text style={styles.reviewComment}>{comment}</Text> : null}
      {tags.length > 0 ? <Text style={styles.reviewTags}>{tags.join(' · ')}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.sm },
  identityCard: {
    borderRadius: premium.radiusCard,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.07)',
    padding: spacing.md,
    paddingTop: spacing.sm + 4,
    overflow: 'hidden',
    ...shadows.card,
  },
  goldBar: { height: 3, marginHorizontal: -spacing.md, marginTop: -spacing.sm - 4, marginBottom: spacing.sm },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.displayExtra, fontSize: 17, color: colors.white },
  identityText: { flex: 1 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  disabledHint: { fontFamily: fonts.body, fontSize: 11, color: surfaces.tintDangerInk },
  location: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ink, marginTop: 4 },
  contactBlock: { marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  contactLine: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, lineHeight: 18 },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metricTile: {
    width: '31%',
    flexGrow: 1,
    minWidth: '30%',
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.07)',
    ...shadows.card,
  },
  metricTileWide: { width: '100%', minWidth: '100%' },
  metricVal: { fontFamily: fonts.displayExtra, fontSize: 15, color: colors.forest },
  metricLabel: { fontFamily: fonts.body, fontSize: 9, color: colors.muted, marginTop: 3, textAlign: 'center' },
  metaLine: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, paddingHorizontal: 2 },
  actionRow: { gap: 8, paddingVertical: 2 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.1)',
  },
  actionBtnPrimary: { backgroundColor: colors.forest, borderColor: colors.forest },
  actionLabel: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.forest },
  actionLabelPrimary: { color: colors.white },
  tabsWrap: {
    borderRadius: premium.radiusCard,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.07)',
    overflow: 'hidden',
    ...shadows.card,
  },
  tabsGold: { height: 2, width: '100%' },
  tabsRow: { flexDirection: 'row', padding: 4, gap: 4 },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    borderRadius: 12,
  },
  tabActive: { backgroundColor: colors.forest },
  tabLabel: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.forest },
  tabLabelActive: { color: colors.white },
  pressed: { opacity: 0.88 },
  reviewCard: {
    borderRadius: premium.radiusCard,
    backgroundColor: colors.white,
    padding: spacing.md,
    paddingTop: spacing.sm + 4,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.07)',
    overflow: 'hidden',
    ...shadows.card,
  },
  reviewGold: { height: 2, marginHorizontal: -spacing.md, marginTop: -spacing.sm - 4, marginBottom: spacing.sm },
  reviewStars: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.amberInk, letterSpacing: 1 },
  reviewComment: { fontFamily: fonts.body, fontSize: 13, color: colors.ink, marginTop: 6, lineHeight: 19 },
  reviewTags: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 4 },
});
