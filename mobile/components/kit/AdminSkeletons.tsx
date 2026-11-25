import { type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Skeleton } from '@/components/ui/Skeleton';
import { ADMIN_KPI_COLS, useAdminGridCellWidth } from '@/lib/adminGrid';
import { colors, premium, spacing, ui } from '@/constants/theme';

/**
 * Shimmer placeholders for the admin panel — each one is shaped like the screen it stands in for,
 * so content settles into place instead of popping in after a spinner.
 * Built on the shared `Skeleton` (one sweep clock, reduce-motion aware).
 */

type Width = number | `${number}%`;

/** Announced once to screen readers; the grey blocks themselves are hidden from accessibility. */
const loadingA11y = {
  accessible: true,
  accessibilityRole: 'progressbar' as const,
  accessibilityLabel: 'Loading',
};

function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/** Title + hint bar, matching `AdminSectionTitle` spacing. */
export function AdminSectionSkeleton({ flush = false, hint = true }: { flush?: boolean; hint?: boolean }) {
  return (
    <View style={[styles.section, flush && styles.flush]}>
      <Skeleton width="42%" height={18} radius={7} />
      {hint ? <Skeleton width="62%" height={12} radius={6} style={styles.mt8} /> : null}
    </View>
  );
}

/** Stats strip card — values over labels, like `AdminStatStrip`. */
export function AdminStatStripSkeleton({ cells = 4 }: { cells?: number }) {
  return (
    <Card style={styles.strip}>
      {Array.from({ length: cells }, (_, i) => (
        <View key={i} style={styles.stripCell}>
          <Skeleton width={36} height={20} radius={6} />
          <Skeleton width={52} height={10} radius={5} style={styles.mt8} />
        </View>
      ))}
    </Card>
  );
}

const CHIP_WIDTHS = [58, 86, 74, 96, 70];

/** Row of filter pills, like `AdminFilterChips`. */
export function AdminChipsSkeleton({ count = 4, inset = false }: { count?: number; inset?: boolean }) {
  return (
    <View style={[styles.chips, inset && styles.chipsInset]}>
      {CHIP_WIDTHS.slice(0, count).map((w, i) => (
        <Skeleton key={i} width={w} height={36} radius={18} />
      ))}
    </View>
  );
}

export type AdminRowVariant =
  | 'booking'
  | 'person'
  | 'technician'
  | 'service'
  | 'offer'
  | 'review'
  | 'leave'
  | 'payroll'
  | 'notification';

type RowShape = {
  lead?: { size: number; round?: boolean };
  lines: Width[];
  trail?: 'pill' | 'switch' | 'amount';
  /** Ref + status pill above the main row (booking cards). */
  top?: boolean;
  footer?: 'buttons' | 'stats';
};

const ROWS: Record<AdminRowVariant, RowShape> = {
  booking: { top: true, lead: { size: 46 }, lines: ['72%', '52%', '64%'], trail: 'amount' },
  person: { lead: { size: 42 }, lines: ['56%', '74%'], trail: 'pill' },
  technician: { lead: { size: 46, round: true }, lines: ['52%', '70%'], footer: 'stats' },
  service: { lead: { size: 52 }, lines: ['64%', '38%', '56%'], trail: 'switch' },
  offer: { lead: { size: 46 }, lines: ['44%', '80%', '58%'], trail: 'switch' },
  review: { lines: ['34%', '58%', '92%', '70%'] },
  leave: { lines: ['46%', '62%', '84%'], footer: 'buttons' },
  payroll: { lead: { size: 42 }, lines: ['50%', '68%'], trail: 'amount' },
  notification: { lead: { size: 40 }, lines: ['68%', '92%'] },
};

/** One list card placeholder. */
export function AdminRowSkeleton({ variant = 'person' }: { variant?: AdminRowVariant }) {
  const shape = ROWS[variant];
  return (
    <Card>
      {shape.top ? (
        <View style={[styles.between, styles.mb12]}>
          <Skeleton width={84} height={10} radius={5} />
          <Skeleton width={74} height={22} radius={11} />
        </View>
      ) : null}
      <View style={styles.row}>
        {shape.lead ? (
          <Skeleton
            width={shape.lead.size}
            height={shape.lead.size}
            radius={shape.lead.round ? shape.lead.size / 2 : 14}
          />
        ) : null}
        <View style={styles.flex}>
          {shape.lines.map((w, i) => (
            <Skeleton key={i} width={w} height={i === 0 ? 14 : 11} radius={6} style={i > 0 ? styles.mt8 : undefined} />
          ))}
        </View>
        {shape.trail === 'pill' ? <Skeleton width={58} height={22} radius={11} /> : null}
        {shape.trail === 'switch' ? <Skeleton width={46} height={28} radius={14} /> : null}
        {shape.trail === 'amount' ? <Skeleton width={58} height={16} radius={6} /> : null}
      </View>
      {shape.footer === 'buttons' ? (
        <View style={[styles.row, styles.mt16]}>
          <Skeleton width="48%" height={44} radius={14} />
          <Skeleton width="48%" height={44} radius={14} />
        </View>
      ) : null}
      {shape.footer === 'stats' ? (
        <>
          <Skeleton width="100%" height={52} radius={12} style={styles.mt12} />
          <View style={[styles.row, styles.mt12]}>
            <Skeleton width="48%" height={38} radius={11} />
            <Skeleton width="48%" height={38} radius={11} />
          </View>
        </>
      ) : null}
    </Card>
  );
}

/** Full list screen body — optional stats strip, search and chips above the rows. */
export function AdminListSkeleton({
  variant = 'person',
  rows = 5,
  strip = false,
  stripCells,
  search = false,
  chips = false,
}: {
  variant?: AdminRowVariant;
  rows?: number;
  strip?: boolean;
  stripCells?: number;
  search?: boolean;
  chips?: boolean;
}) {
  return (
    <View style={styles.list} {...loadingA11y}>
      {strip ? <AdminStatStripSkeleton cells={stripCells} /> : null}
      {search ? <Skeleton width="100%" height={48} radius={14} /> : null}
      {chips ? <AdminChipsSkeleton /> : null}
      {Array.from({ length: rows }, (_, i) => (
        <AdminRowSkeleton key={i} variant={variant} />
      ))}
    </View>
  );
}

function KpiGridSkeleton() {
  const w = useAdminGridCellWidth(ADMIN_KPI_COLS);
  return (
    <View style={styles.grid}>
      {[0, 1, 2, 3].map((i) => (
        <Card key={i} style={[styles.kpi, { width: w }]}>
          <Skeleton width={36} height={36} radius={11} />
          <Skeleton width="58%" height={24} radius={7} style={styles.mt16} />
          <Skeleton width="44%" height={11} radius={5} style={styles.mt8} />
        </Card>
      ))}
    </View>
  );
}

/** A chart card: title bar then the plot area. */
function ChartCardSkeleton({ height = 170 }: { height?: number }) {
  return (
    <View style={styles.gutter}>
      <Card>
        <Skeleton width="38%" height={15} radius={6} />
        <Skeleton width="56%" height={11} radius={5} style={styles.mt8} />
        <Skeleton width="100%" height={height} radius={14} style={styles.mt16} />
      </Card>
    </View>
  );
}

/** Dashboard tab — range chips, KPI tiles, revenue chart, status + services cards, today's schedule. */
export function AdminDashboardSkeleton() {
  return (
    <View style={styles.page} {...loadingA11y}>
      <View style={[styles.gutter, styles.mt12]}>
        <AdminChipsSkeleton count={5} />
      </View>
      <KpiGridSkeleton />
      <AdminSectionSkeleton />
      <ChartCardSkeleton />
      <AdminSectionSkeleton />
      <View style={[styles.gutter, styles.stack]}>
        <AdminRowSkeleton variant="booking" />
        <AdminRowSkeleton variant="booking" />
      </View>
    </View>
  );
}

/** Reports tab — range card, KPI tiles and a couple of chart cards. */
export function AdminReportsSkeleton() {
  return (
    <View style={styles.page} {...loadingA11y}>
      <View style={[styles.gutter, styles.mt12]}>
        <Card>
          <Skeleton width={52} height={10} radius={5} />
          <Skeleton width="54%" height={16} radius={6} style={styles.mt8} />
          <View style={styles.mt12}>
            <AdminChipsSkeleton count={5} />
          </View>
        </Card>
      </View>
      <AdminSectionSkeleton />
      <KpiGridSkeleton />
      <AdminSectionSkeleton />
      <ChartCardSkeleton />
      <AdminSectionSkeleton />
      <ChartCardSkeleton height={120} />
    </View>
  );
}

/** Edit / create forms — optional hero preview, then cards of label + field pairs. */
export function AdminFormSkeleton({ preview = false, cards = [3, 2] }: { preview?: boolean; cards?: number[] }) {
  return (
    <View style={styles.form} {...loadingA11y}>
      {preview ? <Skeleton width="100%" height={128} radius={22} /> : null}
      {cards.map((fields, c) => (
        <Card key={c}>
          <Skeleton width="36%" height={16} radius={6} />
          <Skeleton width="58%" height={11} radius={5} style={styles.mt8} />
          {Array.from({ length: fields }, (_, f) => (
            <View key={f} style={styles.mt16}>
              <Skeleton width={84} height={11} radius={5} />
              <Skeleton width="100%" height={54} radius={14} style={styles.mt8} />
            </View>
          ))}
        </Card>
      ))}
    </View>
  );
}

/** Booking detail — status banner, process tracker, facts and an action card. */
export function AdminBookingDetailSkeleton() {
  return (
    <View style={styles.list} {...loadingA11y}>
      <Skeleton width="100%" height={64} radius={20} />
      <Card>
        <Skeleton width="40%" height={14} radius={6} />
        <Skeleton width="70%" height={11} radius={5} style={styles.mt8} />
        <View style={[styles.between, styles.mt16]}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} width={30} height={30} radius={15} />
          ))}
        </View>
      </Card>
      <Card>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[styles.row, i > 0 && styles.mt16]}>
            <Skeleton width={36} height={36} radius={12} />
            <View style={styles.flex}>
              <Skeleton width="30%" height={10} radius={5} />
              <Skeleton width="68%" height={13} radius={6} style={styles.mt8} />
            </View>
          </View>
        ))}
      </Card>
      <Card>
        <Skeleton width="32%" height={14} radius={6} />
        <Skeleton width="86%" height={11} radius={5} style={styles.mt8} />
        <Skeleton width="100%" height={52} radius={14} style={styles.mt16} />
      </Card>
    </View>
  );
}

/** Customer / technician profile — identity card, then the first rows below it. */
export function AdminProfileSkeleton({ variant = 'customer' }: { variant?: 'customer' | 'technician' }) {
  return (
    <View style={styles.list} {...loadingA11y}>
      <Card>
        {variant === 'technician' ? (
          <View style={styles.row}>
            <Skeleton width={52} height={52} radius={16} />
            <View style={styles.flex}>
              <Skeleton width="56%" height={16} radius={6} />
              <Skeleton width="38%" height={11} radius={5} style={styles.mt8} />
            </View>
          </View>
        ) : (
          <Skeleton width={110} height={22} radius={11} />
        )}
        <View style={[styles.row, styles.mt16]}>
          <Skeleton width="48%" height={76} radius={14} />
          <Skeleton width="48%" height={76} radius={14} />
        </View>
        <Skeleton width="72%" height={12} radius={6} style={styles.mt16} />
        <Skeleton width="54%" height={12} radius={6} style={styles.mt8} />
        <View style={[styles.row, styles.mt16]}>
          <Skeleton width={78} height={34} radius={17} />
          <Skeleton width={78} height={34} radius={17} />
          <Skeleton width={96} height={34} radius={17} />
        </View>
      </Card>
      <AdminSectionSkeleton flush />
      {variant === 'technician' ? (
        <Card>
          <Skeleton width="100%" height={260} radius={14} />
        </Card>
      ) : (
        <>
          <AdminRowSkeleton variant="booking" />
          <AdminRowSkeleton variant="booking" />
        </>
      )}
    </View>
  );
}

/** Services landing — catalog hero, "All services" row and the pest-type grid. */
export function AdminServiceTypesSkeleton() {
  return (
    <View style={styles.list} {...loadingA11y}>
      <Skeleton width="100%" height={176} radius={20} />
      <Card style={styles.row}>
        <Skeleton width={46} height={46} radius={14} />
        <View style={styles.flex}>
          <Skeleton width="40%" height={14} radius={6} />
          <Skeleton width="28%" height={11} radius={5} style={styles.mt8} />
        </View>
      </Card>
      <Skeleton width={140} height={12} radius={6} style={styles.mt8} />
      <View style={styles.typeGrid}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} width="31%" height={118} radius={16} />
        ))}
      </View>
    </View>
  );
}

/** Data export — backup card with summary cells, then CSV sheet rows. Sits inside a padded GlassScreen. */
export function AdminExportSkeleton() {
  return (
    <View style={styles.stackMd} {...loadingA11y}>
      <Card>
        <Skeleton width={84} height={10} radius={5} />
        <Skeleton width="56%" height={20} radius={7} style={styles.mt8} />
        <Skeleton width="100%" height={12} radius={6} style={styles.mt12} />
        <Skeleton width="82%" height={12} radius={6} style={styles.mt8} />
        <View style={[styles.typeGrid, styles.mt16]}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} width="31%" height={58} radius={14} />
          ))}
        </View>
        <Skeleton width="100%" height={52} radius={14} style={styles.mt16} />
      </Card>
      <AdminSectionSkeleton flush />
      {[0, 1, 2, 3].map((i) => (
        <AdminRowSkeleton key={i} variant="notification" />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: premium.radiusCard,
    borderWidth: 1,
    borderColor: ui.hairline,
    padding: spacing.md,
    ...ui.shadow,
  },
  page: { flex: 1, overflow: 'hidden', gap: spacing.sm },
  list: { flex: 1, overflow: 'hidden', padding: spacing.md, gap: spacing.sm },
  form: { flex: 1, overflow: 'hidden', padding: spacing.md, paddingTop: spacing.sm, gap: spacing.sm },
  gutter: { paddingHorizontal: spacing.md },
  stack: { gap: spacing.sm },
  stackMd: { gap: spacing.md },
  section: { paddingHorizontal: spacing.md, marginTop: spacing.md, marginBottom: spacing.xs },
  flush: { paddingHorizontal: 0 },
  strip: { flexDirection: 'row', paddingVertical: spacing.md + 4, paddingHorizontal: spacing.xs },
  stripCell: { flex: 1, alignItems: 'center' },
  chips: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  chipsInset: { paddingLeft: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: spacing.md },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  quickTile: { alignItems: 'center', paddingTop: 14, paddingBottom: 14, paddingHorizontal: 8, borderRadius: 18 },
  kpi: { borderRadius: 20, padding: 15 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  flex: { flex: 1, minWidth: 0 },
  mt8: { marginTop: 8 },
  mt12: { marginTop: 12 },
  mt16: { marginTop: 16 },
  mb12: { marginBottom: 12 },
});
