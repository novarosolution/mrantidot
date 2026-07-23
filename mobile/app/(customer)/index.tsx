import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeHero } from '@/components/kit/HomeHero';
import { HomePromoCarousel } from '@/components/kit/HomePromoCarousel';
import { GlassBackdrop, TAB_BAR_SCROLL_PAD, customerScrollProps } from '@/components/kit/GlassScreenKit';
import { HomeQuickActions } from '@/components/kit/HomeQuickActions';
import { HomeServicesEmpty } from '@/components/kit/HomeServicesEmpty';
import { HomeServicesSection } from '@/components/kit/HomeServicesSection';
import { PopularServicesCarousel } from '@/components/kit/PopularServicesCarousel';
import { HomeTrustStrip } from '@/components/kit/HomeTrustStrip';
import { ServiceGrid } from '@/components/kit/ServiceGrid';
import { CustomerServiceTypeSection } from '@/components/kit/CustomerServiceTypeSection';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/context/AuthContext';
import { useAppContent } from '@/context/AppContentContext';
import axios from 'axios';
import { api, checkHealth, getApiErrorMessage, safeAsync, screenLoadConfig } from '@/lib/api';
import { CACHE_TTL } from '@/lib/apiCache';
import { config } from '@/lib/config';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { afterInteractions } from '@/lib/useScreenLoad';
import { HOME_SECTION } from '@/constants/homeContent';
import type { Service } from '@/types/api';
import { colors, spacing, surfaces } from '@/constants/theme';
import { customerRoutes, sharedRoutes, appPush } from '@/lib/routes';

export default function CustomerHome() {
  const { user } = useAuth();
  const { content, homeConfig, homePromo, refreshHome } = useAppContent();
  const insets = useSafeAreaInsets();
  const [services, setServices] = useState<Service[]>([]);
  const [unread, setUnread] = useState(0);
  const [q, setQ] = useState('');
  const debouncedQ = useDebouncedValue(q, 300);
  const [cat, setCat] = useState(homeConfig.categoryChips[0]?.label ?? 'All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const brandName = content.branding.name?.trim() || 'Mr Antidot';

  useEffect(() => {
    setCat((prev) => {
      if (homeConfig.categoryChips.some((c) => c.label === prev)) return prev;
      return homeConfig.categoryChips[0]?.label ?? 'All';
    });
  }, [homeConfig.categoryChips]);

  const loadUnread = useCallback(async (skipCache = false) => {
    if (!user) return;
    try {
      const { data } = await api.get<{ unreadCount: number }>('/notifications', {
        ...screenLoadConfig,
        ...(skipCache ? { skipCache: true as const } : { cacheTtlMs: CACHE_TTL.notifications }),
      });
      setUnread(data.unreadCount);
    } catch {
      setUnread(0);
    }
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
    setServices(data.services);
  }, [debouncedQ, cat, homeConfig.categoryChips, user]);

  useEffect(() => {
    if (!user) return;
    void afterInteractions(() => loadUnread());
  }, [loadUnread, user]);

  useEffect(() => {
    if (!user) return;
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
  }, [loadServices, user]);

  const featured = useMemo(() => {
    if (homeConfig.featuredServiceId) {
      const hit = services.find((s) => s.id === homeConfig.featuredServiceId);
      if (hit) return hit;
    }
    return services[0];
  }, [homeConfig.featuredServiceId, services]);

  const popularList = useMemo(() => {
    const ranked = [...services].sort((a, b) => {
      const bookDiff = (b.stats?.bookingCount ?? 0) - (a.stats?.bookingCount ?? 0);
      if (bookDiff !== 0) return bookDiff;
      return (b.rating ?? 0) - (a.rating ?? 0);
    });
    if (featured) {
      return [featured, ...ranked.filter((s) => s.id !== featured.id)].slice(0, 6);
    }
    return ranked.slice(0, 6);
  }, [featured, services]);

  const promoServiceId =
    homePromo?.serviceId && services.some((s) => s.id === homePromo.serviceId)
      ? homePromo.serviceId
      : featured?.id;

  async function onRefresh() {
    setRefreshing(true);
    try {
      await Promise.all([refreshHome(), loadUnread(true), loadServices(true)]);
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
      await Promise.all([refreshHome(), loadUnread(true), loadServices(true)]);
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
      <View style={styles.rootShell}>
        <GlassBackdrop />
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
          <ListEmptyRetry message={loadError} onRetry={() => safeAsync(retryLoad)} />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.rootShell}>
      <GlassBackdrop />
      <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.green} />
        }
        showsVerticalScrollIndicator={false}
        {...customerScrollProps}
      >
        <HomeHero
          topInset={insets.top}
          brandName={brandName}
          heroEyebrow={homeConfig.heroEyebrow}
          heroSubtitle={homeConfig.heroSubtitle}
          searchPlaceholder={homeConfig.searchPlaceholder}
          query={q}
          onChangeQuery={setQ}
          onSubmitSearch={() => safeAsync(() => loadServices())}
          unread={unread}
        />

        <FadeSlideIn disabled delay={40}>
          <HomePromoCarousel
            promo={homePromo}
            homeConfig={homeConfig}
            onBook={() => appPush(customerRoutes.services)}
            onClaimOffer={() => {
              if (promoServiceId) {
                appPush(sharedRoutes.service(promoServiceId));
                return;
              }
              appPush(customerRoutes.offers);
            }}
          />
        </FadeSlideIn>

        <FadeSlideIn disabled delay={80}>
          <HomeQuickActions />
        </FadeSlideIn>

        <FadeSlideIn disabled delay={110}>
          <CustomerServiceTypeSection
            title={homeConfig.serviceTypesTitle || HOME_SECTION.serviceTypes}
          />
        </FadeSlideIn>

        <FadeSlideIn disabled delay={140} trigger={`${cat}-${debouncedQ}`}>
          <HomeServicesSection
            title={homeConfig.sectionTitles.services}
            onAction={() => appPush(customerRoutes.services)}
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
              <ServiceGrid services={services} onPressItem={(s) => appPush(sharedRoutes.service(s.id))} />
            )}
          </HomeServicesSection>
        </FadeSlideIn>

        <FadeSlideIn disabled delay={180}>
          {loading && popularList.length === 0 ? (
            <View style={styles.loadingBox}>
              <Spinner />
            </View>
          ) : popularList.length > 0 ? (
            <PopularServicesCarousel
              title={homeConfig.sectionTitles.popular}
              onAction={() => appPush(customerRoutes.services)}
              services={popularList}
              onPressItem={(s) => appPush(sharedRoutes.service(s.id))}
            />
          ) : null}
        </FadeSlideIn>

        <FadeSlideIn disabled delay={220}>
          <HomeTrustStrip guaranteeText={content.trust.guaranteeText} />
        </FadeSlideIn>
      </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  rootShell: { flex: 1, backgroundColor: surfaces.glassScreenBase, overflow: 'hidden' },
  safe: { flex: 1, backgroundColor: 'transparent', overflow: 'hidden' },
  root: { flex: 1 },
  content: {
    paddingBottom: TAB_BAR_SCROLL_PAD + 16,
    flexGrow: 1,
    gap: 6,
  },
  loadingBox: { paddingVertical: spacing.lg, alignItems: 'center' },
});
