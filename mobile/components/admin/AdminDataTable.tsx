import { type ReactNode, useCallback, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { ArrowDown, ArrowUp, Check, ChevronLeft, ChevronRight, ChevronsUpDown, Minus } from 'lucide-react-native';
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

/* ─── Selection (opt-in: bulk actions) ─────────────────────────────── */

/** Width of the checkbox column. */
const CHECK_COL = 44;

/** shift held during a click (web) — selects a range of rows. */
function shiftOf(event: unknown): boolean {
  const native = (event as { nativeEvent?: { shiftKey?: boolean } } | undefined)?.nativeEvent;
  const shift = Boolean(native?.shiftKey);
  // Shift-click also extends the browser's text selection across the rows — drop that highlight.
  if (shift && Platform.OS === 'web' && typeof window !== 'undefined') window.getSelection?.()?.removeAllRanges();
  return shift;
}

/**
 * Square checkbox for row selection (header "select all" shows a dash when only some rows are picked).
 * Click / Enter / Space toggles; the click reports whether Shift was held.
 */
export function SelectBox({
  checked,
  onToggle,
  label,
  size = 20,
}: {
  checked: boolean | 'mixed';
  onToggle: (shiftKey: boolean) => void;
  label: string;
  size?: number;
}) {
  const [hover, setHover] = useState(false);
  const on = checked !== false;
  const keyHandler = {
    onKeyDown: (e: { nativeEvent?: { key?: string; shiftKey?: boolean }; preventDefault?: () => void }) => {
      if (e.nativeEvent?.key === ' ') {
        e.preventDefault?.();
        onToggle(Boolean(e.nativeEvent.shiftKey));
      }
    },
  };
  return (
    <Pressable
      onPress={(e) => {
        haptic('select');
        onToggle(shiftOf(e));
      }}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      hitSlop={8}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      style={[styles.checkHit, webPointer]}
      {...(Platform.OS === 'web' ? (keyHandler as object) : null)}
    >
      <View
        style={[
          styles.checkBox,
          { width: size, height: size, borderRadius: Math.round(size * 0.3) },
          on && styles.checkBoxOn,
          hover && !on && styles.checkBoxHover,
        ]}
      >
        {checked === 'mixed' ? (
          <Minus size={size - 6} color={colors.white} strokeWidth={3} />
        ) : checked ? (
          <Check size={size - 6} color={colors.white} strokeWidth={3} />
        ) : null}
      </View>
    </Pressable>
  );
}

/**
 * Selection state helpers for a page of rows: toggle one, Shift-click a range (from the last row clicked,
 * every row gets the clicked row's new state), select / clear the whole page. Ids from other pages stay.
 */
export function useRowSelection<T>(
  rows: T[],
  keyOf: (row: T) => string,
  selectedIds: readonly string[] | undefined,
  onChange: ((ids: string[]) => void) | undefined,
) {
  const anchor = useRef<string | null>(null);
  const selected = useMemo(() => new Set(selectedIds ?? []), [selectedIds]);
  const pageKeys = useMemo(() => rows.map(keyOf), [rows, keyOf]);
  const onPage = pageKeys.reduce((n, k) => (selected.has(k) ? n + 1 : n), 0);
  const allState: boolean | 'mixed' = pageKeys.length > 0 && onPage === pageKeys.length ? true : onPage > 0 ? 'mixed' : false;

  const toggleRow = useCallback(
    (row: T, index: number, shiftKey: boolean) => {
      if (!onChange) return;
      const key = keyOf(row);
      const next = new Set(selected);
      const turnOn = !selected.has(key);
      const from = anchor.current ? pageKeys.indexOf(anchor.current) : -1;
      if (shiftKey && from >= 0 && from !== index) {
        const [a, b] = from < index ? [from, index] : [index, from];
        for (let i = a; i <= b; i += 1) {
          const k = pageKeys[i];
          if (!k) continue;
          if (turnOn) next.add(k);
          else next.delete(k);
        }
      } else if (turnOn) {
        next.add(key);
      } else {
        next.delete(key);
      }
      anchor.current = key;
      onChange([...next]);
    },
    [keyOf, onChange, pageKeys, selected],
  );

  const toggleAll = useCallback(() => {
    if (!onChange) return;
    const next = new Set(selected);
    if (allState === true) pageKeys.forEach((k) => next.delete(k));
    else pageKeys.forEach((k) => next.add(k));
    anchor.current = null;
    onChange([...next]);
  }, [allState, onChange, pageKeys, selected]);

  return { selected, allState, toggleRow, toggleAll };
}

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
  selectAll,
}: {
  columns: AdminTableColumn<T>[];
  sort?: ListSort;
  onSortChange?: (sort: ListSort) => void;
  style?: StyleProp<ViewStyle>;
  /** Selectable tables: the checkbox that selects / clears every row on this page. */
  selectAll?: { checked: boolean | 'mixed'; onToggle: () => void; label?: string };
}) {
  return (
    <View style={[styles.head, style]} accessibilityRole="header">
      {selectAll ? (
        <View style={[styles.headCell, styles.checkCell]}>
          <SelectBox checked={selectAll.checked} onToggle={() => selectAll.onToggle()} label={selectAll.label ?? 'Select all rows on this page'} />
        </View>
      ) : null}
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
  selected,
  onToggleSelect,
}: {
  row: T;
  index: number;
  columns: AdminTableColumn<T>[];
  last: boolean;
  onPress?: (row: T) => void;
  rowLabel?: (row: T) => string;
  selected?: boolean;
  onToggleSelect?: (shiftKey: boolean) => void;
}) {
  const [hover, setHover] = useState(false);
  const label = rowLabel?.(row);
  return (
    <Pressable
      onPress={onPress ? () => onPress(row) : undefined}
      disabled={!onPress}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      style={[
        styles.row,
        last && styles.rowLast,
        hover && styles.rowHover,
        selected && styles.rowSelected,
        selected && hover && styles.rowSelectedHover,
        onPress ? webPointer : null,
      ]}
      accessibilityRole={onPress ? ROW_ROLE : undefined}
      accessibilityLabel={label}
    >
      {onToggleSelect ? (
        <View style={[styles.cell, styles.checkCell]}>
          <SelectBox
            checked={Boolean(selected)}
            onToggle={onToggleSelect}
            label={label ? `Select ${label.split('. ')[0]}` : `Select row ${index + 1}`}
          />
        </View>
      ) : null}
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
  selectedKeys,
  onToggleRow,
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
  /** Selectable tables: the selected row keys … */
  selectedKeys?: ReadonlySet<string>;
  /** … and the checkbox handler (adds the checkbox column when set). */
  onToggleRow?: (row: T, index: number, shiftKey: boolean) => void;
}) {
  let body: ReactNode;
  if (loading) {
    body = Array.from({ length: skeletonRows }, (_, i) => (
      <View key={`s${i}`} style={[styles.row, i === skeletonRows - 1 && styles.rowLast]} accessibilityElementsHidden>
        {onToggleRow ? (
          <View style={[styles.cell, styles.checkCell]}>
            <Skeleton width={18} height={18} radius={6} />
          </View>
        ) : null}
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
    body = rows.map((row, i) => {
      const key = keyExtractor(row);
      return (
        <TableRow
          key={key}
          row={row}
          index={i}
          columns={columns}
          last={i === rows.length - 1}
          onPress={onRowPress}
          rowLabel={rowLabel}
          selected={selectedKeys?.has(key)}
          onToggleSelect={onToggleRow ? (shiftKey) => onToggleRow(row, i, shiftKey) : undefined}
        />
      );
    });
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
  selectable,
  selectedIds,
  onSelectionChange,
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
  /** Opt-in row checkboxes (select all on the page, Shift-click ranges on the web). */
  selectable?: boolean;
  /** Selected row ids (keyExtractor values) — may include rows on other pages. */
  selectedIds?: readonly string[];
  onSelectionChange?: (ids: string[]) => void;
}) {
  const paged = page !== undefined && pageSize !== undefined && total !== undefined && onPageChange;
  const selecting = Boolean(selectable && onSelectionChange);
  const selection = useRowSelection(rows, keyExtractor, selectedIds, selecting ? onSelectionChange : undefined);
  return (
    <View style={styles.card}>
      <ScrollView style={maxHeight ? { maxHeight } : undefined} stickyHeaderIndices={[0]} nestedScrollEnabled>
        <AdminTableHead
          columns={columns}
          sort={sort}
          onSortChange={onSortChange}
          selectAll={selecting ? { checked: selection.allState, onToggle: selection.toggleAll } : undefined}
        />
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
          selectedKeys={selecting ? selection.selected : undefined}
          onToggleRow={selecting ? selection.toggleRow : undefined}
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
  rowSelected: { backgroundColor: '#EEF7F0' },
  rowSelectedHover: { backgroundColor: '#E6F3E9' },
  checkCell: { width: CHECK_COL, flexGrow: 0, flexShrink: 0, paddingHorizontal: 0, alignItems: 'center', justifyContent: 'center' },
  checkHit: { alignItems: 'center', justifyContent: 'center' },
  checkBox: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#C9D2CB',
    backgroundColor: colors.white,
  },
  checkBoxHover: { borderColor: colors.forest },
  checkBoxOn: { backgroundColor: colors.forest, borderColor: colors.forest },
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
