import { type ReactNode, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown } from 'lucide-react-native';
import { formatIndianNumber } from '@/components/charts/chartFormat';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Skeleton } from '@/components/ui/Skeleton';
import { colors, fonts, spacing, ui } from '@/constants/theme';
import { haptic } from '@/lib/motion';
import { PAGE_SIZES, type ListSort } from '@/types/adminLists';

/**
 * Desktop data table for the admin web panel (≥ 1024 px): typed columns, sortable sticky header, row
 * hover + press, a pager footer ("1–25 of 312", 25 / 50 / 100 rows, prev / next), skeleton rows while
 * loading, empty and error states. Phones use the screens' cards instead — see `AdminPagedList`.
 */

export type AdminTableColumn<T> = {
  key: string;
  title: string;
  /** Fixed width in px … */
  width?: number;
  /** … or a share of the remaining width (default 1). */
  flex?: number;
  minWidth?: number;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  /** Server sort key when it differs from `key`. */
  sortKey?: string;
  /** First order when this column becomes the sort (default desc). */
  defaultOrder?: 'asc' | 'desc';
  render: (row: T, index: number) => ReactNode;
};

const webPointer: ViewStyle | null = Platform.OS === 'web' ? ({ cursor: 'pointer' } as ViewStyle) : null;

/**
 * A pressable row opens the item's detail. On the web, react-native-web renders role "button" as a real
 * <button>, and cells may hold their own buttons (Assign, Approve…): a button inside a button is invalid
 * HTML. "link" renders a focusable div and also says what the row does (opens a page).
 */
const ROW_ROLE = Platform.OS === 'web' ? 'link' : 'button';

function cellSize<T>(col: AdminTableColumn<T>): ViewStyle {
  if (col.width) return { width: col.width, flexGrow: 0, flexShrink: 0 };
  return { flex: col.flex ?? 1, minWidth: col.minWidth ?? 80 };
}

function cellAlign<T>(col: AdminTableColumn<T>): ViewStyle {
  if (col.align === 'right') return { alignItems: 'flex-end' };
  if (col.align === 'center') return { alignItems: 'center' };
  return { alignItems: 'flex-start' };
}

/* ─── Cell text helpers (one look across every table) ─────────────── */

export function TableText({
  children,
  strong,
  muted,
  mono,
  lines = 1,
  color,
}: {
  children: ReactNode;
  strong?: boolean;
  muted?: boolean;
  mono?: boolean;
  lines?: number;
  color?: string;
}) {
  return (
    <Text
      numberOfLines={lines}
      style={[styles.text, strong && styles.textStrong, muted && styles.textMuted, mono && styles.textMono, color ? { color } : null]}
    >
      {children}
    </Text>
  );
}

/** Title + caption stacked in one cell. */
export function TableTwoLine({ title, sub, strong = true }: { title: ReactNode; sub?: ReactNode; strong?: boolean }) {
  return (
    <View style={styles.twoLine}>
      <TableText strong={strong}>{title}</TableText>
      {sub ? <TableText muted>{sub}</TableText> : null}
    </View>
  );
}

/* ─── Header ───────────────────────────────────────────────────────── */

export function AdminTableHead<T>({
  columns,
  sort,
  onSortChange,
  style,
}: {
  columns: AdminTableColumn<T>[];
  sort?: ListSort;
  onSortChange?: (sort: ListSort) => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.head, style]} accessibilityRole="header">
      {columns.map((col) => {
        const key = col.sortKey ?? col.key;
        const active = Boolean(sort && sort.key === key);
        const sortable = Boolean(col.sortable && onSortChange);
        const label = (
          <View style={[styles.headInner, col.align === 'right' && styles.headInnerRight, col.align === 'center' && styles.headInnerCenter]}>
            <Text style={[styles.headText, active && styles.headTextActive]} numberOfLines={1}>
              {col.title}
            </Text>
            {sortable ? (
              active ? (
                sort!.order === 'asc' ? (
                  <ArrowUp size={13} color={ui.text} strokeWidth={2.6} />
                ) : (
                  <ArrowDown size={13} color={ui.text} strokeWidth={2.6} />
                )
              ) : (
                <ChevronsUpDown size={13} color={ui.textTertiary} strokeWidth={2.2} />
              )
            ) : null}
          </View>
        );
        if (!sortable) {
          return (
            <View key={col.key} style={[styles.headCell, cellSize(col), cellAlign(col)]}>
              {label}
            </View>
          );
        }
        return (
          <Pressable
            key={col.key}
            onPress={() => {
              haptic('select');
              onSortChange!(
                active
                  ? { key, order: sort!.order === 'asc' ? 'desc' : 'asc' }
                  : { key, order: col.defaultOrder ?? 'desc' },
              );
            }}
            style={({ pressed }) => [styles.headCell, cellSize(col), cellAlign(col), webPointer, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={`Sort by ${col.title}${active ? (sort!.order === 'asc' ? ', ascending' : ', descending') : ''}`}
          >
            {label}
          </Pressable>
        );
      })}
    </View>
  );
}

/* ─── Rows ─────────────────────────────────────────────────────────── */

function TableRow<T>({
  row,
  index,
  columns,
  last,
  onPress,
  rowLabel,
}: {
  row: T;
  index: number;
  columns: AdminTableColumn<T>[];
  last: boolean;
  onPress?: (row: T) => void;
  rowLabel?: (row: T) => string;
}) {
  const [hover, setHover] = useState(false);
  return (
    <Pressable
      onPress={onPress ? () => onPress(row) : undefined}
      disabled={!onPress}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      style={[styles.row, last && styles.rowLast, hover && styles.rowHover, onPress ? webPointer : null]}
      accessibilityRole={onPress ? ROW_ROLE : undefined}
      accessibilityLabel={rowLabel?.(row)}
    >
      {columns.map((col) => (
        <View key={col.key} style={[styles.cell, cellSize(col), cellAlign(col)]}>
          {col.render(row, index)}
        </View>
      ))}
    </Pressable>
  );
}

export function AdminTableRows<T>({
  columns,
  rows,
  keyExtractor,
  onRowPress,
  rowLabel,
  loading,
  skeletonRows = 8,
  error,
  onRetry,
  emptyTitle = 'Nothing here',
  emptyMessage,
  emptyActionLabel,
  onEmptyAction,
  style,
}: {
  columns: AdminTableColumn<T>[];
  rows: T[];
  keyExtractor: (row: T) => string;
  onRowPress?: (row: T) => void;
  rowLabel?: (row: T) => string;
  loading?: boolean;
  skeletonRows?: number;
  error?: string | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  let body: ReactNode;
  if (loading) {
    body = Array.from({ length: skeletonRows }, (_, i) => (
      <View key={`s${i}`} style={[styles.row, i === skeletonRows - 1 && styles.rowLast]} accessibilityElementsHidden>
        {columns.map((col, ci) => (
          <View key={col.key} style={[styles.cell, cellSize(col), cellAlign(col)]}>
            <Skeleton width={ci === 0 ? '80%' : col.align === 'right' ? '55%' : '68%'} height={12} radius={6} />
          </View>
        ))}
      </View>
    ));
  } else if (error && rows.length === 0) {
    body = (
      <View style={styles.state}>
        <ListEmptyRetry message={error} onRetry={onRetry} />
      </View>
    );
  } else if (rows.length === 0) {
    body = (
      <View style={styles.state}>
        <EmptyState title={emptyTitle} message={emptyMessage} actionLabel={emptyActionLabel} onAction={onEmptyAction} />
      </View>
    );
  } else {
    body = rows.map((row, i) => (
      <TableRow
        key={keyExtractor(row)}
        row={row}
        index={i}
        columns={columns}
        last={i === rows.length - 1}
        onPress={onRowPress}
        rowLabel={rowLabel}
      />
    ));
  }
  return (
    <View style={[styles.body, style]} accessibilityRole={loading ? 'progressbar' : undefined} accessibilityLabel={loading ? 'Loading' : undefined}>
      {body}
    </View>
  );
}

/* ─── Footer (pager) ─────────────────────────────────────────────── */

function PagerButton({ label, disabled, onPress, children }: { label: string; disabled: boolean; onPress: () => void; children: ReactNode }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.pageBtn, disabled && styles.pageBtnDisabled, !disabled && webPointer, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
    >
      {children}
    </Pressable>
  );
}

export function AdminTableFooter({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizes = PAGE_SIZES as readonly number[],
  noun = 'rows',
  style,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizes?: readonly number[];
  noun?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <View style={[styles.footer, style]}>
      <Text style={styles.footerText}>
        {total === 0 ? `No ${noun}` : `${formatIndianNumber(from)}–${formatIndianNumber(to)} of ${formatIndianNumber(total)} ${noun}`}
      </Text>
      <View style={styles.footerRight}>
        {onPageSizeChange ? (
          <View style={styles.sizes}>
            <Text style={styles.footerLabel}>Rows</Text>
            {pageSizes.map((size) => {
              const active = size === pageSize;
              return (
                <Pressable
                  key={size}
                  onPress={() => onPageSizeChange(size)}
                  style={({ pressed }) => [styles.sizeChip, active && styles.sizeChipActive, webPointer, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`${size} rows per page`}
                >
                  <Text style={[styles.sizeText, active && styles.sizeTextActive]}>{size}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
        <View style={styles.pager}>
          <PagerButton label="Previous page" disabled={page <= 1} onPress={() => onPageChange(page - 1)}>
            <ChevronLeft size={16} color={page <= 1 ? ui.textTertiary : ui.text} strokeWidth={2.4} />
          </PagerButton>
          <Text style={styles.pageText}>
            Page {formatIndianNumber(page)} of {formatIndianNumber(pages)}
          </Text>
          <PagerButton label="Next page" disabled={page >= pages} onPress={() => onPageChange(page + 1)}>
            <ChevronRight size={16} color={page >= pages ? ui.textTertiary : ui.text} strokeWidth={2.4} />
          </PagerButton>
        </View>
      </View>
    </View>
  );
}

/* ─── Standalone table (own scroll, sticky header) ───────────────── */

export function AdminDataTable<T>({
  columns,
  rows,
  keyExtractor,
  sort,
  onSortChange,
  onRowPress,
  rowLabel,
  loading,
  error,
  onRetry,
  emptyTitle,
  emptyMessage,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  noun,
  maxHeight,
}: {
  columns: AdminTableColumn<T>[];
  rows: T[];
  keyExtractor: (row: T) => string;
  sort?: ListSort;
  onSortChange?: (sort: ListSort) => void;
  onRowPress?: (row: T) => void;
  rowLabel?: (row: T) => string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyMessage?: string;
  /** Pager — leave out for a short, unpaged table. */
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  noun?: string;
  /** Scroll inside the table past this height (header stays put). */
  maxHeight?: number;
}) {
  const paged = page !== undefined && pageSize !== undefined && total !== undefined && onPageChange;
  return (
    <View style={styles.card}>
      <ScrollView style={maxHeight ? { maxHeight } : undefined} stickyHeaderIndices={[0]} nestedScrollEnabled>
        <AdminTableHead columns={columns} sort={sort} onSortChange={onSortChange} />
        <AdminTableRows
          columns={columns}
          rows={rows}
          keyExtractor={keyExtractor}
          onRowPress={onRowPress}
          rowLabel={rowLabel}
          loading={loading}
          error={error}
          onRetry={onRetry}
          emptyTitle={emptyTitle}
          emptyMessage={emptyMessage}
          skeletonRows={Math.min(pageSize ?? 6, 8)}
        />
      </ScrollView>
      {paged ? (
        <AdminTableFooter
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          noun={noun}
        />
      ) : null}
    </View>
  );
}

export const adminTableStyles = StyleSheet.create({
  /** Sticky header inside a page scroll: card top. */
  headCard: {
    marginHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: ui.border,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    overflow: 'hidden',
  },
  /** Rows between the sticky header and the footer. */
  bodyCard: {
    marginHorizontal: spacing.md,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: ui.border,
    backgroundColor: colors.white,
  },
  footerCard: {
    marginHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: ui.border,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    backgroundColor: colors.white,
  },
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingHorizontal: 12,
    backgroundColor: '#F9FBF9',
    borderBottomWidth: 1,
    borderBottomColor: ui.border,
  },
  headCell: { paddingHorizontal: 8, paddingVertical: 10, justifyContent: 'center' },
  headInner: { flexDirection: 'row', alignItems: 'center', gap: 5, maxWidth: '100%' },
  headInnerRight: { justifyContent: 'flex-end' },
  headInnerCenter: { justifyContent: 'center' },
  headText: {
    fontFamily: fonts.bodySemi,
    fontSize: 11.5,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: ui.textSecondary,
    flexShrink: 1,
  },
  headTextActive: { color: ui.text },
  body: { backgroundColor: colors.white },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ui.border,
    backgroundColor: colors.white,
  },
  rowLast: { borderBottomWidth: 0 },
  rowHover: { backgroundColor: '#F6FAF6' },
  cell: { paddingHorizontal: 8, paddingVertical: 10, justifyContent: 'center', minWidth: 0 },
  state: { paddingVertical: spacing.lg, minHeight: 220 },
  text: { fontFamily: fonts.body, fontSize: 13.5, lineHeight: 19, color: ui.text, maxWidth: '100%' },
  textStrong: { fontFamily: fonts.bodySemi },
  textMuted: { fontSize: 12.5, lineHeight: 17, color: ui.textSecondary },
  textMono: { fontFamily: fonts.bodySemi, letterSpacing: 0.3 },
  twoLine: { minWidth: 0, maxWidth: '100%', gap: 1 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: ui.border,
    backgroundColor: colors.white,
  },
  footerText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: ui.textSecondary },
  footerRight: { flexDirection: 'row', alignItems: 'center', gap: 18, flexWrap: 'wrap' },
  footerLabel: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: ui.textSecondary, marginRight: 2 },
  sizes: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sizeChip: {
    minWidth: 38,
    height: 30,
    paddingHorizontal: 10,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: colors.white,
  },
  sizeChipActive: { backgroundColor: ui.text, borderColor: ui.text },
  sizeText: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: ui.text },
  sizeTextActive: { color: colors.white },
  pager: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pageBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: colors.white,
  },
  pageBtnDisabled: { backgroundColor: ui.surfaceMuted },
  pageText: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: ui.text, minWidth: 96, textAlign: 'center' },
  pressed: { opacity: 0.75 },
});
