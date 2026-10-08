import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, RefreshControl, StyleSheet, Text, View, type ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TAB_BAR_SCROLL_PAD, customerScrollProps } from '@/components/kit/GlassScreenKit';
import { HomeCategoryGrid, HomeCategoryGridSkeleton, pickHomeTypes } from '@/components/kit/HomeCategoryGrid';
import { HomeNextVisitCard } from '@/components/kit/HomeNextVisitCard';
import { HomeOffersRail } from '@/components/kit/HomeOffersRail';
import { HomePromoCarousel } from '@/components/kit/HomePromoCarousel';
import { HomeQuickActions } from '@/components/kit/HomeQuickActions';
import { HomeSearchBar } from '@/components/kit/HomeSearchBar';
import { HomeServicesEmpty } from '@/components/kit/HomeServicesEmpty';
import { HomeServicesSection } from '@/components/kit/HomeServicesSection';
import { HOME_HEADER_BOTTOM, HOME_HEADER_TOP, HomeTopBar } from '@/components/kit/HomeTopBar';
import { HomeTrustStrip } from '@/components/kit/HomeTrustStrip';
import { MostBookedRail, MostBookedRailSkeleton } from '@/components/kit/MostBookedRail';
import { ServiceListRow } from '@/components/kit/ServiceListRow';
import { FocusStatusBar } from '@/components/ui/FocusStatusBar';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/context/AuthContext';
import { useAppContent } from '@/context/AppContentContext';
import axios from 'axios';
import { api, checkHealth, getApiErrorMessage, safeAsync, screenLoadConfig } from '@/lib/api';
import { CACHE_TTL } from '@/lib/apiCache';
import { config } from '@/lib/config';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { serviceDisplayRating } from '@/lib/ratings';
import { afterInteractions } from '@/lib/useScreenLoad';
import type { Booking, Offer, Service } from '@/types/api';
import { nextActiveBooking } from '@/lib/booking-helpers';
import type { ServiceTypeKey } from '@/constants/serviceTypes';
import { colors, fonts, ui } from '@/constants/theme';
import { bookingDetailPath, customerRoutes, sharedRoutes, appPush } from '@/lib/routes';
import { useStaleFocusRefresh } from '@/lib/useStaleFocusRefresh';

const LIST_LIMIT = 5;
const RAIL_LIMIT = 8;

/** CMS titles still on the legacy defaults get the newer Urban-style wording. */
function preferTitle(cms: string | undefined, legacy: string[], next: string): string {
  const t = cms?.trim();
  if (!t || legacy.some((l) => l.toLowerCase() === t.toLowerCase())) return next;
  return t;
}

export default function CustomerHome() {
  const { user } = useAuth();
  const { content, homeConfig, homePromo, refreshHome } = useAppContent();
  const copy = useCustomerUiCopy();
  const [services, setServices] = useState<Service[]>([]);
  /** Unfiltered catalogue — drives categories + "most booked" so they don't jump with search / chips. */
  const [catalog, setCatalog] = useState<Service[]>([]);
  const [unread, setUnread] = useState(0);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [q, setQ] = useState('');
  const debouncedQ = useDebouncedValue(q, 300);
  const [cat, setCat] = useState(homeConfig.categoryChips[0]?.label ?? 'All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);
  const [topBarHeight, setTopBarHeight] = useState(0);

  const brandName = content.branding.name?.trim() || 'Mr Antidot';
  const searching = q.trim().length > 0;
  const searchPending = searching && (loading || debouncedQ.trim() !== q.trim());

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

  /** Next visit + live coupons — secondary, so failures just hide their sections. */
  const loadExtras = useCallback(async (skipCache = false) => {
    if (!user) return;
    const cache = skipCache ? { skipCache: true as const } : {};
    const [b, o] = await Promise.allSettled([
      api.get<{ bookings: Booking[] }>('/bookings', { ...screenLoadConfig, cacheTtlMs: CACHE_TTL.bookingsList, ...cache }),
      api.get<{ offers: Offer[] }>('/offers', { ...screenLoadConfig, cacheTtlMs: CACHE_TTL.offers, ...cache }),
    ]);
    if (b.status === 'fulfilled') setBookings(b.value.data.bookings);
    if (o.status === 'fulfilled') setOffers(o.value.data.offers.filter((x) => x.active));
  }, [user]);

  const loadServices = useCallback(async (skipCache = false) => {
    if (!user) return;
    setLoadError(null);
    const params: Record<string, string> = { includeStats: '1' };
    const term = debouncedQ.trim();
    if (term) {
      // Search spans every category — chips are hidden while searching.
      params.q = term;
    } else {
      const selectedChip = homeConfig.categoryChips.find((c) => c.label === cat);
      if (selectedChip?.category) params.category = selectedChip.category;
    }

    const { data } = await api.get<{ services: Service[] }>('/services', {
      ...screenLoadConfig,
      params,
      cacheTtlMs: CACHE_TTL.services,
      ...(skipCache ? { skipCache: true } : {}),
    });
    setServices(data.services);
    if (!params.q && !params.category) setCatalog(data.services);
  }, [debouncedQ, cat, homeConfig.categoryChips, user]);

  useEffect(() => {
    if (!user) return;
    void afterInteractions(() => Promise.all([loadUnread(), loadExtras()]));
  }, [loadExtras, loadUnread, user]);

  useStaleFocusRefresh(() => {
    void Promise.allSettled([loadUnread(true), loadExtras(true)]);
  }, 3_000);

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
          } catch (healthErr) {
            msg = getApiErrorMessage(healthErr, `Network error — ${config.apiUrl}`);
          }
        }
        setLoadError(msg);
        setServices([]);
      } finally {
        setLoading(false);
      }
    });
  }, [loadServices, user]);

  const homeTypes = useMemo(
    () => pickHomeTypes(new Set(catalog.flatMap((s) => s.serviceTypes ?? []) as ServiceTypeKey[])),
    [catalog],
  );

  const featured = useMemo(() => {
    if (homeConfig.featuredServiceId) {
      const hit = catalog.find((s) => s.id === homeConfig.featuredServiceId);
      if (hit) return hit;
    }
    return undefined;
  }, [catalog, homeConfig.featuredServiceId]);

  const mostBooked = useMemo(() => {
    const ranked = [...catalog].sort((a, b) => {
      const bookDiff = (b.stats?.bookingCount ?? 0) - (a.stats?.bookingCount ?? 0);
      if (bookDiff !== 0) return bookDiff;
      return serviceDisplayRating(b) - serviceDisplayRating(a);
    });
    const list = featured ? [featured, ...ranked.filter((s) => s.id !== featured.id)] : ranked;
    return list.slice(0, RAIL_LIMIT);
  }, [catalog, featured]);

  const promoServiceId =
    homePromo?.serviceId && catalog.some((s) => s.id === homePromo.serviceId)
      ? homePromo.serviceId
      : (featured ?? mostBooked[0])?.id;

  const searchHints = useMemo(() => mostBooked.slice(0, 6).map((s) => s.name), [mostBooked]);
  const nextVisit = useMemo(() => nextActiveBooking(bookings), [bookings]);
  const catalogLoading = loading && catalog.length === 0;

  const openService = useCallback((s: Service) => appPush(sharedRoutes.service(s.id)), []);
  const bookService = useCallback((s: Service) => appPush(sharedRoutes.book(s.id)), []);

  async function onRefresh() {
    setRefreshing(true);
    try {
      await Promise.all([refreshHome(), loadUnread(true), loadExtras(true), loadServices(true)]);
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

  function changeQuery(next: string) {
    setQ(next);
    // Results replace the feed — start them at the top under the sticky search bar.
    if (next.trim() && !q.trim() && topBarHeight > 0) {
      scrollRef.current?.scrollTo({ y: topBarHeight, animated: false });
    }
  }

  if (!user) return <Spinner fullScreen />;

  if (loadError && services.length === 0 && !loading) {
    return (
      <View style={styles.root}>
        <FocusStatusBar style="dark" />
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
          <ListEmptyRetry message={loadError} onRetry={() => safeAsync(retryLoad)} />
        </SafeAreaView>
      </View>
    );
  }

  const dividerOpacity =
    topBarHeight > 0
      ? scrollY.interpolate({
          inputRange: [topBarHeight - 1, topBarHeight + 6],
          outputRange: [0, 1],
          extrapolate: 'clamp',
        })
      : 0;

  const listRows = services.slice(0, LIST_LIMIT);

  return (
    <View style={styles.root}>
      <FocusStatusBar style="dark" />
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <Animated.ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.content}
          stickyHeaderIndices={[1]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ui.textTertiary} />
          }
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
            useNativeDriver: true,
          })}
          scrollEventThrottle={16}
          {...customerScrollProps}
        >
          <View onLayout={(e) => setTopBarHeight(e.nativeEvent.layout.height)}>
            <HomeTopBar unread={unread} tagline={homeConfig.heroSubtitle} />
          </View>

          <HomeSearchBar
            query={q}
            onChangeQuery={changeQuery}
            onSubmit={() => safeAsync(() => loadServices())}
            hints={searchHints}
            fallbackPlaceholder={homeConfig.searchPlaceholder}
            dividerOpacity={dividerOpacity}
            background={HOME_HEADER_BOTTOM}
          />

          {searching ? (
            <View style={[styles.block, styles.results]}>
              <Text style={styles.resultsTitle} numberOfLines={1}>
                {searchPending
                  ? 'Searching…'
                  : `${services.length} ${services.length === 1 ? 'result' : 'results'} for “${debouncedQ.trim()}”`}
              </Text>
              {searchPending && services.length === 0 ? (
                <View style={styles.loadingBox}>
                  <Spinner />
                </View>
              ) : !searchPending && services.length === 0 ? (
                <HomeServicesEmpty filtered />
              ) : (
                services.map((s, i) => (
                  <ServiceListRow
                    key={s.id}
                    service={s}
                    onPress={() => openService(s)}
                    onBook={() => bookService(s)}
                    showDivider={i < services.length - 1}
                  />
                ))
              )}
            </View>
          ) : (
            <View>
              <HomeQuickActions background={HOME_HEADER_BOTTOM} />

              {nextVisit ? (
                <View style={[styles.block, styles.blockTight]}>
                  <HomeNextVisitCard
                    booking={nextVisit}
                    onPress={() => appPush(bookingDetailPath(user.role, nextVisit.id))}
                  />
                </View>
              ) : null}

              <View style={styles.block}>
                {homeTypes.length > 0 ? (
                  <HomeCategoryGrid
                    title={preferTitle(homeConfig.serviceTypesTitle, ['Service types'], 'What are you looking for?')}
                    actionLabel={homeConfig.serviceTypesAction}
                    onAction={() => appPush(customerRoutes.services)}
                    types={homeTypes}
                  />
                ) : catalogLoading ? (
                  <HomeCategoryGridSkeleton />
                ) : null}
              </View>

              <View style={styles.block}>
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
              </View>

              {offers.length > 0 ? (
                <View style={styles.block}>
                  <HomeOffersRail offers={offers} onSeeAll={() => appPush(customerRoutes.offers)} />
                </View>
              ) : null}

              <View style={styles.block}>
                {mostBooked.length > 0 ? (
                  <MostBookedRail
                    title={preferTitle(homeConfig.sectionTitles.popular, ['Popular now'], 'Most booked services')}
                    actionLabel={homeConfig.popularActionLabel}
                    onAction={() => appPush(customerRoutes.services)}
                    services={mostBooked}
                    badge={copy.homePopularBadge}
                    onPressItem={openService}
                  />
                ) : catalogLoading ? (
                  <MostBookedRailSkeleton />
                ) : null}
              </View>

              <View style={styles.block}>
                <HomeServicesSection
                  title={preferTitle(homeConfig.sectionTitles.services, ['Our services'], 'All services')}
                  subtitle={homeConfig.servicesSubtitle}
                  actionLabel={homeConfig.servicesActionLabel}
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
                    <HomeServicesEmpty filtered={cat !== homeConfig.categoryChips[0]?.label} />
                  ) : (
                    <>
                      {listRows.map((s, i) => (
                        <ServiceListRow
                          key={s.id}
                          service={s}
                          onPress={() => openService(s)}
                          onBook={() => bookService(s)}
                          showDivider={i < listRows.length - 1}
                        />
                      ))}
                      {services.length > LIST_LIMIT ? (
                        <Pressable
                          style={({ pressed }) => [styles.seeAll, pressed && { opacity: 0.7 }]}
                          onPress={() => appPush(customerRoutes.services)}
                          accessibilityRole="button"
                        >
                          <Text style={styles.seeAllText}>See all {services.length} services</Text>
                        </Pressable>
                      ) : null}
                    </>
                  )}
                </HomeServicesSection>
              </View>

              <View style={styles.trustWrap}>
                <HomeTrustStrip
                  brandName={brandName}
                  guaranteeText={content.trust.guaranteeText}
                  badges={content.trust.badges}
                />
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerBrand}>{brandName}</Text>
                <Text style={styles.footerTag}>
                  {content.branding.tagline?.trim() || 'Safe homes, happy families'}
                </Text>
              </View>
            </View>
          )}
        </Animated.ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  /** Status-bar strip matches the top of the header gradient. */
  root: { flex: 1, backgroundColor: HOME_HEADER_TOP },
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: { paddingBottom: TAB_BAR_SCROLL_PAD + 8, flexGrow: 1, backgroundColor: ui.surfaceMuted },
  /** Each feed section is a white block on the grey canvas (Urban-style). */
  block: { backgroundColor: colors.white, paddingVertical: 22, marginTop: 8 },
  blockTight: { paddingVertical: 16, marginTop: 0 },
  loadingBox: { paddingVertical: 32, alignItems: 'center' },
  results: { marginTop: 0, paddingTop: 12 },
  resultsTitle: {
    paddingHorizontal: 16,
    paddingBottom: 4,
    fontFamily: fonts.bodySemi,
    fontSize: 13.5,
    color: ui.textSecondary,
  },
  seeAll: {
    marginTop: 10,
    marginHorizontal: 16,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seeAllText: { fontFamily: fonts.bodyBold, fontSize: 14, color: ui.brand },
  trustWrap: { marginTop: 20 },
  footer: { paddingHorizontal: 16, paddingTop: 32, paddingBottom: 8, gap: 4 },
  footerBrand: {
    fontFamily: fonts.brand,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -1,
    color: '#D3D9D5',
  },
  footerTag: { fontFamily: fonts.bodyMedium, fontSize: 13.5, color: ui.textTertiary },
});
