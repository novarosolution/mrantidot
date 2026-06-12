import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeHero } from '@/components/kit/HomeHero';
import { HomeQuickActions } from '@/components/kit/HomeQuickActions';
import { HomeServicesEmpty } from '@/components/kit/HomeServicesEmpty';
import { HomeServicesSection } from '@/components/kit/HomeServicesSection';
import { PopularServiceCard } from '@/components/kit/PopularServiceCard';
import { ServiceGrid } from '@/components/kit/ServiceGrid';
import { CustomerServiceTypeSection } from '@/components/kit/CustomerServiceTypeSection';
import { PromoBanner } from '@/components/ui/PromoBanner';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { api, checkHealth, getApiErrorMessage, safeAsync, screenLoadConfig } from '@/lib/api';
import { CACHE_TTL } from '@/lib/apiCache';
import { config } from '@/lib/config';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import type { HomeConfig, HomePromo, Service, ServiceStats } from '@/types/api';
import { PremiumSectionHeader } from '@/components/ui/PremiumSectionHeader';
import { colors, design, spacing } from '@/constants/theme';

const DEFAULT_HOME_CONFIG: HomeConfig = {
  sectionTitles: { services: 'Our Services', popular: 'Popular Now' },
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

export default function CustomerHome() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [services, setServices] = useState<Service[]>([]);
  const [homePromo, setHomePromo] = useState<HomePromo | null>(null);
  const [homeConfig, setHomeConfig] = useState<HomeConfig>(DEFAULT_HOME_CONFIG);
  const [popularStats, setPopularStats] = useState<ServiceStats | null>(null);
  const [unread, setUnread] = useState(0);
  const [q, setQ] = useState('');
  const debouncedQ = useDebouncedValue(q, 300);
  const [cat, setCat] = useState(DEFAULT_HOME_CONFIG.categoryChips[0]?.label ?? 'All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [metaLoaded, setMetaLoaded] = useState(false);

  const loadMeta = useCallback(async (skipCache = false) => {
    if (!user) return;
    const cache = skipCache ? { skipCache: true as const } : { cacheTtlMs: CACHE_TTL.content };
    const notifCache = skipCache ? { skipCache: true as const } : { cacheTtlMs: CACHE_TTL.notifications };
    const [promoRes, notifRes] = await Promise.allSettled([
      api.get<{ promo: HomePromo; homeConfig: HomeConfig }>('/content/home', {
        ...screenLoadConfig,
        ...cache,
      }),
      api.get<{ unreadCount: number }>('/notifications', {
        ...screenLoadConfig,
        ...notifCache,
      }),
    ]);

    if (promoRes.status === 'fulfilled') {
      setHomePromo(promoRes.value.data.promo);
      setHomeConfig(promoRes.value.data.homeConfig ?? DEFAULT_HOME_CONFIG);
    }
    if (notifRes.status === 'fulfilled') {
      setUnread(notifRes.value.data.unreadCount);
    } else {
      setUnread(0);
    }
    setMetaLoaded(true);
  }, [user]);

  const loadServices = useCallback(async (skipCache = false) => {
    if (!user) return;
    setLoadError(null);
    const params: Record<string, string> = { includeStats: '1' };
    if (debouncedQ) params.q = debouncedQ;
    const selectedChip = homeConfig.categoryChips.find((c) => c.label === cat);
    if (selectedChip?.category) params.category = selectedChip.category;

    const { data } = await api.get<{ services: Service[] }>('/services', {
      ...screenLoadConfig,
      params,
      cacheTtlMs: CACHE_TTL.services,
      ...(skipCache ? { skipCache: true } : {}),
    });
    const list = data.services;
    setServices(list);
    const featuredId = homeConfig.featuredServiceId;
    const featured = featuredId ? list.find((s) => s.id === featuredId) : undefined;
    setPopularStats((featured ?? list[0])?.stats ?? null);
  }, [debouncedQ, cat, homeConfig.categoryChips, homeConfig.featuredServiceId, user]);

  useEffect(() => {
    if (!user) return;
    void loadMeta();
  }, [loadMeta, user]);

  useEffect(() => {
    if (!user || !metaLoaded) return;
    setLoading(true);
    safeAsync(async () => {
      try {
        await loadServices();
      } catch (err) {
        let msg = getApiErrorMessage(err, 'Could not load services');
        if (axios.isAxiosError(err) && !err.response) {
          try {
            await checkHealth();
          } catch {
            msg = `Server unreachable. Check API at ${config.apiUrl}`;
          }
        }
        setLoadError(msg);
        setServices([]);
      } finally {
        setLoading(false);
      }
    });
  }, [loadServices, metaLoaded, user]);

  const popular =
    (homeConfig.featuredServiceId
      ? services.find((s) => s.id === homeConfig.featuredServiceId)
      : undefined) ?? services[0];

  const promoServiceId =
    homePromo?.serviceId && services.some((s) => s.id === homePromo.serviceId)
      ? homePromo.serviceId
      : popular?.id;

  async function onRefresh() {
    setRefreshing(true);
    try {
      await Promise.all([loadMeta(true), loadServices(true)]);
      setLoadError(null);
    } catch (err) {
      setLoadError(getApiErrorMessage(err, 'Could not refresh'));
    } finally {
      setRefreshing(false);
    }
  }

  async function retryLoad() {
    setLoading(true);
    try {
      await Promise.all([loadMeta(true), loadServices(true)]);
      setLoadError(null);
    } catch (err) {
      setLoadError(getApiErrorMessage(err, 'Could not load services'));
    } finally {
      setLoading(false);
    }
  }

  if (!user) return <Spinner fullScreen />;

  if (loadError && services.length === 0 && !loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <ListEmptyRetry message={loadError} onRetry={() => safeAsync(retryLoad)} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.green} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* —— Hero + search —— */}
        <HomeHero
          topInset={insets.top}
          searchPlaceholder={homeConfig.searchPlaceholder}
          query={q}
          onChangeQuery={setQ}
          onSubmitSearch={() => safeAsync(() => loadServices())}
          unread={unread}
        />

        <FadeSlideIn delay={60}>
          <PromoBanner
            promo={homePromo}
            onPress={() => {
              if (promoServiceId) router.push(`/service/${promoServiceId}`);
            }}
          />
        </FadeSlideIn>

        <FadeSlideIn delay={90}>
          <HomeQuickActions />
        </FadeSlideIn>

        {/* —— Pest types —— */}
        <FadeSlideIn delay={120}>
          <CustomerServiceTypeSection />
        </FadeSlideIn>

        {/* —— Services + category filter —— */}
        <FadeSlideIn delay={150} trigger={`${cat}-${debouncedQ}`}>
          <HomeServicesSection
            title={homeConfig.sectionTitles.services}
            actionLabel={homeConfig.servicesActionLabel}
            onAction={() => router.push('/(customer)/services')}
            chips={homeConfig.categoryChips}
            selectedCategory={cat}
            onSelectCategory={setCat}
          >
            {loading && services.length === 0 ? (
              <View style={styles.loadingBox}>
                <Spinner />
              </View>
            ) : services.length === 0 ? (
              <HomeServicesEmpty filtered={Boolean(debouncedQ) || cat !== 'All'} />
            ) : (
              <ServiceGrid services={services} onPressItem={(s) => router.push(`/service/${s.id}`)} />
            )}
          </HomeServicesSection>
        </FadeSlideIn>

        {/* —— Popular pick —— */}
        <FadeSlideIn delay={180}>
          <PremiumSectionHeader
            title={homeConfig.sectionTitles.popular}
            actionLabel={homeConfig.popularActionLabel}
            onAction={() => router.push('/(customer)/services')}
            compact
          />
          {loading && !popular ? (
            <View style={styles.loadingBox}>
              <Spinner />
            </View>
          ) : popular ? (
            <PopularServiceCard
              service={popular}
              bookingCount={popularStats?.bookingCount}
              onPress={() => router.push(`/service/${popular.id}`)}
            />
          ) : (
            <HomeServicesEmpty />
          )}
        </FadeSlideIn>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: design.screenBg },
  root: { flex: 1 },
  content: { paddingBottom: spacing.xxl + 16 },
  loadingBox: { paddingVertical: spacing.lg, alignItems: 'center' },
});
