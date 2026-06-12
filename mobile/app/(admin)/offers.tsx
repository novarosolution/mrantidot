import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, RefreshControl, View } from 'react-native';
import { AdminListShell, adminListShellStyles } from '@/components/kit/AdminListShell';
import { AdminAddButton } from '@/components/kit/AdminAddButton';
import { AdminFilterChips } from '@/components/kit/AdminPageKit';
import { AdminOfferCard } from '@/components/kit/AdminOfferCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { api, screenLoadConfig } from '@/lib/api';
import { ADMIN_LIST_PERF } from '@/lib/listConfig';
import { useScreenLoad } from '@/lib/useScreenLoad';
import type { Offer } from '@/types/api';
import { colors } from '@/constants/theme';

type OfferFilter = 'all' | 'active' | 'inactive';

export default function AdminOffersScreen() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [listFilter, setListFilter] = useState<OfferFilter>('all');
  const { loading, error, refreshing, runLoad, reload, refresh } = useScreenLoad();

  const load = useCallback(async () => {
    const { data } = await api.get<{ offers: Offer[] }>('/admin/offers', screenLoadConfig);
    setOffers(data.offers);
  }, []);

  const focusedOnce = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!focusedOnce.current) {
        focusedOnce.current = true;
        void runLoad(load, 'Could not load offers');
        return;
      }
      void refresh(load);
    }, [load, runLoad, refresh]),
  );

  const visibleOffers = useMemo(() => {
    if (listFilter === 'active') return offers.filter((o) => o.active);
    if (listFilter === 'inactive') return offers.filter((o) => !o.active);
    return offers;
  }, [offers, listFilter]);

  const activeCount = useMemo(() => offers.filter((o) => o.active).length, [offers]);

  const toggleActive = useCallback(
    async (o: Offer) => {
      const next = !o.active;
      setOffers((prev) => prev.map((x) => (x.id === o.id ? { ...x, active: next } : x)));
      try {
        await api.patch(`/admin/offers/${o.id}`, { active: next });
      } catch {
        setOffers((prev) => prev.map((x) => (x.id === o.id ? { ...x, active: o.active } : x)));
        Alert.alert('Error', 'Could not update offer');
      }
    },
    [],
  );

  const header = useMemo(
    () => (
      <View>
        <AdminFilterChips
          chips={[
            { key: 'all', label: `All (${offers.length})` },
            { key: 'active', label: `Active (${activeCount})` },
            { key: 'inactive', label: `Inactive (${offers.length - activeCount})` },
          ]}
          selected={listFilter}
          onSelect={(key) => setListFilter(key as OfferFilter)}
        />
      </View>
    ),
    [offers.length, activeCount, listFilter],
  );

  if (loading) return <Spinner fullScreen />;

  if (error) {
    return (
      <AdminListShell title="Offers" subtitle="Error">
        <ListEmptyRetry message={error} onRetry={() => void reload(load, error)} />
      </AdminListShell>
    );
  }

  const addBtn = <AdminAddButton onPress={() => router.push('/(admin)/offer-edit')} />;

  return (
    <AdminListShell
      title="Offers & coupons"
      subtitle={`${activeCount} active`}
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
            message="Create a coupon for checkout"
          />
        }
        renderItem={({ item }) => (
          <AdminOfferCard
            offer={item}
            onPress={() => router.push({ pathname: '/(admin)/offer-edit', params: { id: item.id } })}
            onEdit={() => router.push({ pathname: '/(admin)/offer-edit', params: { id: item.id } })}
            onToggle={() => void toggleActive(item)}
          />
        )}
      />
    </AdminListShell>
  );
}
