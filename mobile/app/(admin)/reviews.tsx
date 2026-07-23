import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { AdminListShell, adminListShellStyles } from '@/components/kit/AdminListShell';
import { AdminFilterChips, AdminStatStrip } from '@/components/kit/AdminPageKit';
import { StarRating } from '@/components/ui/StarRating';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { api, screenLoadConfig } from '@/lib/api';
import { CACHE_TTL } from '@/lib/apiCache';
import { ADMIN_LIST_PERF } from '@/lib/listConfig';
import { useScreenLoad } from '@/lib/useScreenLoad';
import { useStaleFocusRefresh } from '@/lib/useStaleFocusRefresh';
import type { AdminReview } from '@/types/api';
import { colors, fonts, premium, shadows, spacing } from '@/constants/theme';
import { adminRoutes, appPush } from '@/lib/routes';

type ReviewFilter = 'all' | 'visible' | 'hidden';

export default function AdminReviewsScreen() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [filter, setFilter] = useState<ReviewFilter>('all');
  const { loading, error, refreshing, runLoad, reload, refresh } = useScreenLoad();

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
    const next = !r.hidden;
    setReviews((prev) => prev.map((x) => (x.id === r.id ? { ...x, hidden: next } : x)));
    try {
      await api.patch(`/admin/reviews/${r.id}`, { hidden: next });
    } catch {
      setReviews((prev) => prev.map((x) => (x.id === r.id ? { ...x, hidden: r.hidden } : x)));
      Alert.alert('Error', 'Could not update review');
    }
  }, []);

  const header = useMemo(
    () => (
      <View>
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
      </View>
    ),
    [filter, reviews.length, avgStars, hiddenCount],
  );

  if (loading) return <Spinner fullScreen />;

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
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <StarRating rating={item.stars} size={15} showValue />
              {item.hidden ? <StatusBadge label="Hidden" tone="danger" /> : null}
            </View>
            <Text style={styles.meta}>
              {item.customerName} · {item.serviceName}
            </Text>
            {item.comment ? (
              <Text style={styles.comment} numberOfLines={3}>
                {item.comment}
              </Text>
            ) : null}
            <View style={styles.actions}>
              <Pressable onPress={() => appPush(adminRoutes.booking(item.bookingId))}>
                <Text style={styles.link}>Booking</Text>
              </Pressable>
              <Pressable onPress={() => void toggleHidden(item)}>
                <Text style={styles.link}>{item.hidden ? 'Show' : 'Hide'}</Text>
              </Pressable>
            </View>
          </View>
        )}
      />
    </AdminListShell>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    paddingTop: spacing.md + 2,
    marginBottom: spacing.sm,
    borderRadius: premium.radiusCard,
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(226,240,216,0.95)',
    borderTopWidth: 3,
    borderTopColor: '#8FD03C',
    ...shadows.card,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  meta: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 6 },
  comment: { fontFamily: fonts.body, fontSize: 13, color: colors.ink, marginTop: 8, lineHeight: 18 },
  actions: { flexDirection: 'row', gap: 16, marginTop: 12 },
  link: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.forest },
});
