import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getApiErrorMessage } from '@/lib/api';
import type { PageMeta } from '@/types/adminLists';

export type PagedResult<T, X> = { items: T[]; meta: PageMeta; extra: X };

/** Loads one page. `skipCache` is true for pull-to-refresh / retry. */
export type PagedFetcher<T, X> = (page: number, limit: number, opts: { skipCache: boolean }) => Promise<PagedResult<T, X>>;

export type PagedListMode = 'pages' | 'infinite';

export type PagedList<T, X> = {
  items: T[];
  total: number;
  /** Page shown (pages mode) or last page loaded (infinite mode). */
  page: number;
  pageSize: number;
  hasMore: boolean;
  /** Whatever else the endpoint returns next to the rows (counts, summaries). */
  extra: X | undefined;
  /** No rows to show yet: first load, filter change or page change. */
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  error: string | null;
  mode: PagedListMode;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  loadMore: () => void;
  refresh: () => Promise<void>;
  retry: () => void;
  /** Patch rows in place after an action (hide review, approve leave…). */
  updateItems: (fn: (items: T[]) => T[]) => void;
};

/**
 * Server paging for admin lists. `pages` mode (desktop table) replaces the rows per page; `infinite` mode
 * (phones) appends the next page on scroll. Changing `deps` (filters, search, sort), the mode or the page
 * size starts again at page 1; responses that arrive after a newer request are ignored.
 */
export function usePagedList<T, X = undefined>({
  fetchPage,
  deps,
  mode,
  keyOf,
  initialPageSize = 25,
  errorMessage = 'Could not load this list',
}: {
  fetchPage: PagedFetcher<T, X>;
  /** Filters — any change reloads from page 1. */
  deps: readonly unknown[];
  mode: PagedListMode;
  keyOf: (item: T) => string;
  initialPageSize?: number;
  errorMessage?: string;
}): PagedList<T, X> {
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [data, setData] = useState<{ items: T[]; total: number; page: number; hasMore: boolean; extra: X | undefined }>({
    items: [],
    total: 0,
    page: 1,
    hasMore: false,
    extra: undefined,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRef = useRef(fetchPage);
  fetchRef.current = fetchPage;
  const keyRef = useRef(keyOf);
  keyRef.current = keyOf;
  const requestId = useRef(0);

  const resetKey = `${JSON.stringify(deps)}|${mode}|${pageSize}`;
  const [nav, setNav] = useState({ key: resetKey, page: 1 });
  // A filter / mode / size change means page 1 straight away (no extra fetch of the old page).
  const currentPage = nav.key === resetKey ? nav.page : 1;

  const load = useCallback(
    async (page: number, how: 'replace' | 'append' | 'refresh', skipCache: boolean) => {
      const id = ++requestId.current;
      if (how === 'append') setLoadingMore(true);
      else if (how === 'refresh') setRefreshing(true);
      else setLoading(true);
      if (how !== 'append') setError(null);
      try {
        const res = await fetchRef.current(page, pageSize, { skipCache });
        if (id !== requestId.current) return;
        setData((prev) => {
          let items = res.items;
          if (how === 'append') {
            const seen = new Set(prev.items.map((item) => keyRef.current(item)));
            items = [...prev.items, ...res.items.filter((item) => !seen.has(keyRef.current(item)))];
          }
          return { items, total: res.meta.total, page: res.meta.page, hasMore: res.meta.hasMore, extra: res.extra };
        });
      } catch (err) {
        if (id !== requestId.current) return;
        setError(getApiErrorMessage(err, errorMessage));
      } finally {
        if (id === requestId.current) {
          setLoading(false);
          setRefreshing(false);
          setLoadingMore(false);
        }
      }
    },
    [pageSize, errorMessage],
  );

  useEffect(() => {
    void load(mode === 'pages' ? currentPage : 1, 'replace', false);
    // `resetKey` carries the filters, mode and page size.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey, currentPage]);

  const setPage = useCallback((page: number) => setNav({ key: resetKey, page: Math.max(1, page) }), [resetKey]);
  const setPageSize = useCallback((size: number) => setPageSizeState(size), []);

  const loadMore = useCallback(() => {
    if (mode !== 'infinite' || !data.hasMore || loading || loadingMore || refreshing || error) return;
    void load(data.page + 1, 'append', false);
  }, [mode, data.hasMore, data.page, loading, loadingMore, refreshing, error, load]);

  const refresh = useCallback(
    () => load(mode === 'pages' ? currentPage : 1, 'refresh', true),
    [load, mode, currentPage],
  );

  const retry = useCallback(() => {
    if (error && data.items.length > 0 && mode === 'infinite') {
      setError(null);
      void load(data.page + 1, 'append', true);
      return;
    }
    void load(mode === 'pages' ? currentPage : 1, 'replace', true);
  }, [error, data.items.length, data.page, mode, currentPage, load]);

  const updateItems = useCallback((fn: (items: T[]) => T[]) => {
    setData((prev) => ({ ...prev, items: fn(prev.items) }));
  }, []);

  return useMemo(
    () => ({
      items: data.items,
      total: data.total,
      page: mode === 'pages' ? currentPage : data.page,
      pageSize,
      hasMore: data.hasMore,
      extra: data.extra,
      loading,
      refreshing,
      loadingMore,
      error,
      mode,
      setPage,
      setPageSize,
      loadMore,
      refresh,
      retry,
      updateItems,
    }),
    [data, mode, currentPage, pageSize, loading, refreshing, loadingMore, error, setPage, setPageSize, loadMore, refresh, retry, updateItems],
  );
}
