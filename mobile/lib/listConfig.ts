/** Shared FlatList tuning for admin lists */
export const ADMIN_LIST_PERF = {
  initialNumToRender: 10,
  maxToRenderPerBatch: 8,
  windowSize: 7,
  removeClippedSubviews: true,
} as const;

export const CUSTOMER_LIST_PERF = {
  initialNumToRender: 8,
  maxToRenderPerBatch: 6,
  windowSize: 6,
  removeClippedSubviews: true,
} as const;
