import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { AdminEntrance, AdminListShell, adminListShellStyles, useListEntrance } from '@/components/kit/AdminListShell';
import { AdminFilterChips, AdminStatStrip } from '@/components/kit/AdminPageKit';
import { AdminListSkeleton } from '@/components/kit/AdminSkeletons';
import { StarRating } from '@/components/ui/StarRating';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { api, screenLoadConfig } from '@/lib/api';
import { CACHE_TTL } from '@/lib/apiCache';
import { ADMIN_LIST_PERF } from '@/lib/listConfig';
import { haptic } from '@/lib/motion';
import { useScreenLoad } from '@/lib/useScreenLoad';
import { useStaleFocusRefresh } from '@/lib/useStaleFocusRefresh';
import type { AdminReview } from '@/types/api';
import { colors, fonts, premium, spacing, ui } from '@/constants/theme';
import { adminRoutes, appPush } from '@/lib/routes';
import { notify } from '@/lib/confirm';

type ReviewFilter = 'all' | 'visible' | 'hidden';

export default function AdminReviewsScreen() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [filter, setFilter] = useState<ReviewFilter>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const { loading, error, refreshing, runLoad, reload, refresh } = useScreenLoad();
  const entrance = useListEntrance(!loading);

  const load = useCallback(async (skipCache = false) => {
    const { data } = await api.get<{ reviews: AdminReview[] }>('/admin/reviews', {
      ...screenLoadConfig,
      params: { limit: '80' },
      cacheTtlMs: CACHE_TTL.adminLists,
      ...(skipCache ? { skipCache: true as const } : {}),
    });
    setReviews(data.reviews);
  }, []);

  useEffect(() => {
    void runLoad(() => load(), 'Could not load reviews');
  }, [load, runLoad]);

  useStaleFocusRefresh(() => refresh(() => load(true)), 45_000);

  const visible = useMemo(() => {
    if (filter === 'visible') return reviews.filter((r) => !r.hidden);
    if (filter === 'hidden') return reviews.filter((r) => r.hidden);
    return reviews;
  }, [reviews, filter]);

  const hiddenCount = useMemo(() => reviews.filter((r) => r.hidden).length, [reviews]);
  const avgStars = useMemo(() => {
    if (reviews.length === 0) return '—';
    const sum = reviews.reduce((a, r) => a + r.stars, 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  const toggleHidden = useCallback(async (r: AdminReview) => {
    if (busyId) return;
    const next = !r.hidden;
    setBusyId(r.id);
    setReviews((prev) => prev.map((x) => (x.id === r.id ? { ...x, hidden: next } : x)));
    try {
      await api.patch(`/admin/reviews/${r.id}`, { hidden: next });
    } catch {
      setReviews((prev) => prev.map((x) => (x.id === r.id ? { ...x, hidden: r.hidden } : x)));
      haptic('error');
      notify('Error', 'Could not update review');
    } finally {
      setBusyId(null);
    }
  }, [busyId]);

  const header = useMemo(
    () => (
      <FadeSlideIn slideFrom={14}>
        <AdminStatStrip
          flush
          items={[
            { label: 'Total', value: reviews.length },
            { label: 'Avg rating', value: avgStars },
            { label: 'Hidden', value: hiddenCount, color: hiddenCount ? colors.error : colors.forest },
          ]}
        />
        <AdminFilterChips
          chips={[
            { key: 'all', label: 'All' },
            { key: 'visible', label: 'Visible' },
            { key: 'hidden', label: 'Hidden' },
          ]}
          selected={filter}
          onSelect={(key) => setFilter(key as ReviewFilter)}
        />
      </FadeSlideIn>
    ),
    [filter, reviews.length, avgStars, hiddenCount],
  );

  if (loading) {
    return (
      <AdminListShell title="Reviews" subtitle="Moderate feedback">
        <AdminListSkeleton variant="review" strip stripCells={3} chips rows={4} />
      </AdminListShell>
    );
  }

  if (error) {
    return (
      <AdminListShell title="Reviews" subtitle="Could not load">
        <ListEmptyRetry message={error} onRetry={() => void reload(load, error)} />
      </AdminListShell>
    );
  }

  return (
    <AdminListShell title="Reviews" subtitle={`${reviews.length} ratings · moderate feedback`}>
      <FlatList
        data={visible}
        keyExtractor={(r) => r.id}
        {...ADMIN_LIST_PERF}
        ListHeaderComponent={header}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void refresh(load)} tintColor={colors.green} />
        }
        contentContainerStyle={visible.length === 0 ? adminListShellStyles.empty : adminListShellStyles.list}
        ListEmptyComponent={<EmptyState title="No reviews" message="Reviews appear after completed bookings" />}
        renderItem={({ item, index }) => (
          <AdminEntrance index={index + 1} play={entrance(index)}>
            <View style={styles.card}>
              <View style={styles.row}>
                <StarRating rating={item.stars} size={15} showValue />
                {item.hidden ? <StatusBadge label="Hidden" tone="danger" /> : null}
              </View>
              <Text style={styles.meta} numberOfLines={1}>
                {item.customerName} · {item.serviceName}
              </Text>
              {item.comment ? (
                <Text style={styles.comment} numberOfLines={3}>
                  {item.comment}
                </Text>
              ) : null}
              <View style={styles.actions}>
                <Pressable
                  onPress={() => appPush(adminRoutes.booking(item.bookingId))}
                  accessibilityRole="button"
                  accessibilityLabel="Open booking"
                  hitSlop={8}
                  style={({ pressed }) => [styles.linkBtn, pressed && styles.linkPressed]}
                >
                  <Text style={styles.link}>Booking</Text>
                </Pressable>
                <Pressable
                  onPress={() => void toggleHidden(item)}
                  disabled={busyId === item.id}
                  accessibilityRole="button"
                  accessibilityLabel={item.hidden ? 'Show review' : 'Hide review'}
                  hitSlop={8}
                  style={({ pressed }) => [styles.linkBtn, pressed && styles.linkPressed]}
                >
                  <Text style={[styles.link, busyId === item.id && styles.linkBusy]}>
                    {busyId === item.id ? '…' : item.hidden ? 'Show' : 'Hide'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </AdminEntrance>
        )}
      />
    </AdminListShell>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: premium.radiusCard,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    ...ui.shadow,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  meta: { fontFamily: fonts.body, fontSize: 12, color: ui.textSecondary, marginTop: 6 },
  comment: { fontFamily: fonts.body, fontSize: 13, color: ui.text, marginTop: 8, lineHeight: 18 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  /** Small outlined pills — a clearer tap target than bare text links. */
  linkBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: colors.white,
  },
  linkPressed: { backgroundColor: ui.surfaceMuted },
  link: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.forest },
  linkBusy: { opacity: 0.5 },
});
