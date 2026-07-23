/** Shared FlatList tuning for admin lists */
export const ADMIN_LIST_PERF = {
  initialNumToRender: 10,
  maxToRenderPerBatch: 8,
  windowSize: 7,
  removeClippedSubviews: true,
  updateCellsBatchingPeriod: 50,
} as const;

export const CUSTOMER_LIST_PERF = {
  initialNumToRender: 8,
  maxToRenderPerBatch: 6,
  windowSize: 6,
  removeClippedSubviews: true,
  updateCellsBatchingPeriod: 50,
} as const;

/** Fixed-height rows for FlatList getItemLayout (skip measurement). */
export function fixedRowLayout(rowHeight: number) {
  return (_data: ArrayLike<unknown> | null | undefined, index: number) => ({
    length: rowHeight,
    offset: rowHeight * index,
    index,
  });
}
