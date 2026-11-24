import { type ReactElement, type ReactNode, useCallback, useRef } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { formatIndianNumber } from '@/components/charts/chartFormat';
import { AdminEntrance, adminListShellStyles, useListEntrance } from '@/components/kit/AdminListShell';
import { AdminRowSkeleton, type AdminRowVariant } from '@/components/kit/AdminSkeletons';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { colors, fonts, spacing, ui } from '@/constants/theme';
import { ADMIN_LIST_PERF } from '@/lib/listConfig';
import { haptic } from '@/lib/motion';
import { useWebWideContent, useWideWebLayout } from '@/lib/webAdmin';
import type { ListSort } from '@/types/adminLists';
import {
  AdminTableFooter,
  AdminTableHead,
  AdminTableRows,
  adminTableStyles,
  useRowSelection,
  type AdminTableColumn,
} from './AdminDataTable';
import { usePagedList, type PagedFetcher, type PagedList } from './usePagedList';

/**
 * The one list pattern for admin screens:
 *   - desktop web (≥ 1024 px): `AdminDataTable` — sortable sticky header, hover rows, 25 / 50 / 100 pager;
 *   - phones: the screen's cards with infinite scroll, "x of y", pull to refresh.
 * Build the data with `useAdminPagedList` (it picks pages vs infinite from the layout).
 */

export function useAdminPagedList<T, X = undefined>(args: {
  fetchPage: PagedFetcher<T, X>;
  deps: readonly unknown[];
  keyOf: (item: T) => string;
  initialPageSize?: number;
  errorMessage?: string;
}): PagedList<T, X> {
  const wide = useWideWebLayout();
  return usePagedList<T, X>({ ...args, mode: wide ? 'pages' : 'infinite' });
}

/**
 * Phones, `selectable` lists: passed to `renderCard` as its third argument. Wire `onLongPress` to the card
 * (long-press starts selecting); while `active`, taps on the card toggle it instead of opening it.
 */
export type CardSelection = {
  active: boolean;
  selected: boolean;
  toggle: () => void;
  onLongPress: () => void;
};

/** Check circle beside a card while selecting; a tap anywhere on the card toggles it. */
function SelectableCard({ selection, label, children }: { selection: CardSelection; label: string; children: ReactNode }) {
  return (
    <View style={styles.selRow}>
      {selection.active ? (
        <View style={styles.selGutter} pointerEvents="none">
          <View style={[styles.selCircle, selection.selected && styles.selCircleOn]}>
            {selection.selected ? <Check size={14} color={colors.white} strokeWidth={3} /> : null}
          </View>
        </View>
      ) : null}
      <View style={styles.selBody}>
        {children}
        {selection.active ? (
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={selection.toggle}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selection.selected }}
            accessibilityLabel={label}
          />
        ) : null}
      </View>
    </View>
  );
}

export function AdminPagedList<T, X>({
  list,
  columns,
  renderCard,
  keyExtractor,
  header,
  onRowPress,
  rowLabel,
  sort,
  onSortChange,
  noun,
  emptyTitle,
  emptyMessage,
  emptyActionLabel,
  onEmptyAction,
  skeletonVariant = 'person',
  bottomPad,
  footer,
  selectable,
  selectedIds,
  onSelectionChange,
}: {
  list: PagedList<T, X>;
  columns: AdminTableColumn<T>[];
  /** `selection` is only passed when the list is `selectable` (phones). */
  renderCard: (item: T, index: number, selection?: CardSelection) => ReactElement;
  keyExtractor: (item: T) => string;
  /** Filters / search / summary above the rows (both layouts). */
  header?: ReactNode;
  onRowPress?: (item: T) => void;
  rowLabel?: (item: T) => string;
  sort?: ListSort;
  onSortChange?: (sort: ListSort) => void;
  /** Plural noun for counts: "bookings". */
  noun: string;
  emptyTitle: string;
  emptyMessage?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  skeletonVariant?: AdminRowVariant;
  /** Phone list bottom padding (e.g. room for the tab bar). */
  bottomPad?: number;
  /** Extra content after the rows. */
  footer?: ReactNode;
  /**
   * Opt-in selection for bulk actions: a checkbox column on the desktop table (select all on the page,
   * Shift-click ranges), long-press to start selecting on phones. Existing lists leave these out.
   */
  selectable?: boolean;
  /** Selected ids (keyExtractor values); may include rows that are not loaded / on another page. */
  selectedIds?: readonly string[];
  onSelectionChange?: (ids: string[]) => void;
}) {
  const wide = useWideWebLayout();
  useWebWideContent(wide);
  const scrollRef = useRef<ScrollView>(null);
  const entrance = useListEntrance(!list.loading);
  const selecting = Boolean(selectable && onSelectionChange);
  const selection = useRowSelection(list.items, keyExtractor, selectedIds, selecting ? onSelectionChange : undefined);
  const selectedSet = selection.selected;

  const cardSelection = useCallback(
    (key: string): CardSelection => {
      const isSelected = selectedSet.has(key);
      const toggle = () => {
        haptic('select');
        const next = new Set(selectedSet);
        if (isSelected) next.delete(key);
        else next.add(key);
        onSelectionChange?.([...next]);
      };
      return {
        active: selectedSet.size > 0,
        selected: isSelected,
        toggle,
        onLongPress: () => {
          if (isSelected) return;
          haptic('select');
          onSelectionChange?.([...selectedSet, key]);
        },
      };
    },
    [onSelectionChange, selectedSet],
  );

  if (wide) {
    const goTo = (page: number) => {
      list.setPage(page);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    };
    return (
      <ScrollView
        ref={scrollRef}
        style={styles.flex}
        contentContainerStyle={styles.deskContent}
        stickyHeaderIndices={[header ? 1 : 0]}
        keyboardShouldPersistTaps="handled"
      >
        {header ? <View style={styles.deskHeader}>{header}</View> : null}
        <AdminTableHead
          columns={columns}
          sort={sort}
          onSortChange={onSortChange}
          style={adminTableStyles.headCard}
          selectAll={
            selecting ? { checked: selection.allState, onToggle: selection.toggleAll, label: `Select all ${noun} on this page` } : undefined
          }
        />
        <AdminTableRows
          columns={columns}
          rows={list.items}
          keyExtractor={keyExtractor}
          onRowPress={onRowPress}
          rowLabel={rowLabel}
          loading={list.loading}
          skeletonRows={Math.min(list.pageSize, 10)}
          error={list.error}
          onRetry={list.retry}
          emptyTitle={emptyTitle}
          emptyMessage={emptyMessage}
          emptyActionLabel={emptyActionLabel}
          onEmptyAction={onEmptyAction}
          style={adminTableStyles.bodyCard}
          selectedKeys={selecting ? selectedSet : undefined}
          onToggleRow={selecting ? selection.toggleRow : undefined}
        />
        <AdminTableFooter
          page={list.page}
          pageSize={list.pageSize}
          total={list.total}
          onPageChange={goTo}
          onPageSizeChange={list.setPageSize}
          noun={noun}
          style={adminTableStyles.footerCard}
        />
        {footer}
      </ScrollView>
    );
  }

  const rows = list.loading ? [] : list.items;
  const showCount = !list.loading && list.total > 0;

  return (
    <FlatList
      data={rows}
      keyExtractor={keyExtractor}
      {...ADMIN_LIST_PERF}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View>
          {header}
          {showCount ? (
            <Text style={styles.count} accessibilityRole="text">
              Showing {formatIndianNumber(list.items.length)} of {formatIndianNumber(list.total)} {noun}
            </Text>
          ) : null}
          {list.error && list.items.length > 0 ? (
            <Pressable onPress={list.retry} style={styles.errorBar} accessibilityRole="button">
              <Text style={styles.errorText} numberOfLines={2}>
                {list.error} · Tap to retry
              </Text>
            </Pressable>
          ) : null}
        </View>
      }
      renderItem={({ item, index }) => {
        if (!selecting) {
          return (
            <AdminEntrance index={index + 1} play={entrance(index)}>
              {renderCard(item, index)}
            </AdminEntrance>
          );
        }
        const key = keyExtractor(item);
        const sel = cardSelection(key);
        const label = rowLabel?.(item) ?? key;
        return (
          <AdminEntrance index={index + 1} play={entrance(index)}>
            <SelectableCard selection={sel} label={sel.selected ? `Deselect ${label}` : `Select ${label}`}>
              {renderCard(item, index, sel)}
            </SelectableCard>
          </AdminEntrance>
        );
      }}
      extraData={selecting ? selectedSet : undefined}
      ListEmptyComponent={
        list.loading ? (
          <View style={styles.skeletons} accessibilityRole="progressbar" accessibilityLabel="Loading">
            {Array.from({ length: 5 }, (_, i) => (
              <AdminRowSkeleton key={i} variant={skeletonVariant} />
            ))}
          </View>
        ) : list.error ? (
          <ListEmptyRetry message={list.error} onRetry={list.retry} />
        ) : (
          <EmptyState title={emptyTitle} message={emptyMessage} actionLabel={emptyActionLabel} onAction={onEmptyAction} />
        )
      }
      ListFooterComponent={
        <View>
          {list.loadingMore ? (
            <View style={styles.more}>
              <Spinner />
            </View>
          ) : !list.loading && !list.hasMore && list.items.length > 0 && list.total > list.pageSize ? (
            <Text style={styles.end}>All {formatIndianNumber(list.total)} {noun} shown</Text>
          ) : null}
          {footer}
        </View>
      }
      onEndReached={list.loadMore}
      onEndReachedThreshold={0.5}
      refreshControl={
        <RefreshControl refreshing={list.refreshing} onRefresh={() => void list.refresh()} tintColor={colors.green} />
      }
      contentContainerStyle={[
        rows.length === 0 ? adminListShellStyles.empty : adminListShellStyles.list,
        bottomPad !== undefined ? { paddingBottom: bottomPad } : null,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  deskContent: { paddingBottom: spacing.xl },
  deskHeader: { paddingHorizontal: spacing.md, paddingTop: spacing.md, backgroundColor: ui.surfaceMuted },
  count: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: ui.textSecondary, marginBottom: spacing.xs },
  errorBar: {
    marginBottom: spacing.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.errorBg,
  },
  errorText: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: colors.error },
  skeletons: { gap: spacing.sm },
  more: { paddingVertical: spacing.md, alignItems: 'center' },
  end: { fontFamily: fonts.body, fontSize: 12, color: ui.textTertiary, textAlign: 'center', paddingVertical: spacing.md },
  selRow: { flexDirection: 'row', alignItems: 'stretch' },
  selGutter: { width: 36, alignItems: 'flex-start', justifyContent: 'center', paddingBottom: spacing.sm },
  selBody: { flex: 1, minWidth: 0 },
  selCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#C9D2CB',
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selCircleOn: { backgroundColor: colors.forest, borderColor: colors.forest },
});
