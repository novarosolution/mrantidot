import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, RefreshControl, StyleSheet, Text, View, type NativeScrollEvent, type NativeSyntheticEvent, type ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { TAB_BAR_SCROLL_PAD, customerScrollProps } from '@/components/kit/GlassScreenKit';
import { HomeCategoryGrid, HomeCategoryGridSkeleton, pickHomeTypes } from '@/components/kit/HomeCategoryGrid';
import { HomeNextVisitCard } from '@/components/kit/HomeNextVisitCard';
import { HomeOffersRail } from '@/components/kit/HomeOffersRail';
import { HomeSearchBar, SEARCH_BAND } from '@/components/kit/HomeSearchBar';
import { HomeServicesEmpty } from '@/components/kit/HomeServicesEmpty';
import { HOME_HERO_TOP, HomeTopBar } from '@/components/kit/HomeTopBar';
import { HERO_SLIDE_H, HomeHeroCarousel, promoHeroSlide, type HeroSlide } from '@/components/kit/HomeHeroCarousel';
import { ctaLabelText, formatRupeeFull } from '@/components/kit/format';
import { SERVICE_TYPE_META } from '@/constants/serviceTypeMeta';
import { SERVICE_TYPE_IMAGES } from '@/constants/serviceImages';
import { PremiumAurora } from '@/components/kit/PremiumAurora';
import { HomeBrandClosing } from '@/components/kit/HomeBrandClosing';
import { HomeServiceRail } from '@/components/kit/HomeServiceRail';
import { CurationsRail, FeatureBanner, NewArrivalsRail, SpotlightCarousel } from '@/components/kit/HomeShowcase';
import { MostBookedRailSkeleton } from '@/components/kit/MostBookedRail';
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
import { serviceStartPrice } from '@/lib/serviceDisplay';

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
  const topBarHeightRef = useRef(0);
  const insets = useSafeAreaInsets();
  /** True once the search bar is pinned to the top — the status strip turns light grey and its icons dark. */
  const [stuck, setStuck] = useState(false);
  const stuckRef = useRef(false);
  const [searchBarHeight, setSearchBarHeight] = useState(0);

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

  /** Every pest type with a live service, most-requested first — the grid, its second group and curations all slice this. */
  const homeTypes = useMemo(
    () => pickHomeTypes(new Set(catalog.flatMap((s) => s.serviceTypes ?? []) as ServiceTypeKey[]), 16),
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
    // Admin-pinned services win, in the admin's order (the API already returns them sorted).
    const pinned = catalog.filter((s) => s.showInPopular);
    if (pinned.length > 0) return pinned.slice(0, RAIL_LIMIT);
    const ranked = [...catalog].sort((a, b) => {
      const bookDiff = (b.stats?.bookingCount ?? 0) - (a.stats?.bookingCount ?? 0);
      if (bookDiff !== 0) return bookDiff;
      return serviceDisplayRating(b) - serviceDisplayRating(a);
    });
    const list = featured ? [featured, ...ranked.filter((s) => s.id !== featured.id)] : ranked;
    return list.slice(0, RAIL_LIMIT);
  }, [catalog, featured]);

  /** One rail per catalog category, in the admin's order; "general" joins the home rail. */
  const categoryRails = useMemo(() => {
    const visible = catalog.filter((s) => s.showOnHome !== false);
    const groups = [
      { key: 'residential', title: copy.homeRailHomeTitle, subtitle: copy.homeRailHomeSub, cats: ['residential', 'general'] },
      { key: 'commercial', title: copy.homeRailBusinessTitle, subtitle: copy.homeRailBusinessSub, cats: ['commercial'] },
      { key: 'cleaning', title: copy.homeRailCleaningTitle, subtitle: copy.homeRailCleaningSub, cats: ['cleaning'] },
    ];
    return groups
      .map((g) => ({ ...g, services: visible.filter((s) => g.cats.includes(s.category ?? 'general')).slice(0, RAIL_LIMIT) }))
      .filter((g) => g.services.length > 0);
  }, [catalog, copy]);

  /** Spotlight: the first service of each pest type, in the admin's order (max 5). */
  const spotlight = useMemo(() => {
    const seen = new Set<string>();
    return catalog
      .filter((s) => s.showOnHome !== false)
      .filter((s) => {
        const t = s.serviceTypes?.[0] ?? 'general';
        if (seen.has(t)) return false;
        seen.add(t);
        return true;
      })
      .slice(0, 5);
  }, [catalog]);

  /** Most recently added services — a compact tile rail, only worth showing once there are a few. */
  const newest = useMemo(
    () =>
      catalog
        .filter((s) => s.showOnHome !== false)
        .sort((a, b) => (Date.parse(b.createdAt ?? '') || 0) - (Date.parse(a.createdAt ?? '') || 0))
        .slice(0, 8),
    [catalog],
  );

  const promoServiceId =
    homePromo?.serviceId && catalog.some((s) => s.id === homePromo.serviceId)
      ? homePromo.serviceId
      : (featured ?? mostBooked[0])?.id;

  const searchHints = useMemo(() => mostBooked.slice(0, 6).map((s) => s.name), [mostBooked]);
  const nextVisit = useMemo(() => nextActiveBooking(bookings), [bookings]);
  const catalogLoading = loading && catalog.length === 0;

  const openService = useCallback((s: Service) => appPush(sharedRoutes.service(s.id)), []);
  const bookService = useCallback((s: Service) => appPush(sharedRoutes.book(s.id)), []);

  /** Header carousel: the admin promo (when on), the live coupon, then services from the spotlight — three slides at most. */
  const heroSlides = useMemo<HeroSlide[]>(() => {
    const out: HeroSlide[] = [];
    const cta = ctaLabelText(copy.homeHeroCta);
    const promoSlide = promoHeroSlide(homePromo, copy, () =>
      appPush(promoServiceId ? sharedRoutes.service(promoServiceId) : customerRoutes.services),
    );
    if (promoSlide) out.push(promoSlide);
    const offer = offers[0];
    if (offer) {
      const amount = offer.discountType === 'percent' ? `${offer.discount}%` : `₹${offer.discount}`;
      out.push({
        key: 'offer',
        kicker: copy.homeHeroKicker,
        title: `Get ${amount} off with code ${offer.code}`,
        cta,
        art: SERVICE_TYPE_IMAGES.general,
        onPress: () => appPush(customerRoutes.services),
      });
    }
    for (const s of spotlight.slice(0, 3 - out.length)) {
      const meta = SERVICE_TYPE_META[(s.serviceTypes?.[0] ?? 'general') as ServiceTypeKey] ?? SERVICE_TYPE_META.general;
      out.push({
        key: s.id,
        // The pest type is the kicker unless the service name already says it ("Bird Management").
        kicker: s.name.toLowerCase().includes(meta.label.toLowerCase()) ? copy.homeHeroKicker : meta.label,
        title: `${s.name} from ${formatRupeeFull(serviceStartPrice(s))}`,
        cta,
        art: meta.image,
        onPress: () => openService(s),
      });
    }
    if (out.length === 0) {
      out.push({
        key: 'default',
        kicker: copy.homeHeroKicker,
        title: copy.homeHeroTitle,
        cta,
        art: SERVICE_TYPE_IMAGES.general,
        onPress: () => appPush(customerRoutes.services),
      });
    }
    return out;
  }, [offers, homePromo, copy, spotlight, promoServiceId, openService]);

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

  const onScrollJs = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = topBarHeightRef.current > 0 && e.nativeEvent.contentOffset.y >= topBarHeightRef.current - 1;
    if (next !== stuckRef.current) {
      stuckRef.current = next;
      setStuck(next);
    }
  }, []);

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

  /** One aurora spans top bar + search + promo so the header reads as a single animated surface. */
  const headerHeight = topBarHeight + searchBarHeight + (searching ? 0 : HERO_SLIDE_H) || 420;

  const dividerOpacity =
    topBarHeight > 0
      ? scrollY.interpolate({
          inputRange: [topBarHeight - 1, topBarHeight + 6],
          outputRange: [0, 1],
          extrapolate: 'clamp',
        })
      : 0;


  return (
    <View style={styles.root}>
      <FocusStatusBar style={stuck ? 'dark' : 'light'} />
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
            listener: onScrollJs,
          })}
          scrollEventThrottle={16}
          {...customerScrollProps}
        >
          <View
            onLayout={(e) => {
              topBarHeightRef.current = e.nativeEvent.layout.height;
              setTopBarHeight(e.nativeEvent.layout.height);
            }}
          >
            <PremiumAurora tone="brand" style={[styles.aurora, { height: headerHeight }]} />
            <HomeTopBar unread={unread} scrollY={scrollY} />
          </View>

          <HomeSearchBar
            query={q}
            onChangeQuery={changeQuery}
            onSubmit={() => safeAsync(() => loadServices())}
            hints={searchHints}
            fallbackPlaceholder={homeConfig.searchPlaceholder}
            dividerOpacity={dividerOpacity}
            background="transparent"
            onLayout={(e) => setSearchBarHeight(e.nativeEvent.layout.height)}
          />

          {searching ? null : <HomeHeroCarousel slides={heroSlides} />}

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

              <View style={[styles.block, styles.gridBlock]}>
                {homeTypes.length > 0 ? (
                  <HomeCategoryGrid
                    offerTile={
                      offers[0]
                        ? {
                            value: offers[0].discountType === 'percent' ? `${offers[0].discount}%` : `₹${offers[0].discount}`,
                            label: 'Offers',
                            onPress: () => appPush(customerRoutes.offers),
                          }
                        : null
                    }
                    allLabel={copy.homeAllServices}
                    onAll={() => appPush(customerRoutes.services)}
                    types={homeTypes}
                    popularType={mostBooked[0]?.stats?.bookingCount ? mostBooked[0].serviceTypes?.[0] : null}
                  />
                ) : catalogLoading ? (
                  <HomeCategoryGridSkeleton />
                ) : null}
              </View>

              {nextVisit ? (
                <View style={[styles.block, styles.blockTight]}>
                  <HomeNextVisitCard
                    booking={nextVisit}
                    onPress={() => appPush(bookingDetailPath(user.role, nextVisit.id))}
                  />
                </View>
              ) : null}


              {spotlight.length > 0 ? (
                <View style={styles.block}>
                  <SpotlightCarousel
                    title={copy.homeSpotlightTitle}
                    services={spotlight}
                    ctaLabel={copy.homeHeroCta}
                    onOpen={openService}
                    onBook={bookService}
                  />
                </View>
              ) : null}

              {newest.length >= 3 ? (
                <View style={styles.block}>
                  <NewArrivalsRail title="Newly added" services={newest} onOpen={openService} />
                </View>
              ) : null}

              <View style={styles.block}>
                {mostBooked.length > 0 ? (
                  <HomeServiceRail
                    title={preferTitle(homeConfig.sectionTitles.popular, ['Popular now'], 'Most booked services')}
                    services={mostBooked}
                    firstBadge={copy.homePopularBadge}
                    onSeeAll={() => appPush(customerRoutes.services)}
                    onOpen={openService}
                    onAdd={bookService}
                  />
                ) : catalogLoading ? (
                  <MostBookedRailSkeleton />
                ) : null}
              </View>

              {offers.length > 0 ? (
                <View style={styles.block}>
                  <HomeOffersRail offers={offers} onSeeAll={() => appPush(customerRoutes.offers)} />
                </View>
              ) : null}

              {homeTypes.length > 0 ? (
                <View style={styles.block}>
                  <CurationsRail
                    title={copy.homeCurationsTitle}
                    subtitle={copy.homeCurationsSub}
                    types={homeTypes.slice(0, 8)}
                    onOpen={(t) => appPush(sharedRoutes.browse(t))}
                  />
                </View>
              ) : null}

              {categoryRails.map((rail, i) => (
                <View key={rail.key}>
                  {i === 1 ? (
                    <View style={styles.featureBlock}>
                      <FeatureBanner
                        tag={copy.homeFeatureTag}
                        service={featured ?? mostBooked[0]}
                        ctaLabel={copy.homeHeroCta}
                        onOpen={openService}
                        onBook={bookService}
                      />
                    </View>
                  ) : null}
                <View style={styles.block}>
                  <HomeServiceRail
                    title={rail.title}
                    subtitle={rail.subtitle}
                    services={rail.services}
                    onSeeAll={() => appPush(customerRoutes.services)}
                    onOpen={openService}
                    onAdd={bookService}
                  />
                </View>
                </View>
              ))}

              <HomeBrandClosing
                brandName={brandName}
                line={copy.homeClosingLine}
              />

            </View>
          )}
        </Animated.ScrollView>
      </SafeAreaView>
      {/* Status-bar strip: header green at rest, light grey (matching the stuck search band) once pinned. */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.strip,
          {
            height: insets.top,
            opacity:
              topBarHeight > 0
                ? scrollY.interpolate({ inputRange: [topBarHeight - 1, topBarHeight + 6], outputRange: [0, 1], extrapolate: 'clamp' })
                : 0,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  strip: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: SEARCH_BAND },
  /** Status-bar strip matches the top of the header gradient. */
  root: { flex: 1, backgroundColor: HOME_HERO_TOP },
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: { paddingBottom: TAB_BAR_SCROLL_PAD + 8, flexGrow: 1, backgroundColor: ui.surfaceMuted },
  /** Each feed section is a white block on the grey canvas (Urban-style). */
  block: { backgroundColor: colors.white, paddingVertical: 24, marginTop: 8 },
  featureBlock: { backgroundColor: '#FFFFFF', paddingTop: 24, paddingBottom: 8, marginTop: 8 },
  gridBlock: { marginTop: 0, paddingTop: 20 },
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
  /** Header backdrop — hangs below the top-bar wrapper to cover the search + promo too. */
  aurora: { bottom: undefined, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
});
