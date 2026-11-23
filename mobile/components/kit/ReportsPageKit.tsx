import { LinearGradient } from 'expo-linear-gradient';
import { type LucideIcon } from 'lucide-react-native';
import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatRupee } from '@/components/kit/format';
import { GlassPanel } from '@/components/kit/GlassScreenKit';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { adminShadow } from '@/components/kit/homeUi';
import { PressableScale } from '@/components/ui/PressableScale';
import { colors, fonts, premium, spacing, surfaces, ui } from '@/constants/theme';
import { useWideWebLayout } from '@/lib/webAdmin';

/** Premium section card with gold accent for reports. */
export function ReportsSectionCard({
  title,
  hint,
  actionLabel,
  onAction,
  children,
  style,
  glass = false,
}: {
  title: string;
  hint?: string;
  actionLabel?: string;
  onAction?: () => void;
  children: ReactNode;
  style?: object;
  /** Wrap body in frosted glass panel. */
  glass?: boolean;
}) {
  const body = glass ? (
    <View style={styles.sectionBodyGlass}>
      <View style={styles.glassShell}>
        <GlassPanel padded intensity={42} style={styles.glassBody}>
          {children}
        </GlassPanel>
      </View>
    </View>
  ) : (
    <View style={styles.sectionBody}>{children}</View>
  );

  return (
    <View style={[styles.section, style]}>
      <View style={styles.sectionHead}>
        <View style={styles.titleCol}>
          <View style={styles.sectionText}>
            <Text style={styles.sectionTitle} numberOfLines={1}>
              {title}
            </Text>
            {hint ? <Text style={styles.sectionHint}>{hint}</Text> : null}
          </View>
        </View>
        {actionLabel && onAction ? (
          <Pressable
            onPress={onAction}
            hitSlop={8}
            style={({ pressed }) => pressed && styles.actionPressed}
            accessibilityRole="button"
            accessibilityLabel={`${actionLabel}, ${title}`}
          >
            <Text style={styles.sectionAction}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
      {body}
    </View>
  );
}

export type ReportsRankItem = {
  key: string;
  title: string;
  subtitle: string;
  value: number;
  onPress?: () => void;
};

/** Ranked list with proportional bars — top services, techs, customers. */
export function ReportsRankList({
  items,
  emptyMessage,
  flush = false,
}: {
  items: ReportsRankItem[];
  emptyMessage?: string;
  flush?: boolean;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));

  if (items.length === 0) {
    return <Text style={styles.empty}>{emptyMessage ?? 'No data for this period.'}</Text>;
  }

  return (
    <View style={flush ? styles.rankFlush : styles.rankCard}>
      {items.map((item, index) => {
        const width = `${Math.max(6, (item.value / max) * 100)}%`;
        const inner = (
          <>
            <View style={styles.rankHead}>
              <View style={styles.rankLeft}>
                <Text style={styles.rankIndex}>{index + 1}</Text>
                <View style={styles.rankText}>
                  <Text style={styles.rankTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.rankSub} numberOfLines={1}>
                    {item.subtitle}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.rankTrack}>
              <LinearGradient
                colors={[colors.forest, colors.green]}
                style={[styles.rankFill, { width: width as `${number}%` }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
          </>
        );

        if (item.onPress) {
          return (
            <PressableScale
              key={item.key}
              containerStyle={styles.rankRow}
              scaleTo={0.98}
              onPress={item.onPress}
              accessibilityRole="button"
              accessibilityLabel={`${index + 1}. ${item.title}, ${item.subtitle}`}
            >
              {inner}
            </PressableScale>
          );
        }
        return (
          <View key={item.key} style={styles.rankRow}>
            {inner}
          </View>
        );
      })}
    </View>
  );
}

/** Tallest bar in the 7-day chart. Bars are sized in points so count + label never push them past the card. */
const TREND_BAR_MAX = 72;
const TREND_BAR_MIN = 8;

/** 7-day booking volume mini chart. */
export function BookingsTrendChart({
  data,
  title = 'Bookings this week',
  flush = false,
  hideTitle = false,
}: {
  data: { label: string; count: number }[];
  title?: string;
  flush?: boolean;
  /** Keep only the "7 days" chip when a section heading already names the chart. */
  hideTitle?: boolean;
}) {
  const buckets = data.length > 0 ? data : [{ label: '-', count: 0 }];
  const max = Math.max(...buckets.map((b) => b.count), 1);

  return (
    <View style={flush ? styles.chartFlush : styles.chartCard}>
      <View style={[styles.chartHead, hideTitle && styles.chartHeadEnd]}>
        {hideTitle ? null : (
          <Text style={styles.chartTitle} numberOfLines={1}>
            {title}
          </Text>
        )}
        <View style={styles.chartChip}>
          <Text style={styles.chartChipText}>7 days</Text>
        </View>
      </View>
      <View style={styles.bars}>
        {buckets.map((b, i) => {
          const h = Math.max(TREND_BAR_MIN, Math.round((b.count / max) * TREND_BAR_MAX));
          const isLast = i === buckets.length - 1;
          return (
            <View key={`${b.label}-${i}`} style={styles.col}>
              <Text style={styles.barCount}>{b.count > 0 ? b.count : ''}</Text>
              <LinearGradient
                colors={isLast ? [colors.limeBright, colors.green] : [colors.forest, colors.green]}
                style={[styles.bar, { height: h }]}
                start={{ x: 0, y: 1 }}
                end={{ x: 0, y: 0 }}
              />
              <Text style={styles.barLabel} numberOfLines={1}>
                {b.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export type ReportsInsightItem = {
  key: string;
  label: string;
  value: string;
  hint?: string;
  accent?: string;
};

/** Compact insight tiles for reviews, payment, catalog stats. */
export function ReportsInsightGrid({ items, glass = false }: { items: ReportsInsightItem[]; glass?: boolean }) {
  const wideWeb = useWideWebLayout();
  return (
    <View style={styles.insightGrid}>
      {items.map((item) => (
        <View key={item.key} style={[styles.insightTile, wideWeb && styles.tileWide, glass && styles.insightTileGlass]}>
          <Text style={[styles.insightValue, item.accent ? { color: item.accent } : null]} numberOfLines={1}>
            {item.value}
          </Text>
          <Text style={styles.insightLabel} numberOfLines={1}>
            {item.label}
          </Text>
          {item.hint ? (
            <Text style={styles.insightHint} numberOfLines={1}>
              {item.hint}
            </Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

export function ReportsTeamCard({
  checkedInToday,
  totalTechnicians,
  averageRate,
  lowAttendance,
  onTechPress,
  flush = false,
}: {
  checkedInToday: number;
  totalTechnicians: number;
  averageRate: number;
  lowAttendance: { id: string; name: string; rate: number }[];
  onTechPress: (id: string) => void;
  flush?: boolean;
}) {
  return (
    <View style={flush ? styles.teamFlush : styles.teamCard}>
      <View style={styles.teamStats}>
        <View style={styles.teamStat}>
          <Text style={styles.teamStatVal}>{checkedInToday}/{totalTechnicians}</Text>
          <Text style={styles.teamStatLbl}>Checked in today</Text>
        </View>
        <View style={styles.teamDivider} />
        <View style={styles.teamStat}>
          <Text style={styles.teamStatVal}>{averageRate}%</Text>
          <Text style={styles.teamStatLbl}>Avg attendance</Text>
        </View>
      </View>
      {lowAttendance.length > 0 ? (
        <>
          <Text style={styles.teamSub}>Needs attention</Text>
          {lowAttendance.map((t) => (
            <Pressable
              key={t.id}
              style={({ pressed }) => [styles.teamRow, pressed && styles.pressed]}
              onPress={() => onTechPress(t.id)}
              accessibilityRole="button"
              accessibilityLabel={`${t.name}, ${t.rate}% attendance`}
            >
              <Text style={styles.teamName} numberOfLines={1}>
                {t.name}
              </Text>
              <Text style={styles.teamRate}>{t.rate}%</Text>
            </Pressable>
          ))}
        </>
      ) : (
        <Text style={styles.teamOk}>All technicians above 80% attendance.</Text>
      )}
    </View>
  );
}

export function ReportsManageGrid({
  items,
  onPress,
}: {
  items: { key: string; icon: LucideIcon; label: string; desc: string }[];
  onPress: (key: string) => void;
}) {
  const wideWeb = useWideWebLayout();
  return (
    <View style={styles.manageGrid}>
      {items.map(({ key, icon: Icon, label, desc }) => (
        <Pressable
          key={key}
          style={({ pressed }) => [styles.manageTile, wideWeb && styles.tileWide, pressed && styles.pressed]}
          onPress={() => onPress(key)}
        >
          <PremiumIcon icon={Icon} variant="mint" size={18} color={colors.forest} boxSize={36} />
          <Text style={styles.manageLabel}>{label}</Text>
          <Text style={styles.manageDesc} numberOfLines={2}>
            {desc}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export function formatReportCurrency(n: number): string {
  return formatRupee(n);
}

const styles = StyleSheet.create({
  section: { marginTop: spacing.md },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: spacing.md },
  titleCol: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionText: { flex: 1, minWidth: 0 },
  sectionTitle: { fontFamily: fonts.displayExtra, fontSize: 17, color: colors.ink, letterSpacing: -0.35 },
  sectionHint: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 3, lineHeight: 17 },
  sectionAction: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.forest, paddingTop: 2 },
  actionPressed: { opacity: 0.6 },
  sectionBody: { paddingHorizontal: spacing.md, marginTop: spacing.sm },
  sectionBodyGlass: { paddingHorizontal: spacing.md, marginTop: spacing.sm },
  glassShell: { borderRadius: premium.radiusCard, ...adminShadow.card },
  glassBody: { borderColor: surfaces.glassBorderStrong, borderRadius: premium.radiusCard },
  empty: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, paddingVertical: spacing.sm },
  rankCard: {
    borderRadius: premium.radiusCard,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
    padding: spacing.md,
    paddingTop: spacing.sm + 4,
    overflow: 'hidden',
    ...adminShadow.card,
  },
  rankGold: { height: 3, marginHorizontal: -spacing.md, marginTop: -spacing.sm - 4, marginBottom: spacing.sm },
  rankFlush: {},
  rankRow: { marginBottom: spacing.sm + 2 },
  pressed: { opacity: 0.88 },
  rankHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  rankLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  rankIndex: { fontFamily: fonts.displayExtra, fontSize: 13, color: colors.forest, width: 18 },
  rankText: { flex: 1, minWidth: 0 },
  rankTitle: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ink },
  rankSub: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 1 },
  rankTrack: { height: 8, backgroundColor: ui.hairline, borderRadius: 5, overflow: 'hidden' },
  rankFill: { height: '100%', borderRadius: 5 },
  chartCard: {
    borderRadius: premium.radiusCard,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
    padding: spacing.md,
    paddingTop: spacing.sm + 4,
    overflow: 'hidden',
    ...adminShadow.card,
  },
  chartGold: { height: 3, marginHorizontal: -spacing.md, marginTop: -spacing.sm - 4, marginBottom: spacing.sm },
  chartFlush: {},
  chartHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm, gap: 8 },
  chartHeadEnd: { justifyContent: 'flex-end' },
  chartTitle: { flex: 1, fontFamily: fonts.display, fontSize: 15, color: colors.ink },
  chartChip: { backgroundColor: colors.mint, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1, borderColor: surfaces.glassBorderStrong },
  chartChipText: { fontFamily: fonts.bodySemi, fontSize: 10, color: colors.forest },
  bars: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingTop: 8, gap: 6 },
  col: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  barCount: { fontFamily: fonts.bodySemi, fontSize: 9, color: colors.muted, marginBottom: 4, minHeight: 12 },
  bar: { width: '70%', borderTopLeftRadius: 6, borderTopRightRadius: 6, minHeight: 8 },
  barLabel: { fontFamily: fonts.bodySemi, fontSize: 9, color: colors.muted, marginTop: 6 },
  insightGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  /** Desktop browser: 4 tiles per row instead of 2 (insight + manage grids). */
  tileWide: { width: '22%' },
  insightTile: {
    width: '47%',
    flexGrow: 1,
    padding: spacing.md,
    borderRadius: premium.radiusCard,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
    ...adminShadow.tile,
  },
  /** Inside a white section card: a quiet grey tile instead of a second floating card. */
  insightTileGlass: {
    backgroundColor: ui.surfaceMuted,
    borderColor: ui.hairline,
    shadowOpacity: 0,
    elevation: 0,
  },
  insightValue: { fontFamily: fonts.displayExtra, fontSize: 20, color: colors.forest },
  insightLabel: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.ink, marginTop: 4 },
  insightHint: { fontFamily: fonts.body, fontSize: 10, color: colors.muted, marginTop: 2 },
  teamCard: {
    borderRadius: premium.radiusCard,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
    padding: spacing.md,
    paddingTop: spacing.sm + 4,
    overflow: 'hidden',
    ...adminShadow.card,
  },
  teamFlush: {},
  teamStats: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  teamStat: { flex: 1, alignItems: 'center' },
  teamStatVal: { fontFamily: fonts.displayExtra, fontSize: 20, color: colors.forest },
  teamStatLbl: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 2 },
  teamDivider: { width: 1, height: 36, backgroundColor: surfaces.glassBorderStrong },
  teamSub: { fontFamily: fonts.display, fontSize: 13, color: colors.ink, marginTop: spacing.sm, marginBottom: 6 },
  teamRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ui.border,
  },
  teamName: { flex: 1, fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ink },
  teamRate: { fontFamily: fonts.displayExtra, fontSize: 13, color: colors.forest },
  teamOk: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: spacing.xs },
  manageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  manageTile: {
    width: '47%',
    flexGrow: 1,
    padding: spacing.md,
    paddingTop: spacing.sm + 6,
    borderRadius: premium.radiusCard,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
    overflow: 'hidden',
    ...adminShadow.tile,
  },
  manageGold: { position: 'absolute', top: 0, left: 12, right: 12, height: 2, borderRadius: 1 },
  manageLabel: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ink, marginTop: 8 },
  manageDesc: { fontFamily: fonts.body, fontSize: 10, color: colors.muted, marginTop: 3, lineHeight: 14 },
});
