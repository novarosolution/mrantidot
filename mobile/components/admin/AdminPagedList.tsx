import { type ReactElement, type ReactNode, useRef } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { formatIndianNumber } from '@/components/charts/chartFormat';
import { AdminEntrance, adminListShellStyles, useListEntrance } from '@/components/kit/AdminListShell';
import { AdminRowSkeleton, type AdminRowVariant } from '@/components/kit/AdminSkeletons';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { colors, fonts, spacing, ui } from '@/constants/theme';
import { ADMIN_LIST_PERF } from '@/lib/listConfig';
import { useWebWideContent, useWideWebLayout } from '@/lib/webAdmin';
import type { ListSort } from '@/types/adminLists';
import { AdminTableFooter, AdminTableHead, AdminTableRows, adminTableStyles, type AdminTableColumn } from './AdminDataTable';
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
}: {
  list: PagedList<T, X>;
  columns: AdminTableColumn<T>[];
  renderCard: (item: T, index: number) => ReactElement;
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
}) {
  const wide = useWideWebLayout();
  useWebWideContent(wide);
  const scrollRef = useRef<ScrollView>(null);
  const entrance = useListEntrance(!list.loading);

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
        <AdminTableHead columns={columns} sort={sort} onSortChange={onSortChange} style={adminTableStyles.headCard} />
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
      renderItem={({ item, index }) => (
        <AdminEntrance index={index + 1} play={entrance(index)}>
          {renderCard(item, index)}
        </AdminEntrance>
      )}
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
});
