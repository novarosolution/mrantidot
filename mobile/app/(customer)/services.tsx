import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { CustomerListShell, listShellStyles } from '@/components/kit/CustomerListShell';
import { PopularServiceCard } from '@/components/kit/PopularServiceCard';
import { ServiceCatalogCard } from '@/components/kit/ServiceCatalogCard';
import {
  ServicesFilterPanel,
  ServicesSortBar,
  ServicesStatsStrip,
} from '@/components/kit/ServicesPageKit';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { useAppContent } from '@/context/AppContentContext';
import { api, getApiErrorMessage, safeAsync, screenLoadConfig } from '@/lib/api';
import { CACHE_TTL } from '@/lib/apiCache';
import { CUSTOMER_LIST_PERF } from '@/lib/listConfig';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { serviceDisplayRating } from '@/lib/ratings';
import { SERVICE_TYPE_KEYS, type ServiceTypeKey } from '@/constants/serviceTypes';
import type { HomeConfig, Service, ServiceCategory, ServiceStats } from '@/types/api';
import { colors, spacing } from '@/constants/theme';

const DEFAULT_HOME_CONFIG: HomeConfig = {
  sectionTitles: { services: 'Our Services', popular: 'Popular Now' },
  servicesSubtitle: 'Trusted pest control & home services',
  searchPlaceholder: 'Search services…',
  servicesActionLabel: 'View all',
  popularActionLabel: 'See more',
  categoryChips: [
    { label: 'All' },
    { label: 'Residential', category: 'residential' },
    { label: 'Commercial', category: 'commercial' },
    { label: 'Cleaning', category: 'cleaning' },
  ],
};

type SortKey = 'popular' | 'rating' | 'price';

function serviceRating(service: Service): number {
  return serviceDisplayRating(service);
}

export default function ServicesListScreen() {
  const { content } = useAppContent();
  const [services, setServices] = useState<Service[]>([]);
  const [statsMap, setStatsMap] = useState<Record<string, ServiceStats>>({});
  const [homeConfig, setHomeConfig] = useState<HomeConfig>(DEFAULT_HOME_CONFIG);
  const [q, setQ] = useState('');
  const debouncedQ = useDebouncedValue(q, 300);
  const [categoryLabel, setCategoryLabel] = useState(DEFAULT_HOME_CONFIG.categoryChips[0]?.label ?? 'All');
  const [serviceType, setServiceType] = useState<'all' | ServiceTypeKey>('all');
  const [sort, setSort] = useState<SortKey>('popular');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    const [svcRes, homeRes] = await Promise.allSettled([
      api.get<{ services: Service[] }>('/services', {
        ...screenLoadConfig,
        params: { includeStats: '1', ...(debouncedQ ? { q: debouncedQ } : {}) },
        cacheTtlMs: CACHE_TTL.services,
      }),
      api.get<{ homeConfig: HomeConfig }>('/content/home', {
        ...screenLoadConfig,
        cacheTtlMs: CACHE_TTL.content,
      }),
    ]);

    if (svcRes.status === 'rejected') throw svcRes.reason;
    setServices(svcRes.value.data.services);
    const map: Record<string, ServiceStats> = {};
    for (const s of svcRes.value.data.services) {
      if (s.stats) map[s.id] = s.stats;
    }
    setStatsMap(map);

    if (homeRes.status === 'fulfilled' && homeRes.value.data.homeConfig) {
      setHomeConfig(homeRes.value.data.homeConfig);
    }
  }, [debouncedQ]);

  useEffect(() => {
    setLoading(true);
    safeAsync(async () => {
      try {
        await load();
      } catch (err) {
        setLoadError(getApiErrorMessage(err, 'Could not load services'));
        setServices([]);
      } finally {
        setLoading(false);
      }
    });
  }, [load]);

  const selectedChip = useMemo(
    () => homeConfig.categoryChips.find((c) => c.label === categoryLabel),
    [homeConfig.categoryChips, categoryLabel],
  );

  const availableTypes = useMemo(() => {
    const present = new Set<ServiceTypeKey>();
    for (const s of services) {
      for (const t of s.serviceTypes ?? []) present.add(t);
    }
    return SERVICE_TYPE_KEYS.filter((k) => present.has(k));
  }, [services]);

  const visibleServices = useMemo(() => {
    let filtered = services;
    if (selectedChip?.category) {
      filtered = filtered.filter((s) => s.category === selectedChip.category);
    }
    if (serviceType !== 'all') {
      filtered = filtered.filter((s) => s.serviceTypes?.includes(serviceType));
    }
    return [...filtered].sort((a, b) => {
      if (sort === 'price') return a.basePrice - b.basePrice;
      if (sort === 'rating') return serviceRating(b) - serviceRating(a);
      return (statsMap[b.id]?.bookingCount ?? 0) - (statsMap[a.id]?.bookingCount ?? 0);
    });
  }, [services, selectedChip, serviceType, sort, statsMap]);

  const featured = useMemo(() => {
    const id = homeConfig.featuredServiceId;
    if (id) return services.find((s) => s.id === id) ?? services[0];
    return services[0];
  }, [services, homeConfig.featuredServiceId]);

  const categoryCount = useMemo(() => {
    const set = new Set(services.map((s) => s.category).filter(Boolean) as ServiceCategory[]);
    return set.size;
  }, [services]);

  const topRatedCount = useMemo(
    () => services.filter((s) => serviceRating(s) >= 4.5).length,
    [services],
  );

  const hasFilters = debouncedQ.length > 0 || categoryLabel !== 'All' || serviceType !== 'all';

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } catch (err) {
      setLoadError(getApiErrorMessage(err, 'Could not refresh services'));
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  function resetFilters() {
    setQ('');
    setCategoryLabel(homeConfig.categoryChips[0]?.label ?? 'All');
    setServiceType('all');
    setSort('popular');
  }

  const filterPanel = (
    <ServicesFilterPanel
      search={q}
      onSearchChange={setQ}
      searchPlaceholder={homeConfig.searchPlaceholder}
      onSearchSubmit={() => safeAsync(load)}
      categoryChips={homeConfig.categoryChips}
      categorySelected={categoryLabel}
      onCategorySelect={setCategoryLabel}
      pestTypes={availableTypes}
      pestSelected={serviceType}
      onPestSelect={setServiceType}
      trustBadges={content.trust.badges}
    />
  );

  const listHeader = (
    <View style={styles.listHeader}>
      {filterPanel}
      {!hasFilters && featured ? (
        <View style={styles.featuredWrap}>
          <PopularServiceCard
            service={featured}
            bookingCount={statsMap[featured.id]?.bookingCount}
            onPress={() => router.push(`/service/${featured.id}`)}
          />
        </View>
      ) : null}
      <ServicesStatsStrip
        total={visibleServices.length}
        topRated={topRatedCount}
        categories={categoryCount}
      />
      <ServicesSortBar
        sort={sort}
        onSort={setSort}
        countLabel={`${visibleServices.length} ${visibleServices.length === 1 ? 'service' : 'services'}`}
      />
    </View>
  );

  const pageSubtitle =
    homeConfig.servicesSubtitle?.trim() || content.branding.tagline || 'Trusted pest control & home services';

  return (
    <CustomerListShell
      title={homeConfig.sectionTitles.services}
      subtitle={pageSubtitle}
      showBack={false}
      heroOverlap
    >
      {loading && services.length === 0 ? (
        <View style={listShellStyles.list}>
          {filterPanel}
          <Spinner />
        </View>
      ) : loadError && services.length === 0 ? (
        <View style={listShellStyles.list}>
          {filterPanel}
          <ListEmptyRetry message={loadError} onRetry={() => safeAsync(load)} />
        </View>
      ) : (
        <FlatList
          data={visibleServices}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.column}
          {...CUSTOMER_LIST_PERF}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.green} />
          }
          ListHeaderComponent={listHeader}
          contentContainerStyle={visibleServices.length === 0 ? listShellStyles.empty : listShellStyles.list}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <EmptyState
                title={hasFilters ? 'No matches found' : 'No services'}
                message={hasFilters ? 'Try a different search or filter.' : 'Check back soon.'}
              />
              {hasFilters ? (
                <Button title="Reset filters" variant="secondary" onPress={resetFilters} style={styles.resetBtn} />
              ) : null}
            </View>
          }
          renderItem={({ item }) => (
            <ServiceCatalogCard
              service={item}
              onPress={() => router.push(`/service/${item.id}`)}
              onBook={() => router.push(`/book/${item.id}`)}
            />
          )}
        />
      )}
    </CustomerListShell>
  );
}

const styles = StyleSheet.create({
  listHeader: { marginBottom: spacing.sm },
  featuredWrap: { marginHorizontal: -spacing.md, marginBottom: spacing.sm },
  column: {
    justifyContent: 'space-between',
    gap: 10,
  },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  resetBtn: { paddingHorizontal: spacing.lg },
});
