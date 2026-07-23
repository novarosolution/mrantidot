import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { AdminListShell, adminListShellStyles } from '@/components/kit/AdminListShell';
import { AdminAddButton } from '@/components/kit/AdminAddButton';
import { AdminFilterChips, AdminStatStrip } from '@/components/kit/AdminPageKit';
import { AdminOfferCard } from '@/components/kit/AdminOfferCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { api, screenLoadConfig } from '@/lib/api';
import { CACHE_TTL } from '@/lib/apiCache';
import { ADMIN_LIST_PERF } from '@/lib/listConfig';
import { useScreenLoad } from '@/lib/useScreenLoad';
import { useStaleFocusRefresh } from '@/lib/useStaleFocusRefresh';
import type { Offer } from '@/types/api';
import { colors, spacing } from '@/constants/theme';
import { adminRoutes, appPush } from '@/lib/routes';

type OfferFilter = 'all' | 'active' | 'inactive' | 'expired';

export default function AdminOffersScreen() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [listFilter, setListFilter] = useState<OfferFilter>('all');
  const { loading, error, refreshing, runLoad, reload, refresh } = useScreenLoad();

  const load = useCallback(async (skipCache = false) => {
    const { data } = await api.get<{ offers: Offer[] }>('/admin/offers', {
      ...screenLoadConfig,
      cacheTtlMs: CACHE_TTL.offers,
      ...(skipCache ? { skipCache: true as const } : {}),
    });
    setOffers(data.offers);
  }, []);

  useEffect(() => {
    void runLoad(() => load(), 'Could not load offers');
  }, [load, runLoad]);

  useStaleFocusRefresh(() => refresh(() => load(true)), 45_000);

  const now = useMemo(() => Date.now(), [offers]);

  const counts = useMemo(() => {
    let active = 0;
    let inactive = 0;
    let expired = 0;
    for (const o of offers) {
      const isExpired = o.expiresAt ? new Date(o.expiresAt).getTime() < now : false;
      if (isExpired) expired += 1;
      if (o.active) active += 1;
      else inactive += 1;
    }
    return { total: offers.length, active, inactive, expired };
  }, [offers, now]);

  const visibleOffers = useMemo(() => {
    if (listFilter === 'active') return offers.filter((o) => o.active);
    if (listFilter === 'inactive') return offers.filter((o) => !o.active);
    if (listFilter === 'expired') {
      return offers.filter((o) => (o.expiresAt ? new Date(o.expiresAt).getTime() < now : false));
    }
    return offers;
  }, [offers, listFilter, now]);

  const toggleActive = useCallback(async (o: Offer) => {
    const next = !o.active;
    setOffers((prev) => prev.map((x) => (x.id === o.id ? { ...x, active: next } : x)));
    try {
      await api.patch(`/admin/offers/${o.id}`, { active: next });
    } catch {
      setOffers((prev) => prev.map((x) => (x.id === o.id ? { ...x, active: o.active } : x)));
      Alert.alert('Error', 'Could not update offer');
    }
  }, []);

  const header = useMemo(
    () => (
      <View style={styles.headerBlock}>
        <AdminStatStrip
          flush
          items={[
            { label: 'Total', value: counts.total },
            { label: 'Active', value: counts.active, color: colors.forest },
            { label: 'Inactive', value: counts.inactive, color: colors.muted },
            { label: 'Expired', value: counts.expired, color: '#9E3F1C' },
          ]}
        />
        <View style={styles.chipsWrap}>
          <AdminFilterChips
            chips={[
              { key: 'all', label: `All (${counts.total})` },
              { key: 'active', label: `Active (${counts.active})` },
              { key: 'inactive', label: `Off (${counts.inactive})` },
              { key: 'expired', label: `Expired (${counts.expired})` },
            ]}
            selected={listFilter}
            onSelect={(key) => setListFilter(key as OfferFilter)}
          />
        </View>
      </View>
    ),
    [counts, listFilter],
  );

  if (loading) return <Spinner fullScreen />;

  if (error) {
    return (
      <AdminListShell title="Offers" subtitle="Could not load">
        <ListEmptyRetry message={error} onRetry={() => void reload(load, error)} />
      </AdminListShell>
    );
  }

  const addBtn = <AdminAddButton onPress={() => appPush(adminRoutes.offerEdit)} />;

  return (
    <AdminListShell
      title="Offers & coupons"
      subtitle={`${counts.active} live · manage checkout promos`}
      rightAction={addBtn}
    >
      <FlatList
        data={visibleOffers}
        keyExtractor={(o) => o.id}
        {...ADMIN_LIST_PERF}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={header}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void refresh(load)} tintColor={colors.green} />
        }
        contentContainerStyle={visibleOffers.length === 0 ? adminListShellStyles.empty : adminListShellStyles.list}
        ListEmptyComponent={
          <EmptyState
            title={listFilter === 'all' ? 'No offers yet' : `No ${listFilter} offers`}
            message={
              listFilter === 'all'
                ? 'Create a coupon customers can apply at checkout'
                : 'Try another filter or create a new offer'
            }
          />
        }
        renderItem={({ item }) => (
          <AdminOfferCard
            offer={item}
            onPress={() => appPush({ pathname: adminRoutes.offerEdit, params: { id: item.id } })}
            onEdit={() => appPush({ pathname: adminRoutes.offerEdit, params: { id: item.id } })}
            onToggle={() => void toggleActive(item)}
          />
        )}
      />
    </AdminListShell>
  );
}

const styles = StyleSheet.create({
  headerBlock: {
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  chipsWrap: {
    marginHorizontal: -spacing.md,
  },
});
