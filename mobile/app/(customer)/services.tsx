import { useStaleFocusRefresh } from '@/lib/useStaleFocusRefresh';
import type { LucideIcon } from 'lucide-react-native';
import { formatRupeeFull } from '@/components/kit/format';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ServiceIcon } from '@/components/ServiceIcon';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { PremiumAurora } from '@/components/kit/PremiumAurora';
import { PestImage } from '@/components/kit/ServiceThumb';
import { AppIcons } from '@/constants/appIcons';
import { TAB_BAR_SCROLL_PAD } from '@/components/kit/GlassScreenKit';
import { FocusStatusBar } from '@/components/ui/FocusStatusBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { textInputDefaults } from '@/components/ui/textInputDefaults';
import { useAppContent } from '@/context/AppContentContext';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { api, getApiErrorMessage, safeAsync, screenLoadConfig } from '@/lib/api';
import { CACHE_TTL } from '@/lib/apiCache';
import { CUSTOMER_LIST_PERF } from '@/lib/listConfig';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { serviceDisplayRating } from '@/lib/ratings';
import { SERVICE_TYPE_KEYS, SERVICE_TYPE_LABELS, type ServiceTypeKey } from '@/constants/serviceTypes';
import { SERVICE_TYPE_META } from '@/constants/serviceTypeMeta';
import type { Service, ServiceStats } from '@/types/api';
import { colors, fonts, spacing, ui } from '@/constants/theme';
import { sharedRoutes, appPush } from '@/lib/routes';

type SortKey = 'popular' | 'rating' | 'price';
type ViewKey = 'grid' | 'list';

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'popular', label: 'Popular' },
  { key: 'rating', label: 'Top rated' },
  { key: 'price', label: 'Price' },
];

const SPOT_TAGS = ['MOST POPULAR', 'TRENDING', 'TOP CHOICE'];
const SPOT_CARD_W = 300;
const SPOT_GAP = 12;

const INK = ui.text;
const MUTED = ui.textSecondary;
const FAINT = ui.textTertiary;
const BORDER = ui.hairline;
const SCREEN_BG = ui.surfaceMuted;
const BRAND = ui.brand;

function serviceRating(service: Service): number {
  return serviceDisplayRating(service);
}

function durationLabel(service: Service): string {
  const steps = service.stepTemplate?.length ?? 0;
  return steps > 0 ? `~${Math.max(30, steps * 15)} min` : '~45 min';
}

function categoryIcon(category?: string): LucideIcon {
  switch (category) {
    case 'residential':
      return AppIcons.property.home;
    case 'commercial':
      return AppIcons.property.apartment;
    case 'cleaning':
      return AppIcons.ui.sparkles;
    default:
      return AppIcons.ui.brand;
  }
}

function formatBookings(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1).replace('.0', '')}k+ bookings`;
  return `${count} ${count === 1 ? 'booking' : 'bookings'}`;
}

export default function ServicesListScreen() {
  const { content, homeConfig } = useAppContent();
  const copy = useCustomerUiCopy();
  const [services, setServices] = useState<Service[]>([]);
  const [statsMap, setStatsMap] = useState<Record<string, ServiceStats>>({});
  const [q, setQ] = useState('');
  const debouncedQ = useDebouncedValue(q, 300);
  const [categoryLabel, setCategoryLabel] = useState(homeConfig.categoryChips[0]?.label ?? 'All');
  const [serviceType, setServiceType] = useState<'all' | ServiceTypeKey>('all');
  const [sort, setSort] = useState<SortKey>('popular');
  const [view, setView] = useState<ViewKey>('grid');
  const [spotIdx, setSpotIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setCategoryLabel((prev) => {
      if (homeConfig.categoryChips.some((c) => c.label === prev)) return prev;
      return homeConfig.categoryChips[0]?.label ?? 'All';
    });
  }, [homeConfig.categoryChips]);

  const load = useCallback(async () => {
    setLoadError(null);
    const { data } = await api.get<{ services: Service[] }>('/services', {
      ...screenLoadConfig,
      params: { includeStats: '1', ...(debouncedQ ? { q: debouncedQ } : {}) },
      cacheTtlMs: CACHE_TTL.services,
    });
    setServices(data.services);
    const map: Record<string, ServiceStats> = {};
    for (const s of data.services) {
      if (s.stats) map[s.id] = s.stats;
    }
    setStatsMap(map);
  }, [debouncedQ]);

  // Pick up admin changes (new offers, hidden services…) when the customer comes back to this screen.
  useStaleFocusRefresh(() => load().catch(() => undefined), 20_000);

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

  const popularIds = useMemo(() => {
    const ranked = [...services].sort(
      (a, b) => (statsMap[b.id]?.bookingCount ?? 0) - (statsMap[a.id]?.bookingCount ?? 0),
    );
    return new Set(
      ranked
        .filter((s) => (statsMap[s.id]?.bookingCount ?? 0) > 0)
        .slice(0, 2)
        .map((s) => s.id),
    );
  }, [services, statsMap]);

  const spotlight = useMemo(() => {
    return [...services]
      .sort((a, b) => (statsMap[b.id]?.bookingCount ?? 0) - (statsMap[a.id]?.bookingCount ?? 0))
      .slice(0, 3);
  }, [services, statsMap]);

  const avgRating = useMemo(() => {
    const rated = services.map(serviceRating).filter((r) => r > 0);
    if (rated.length === 0) return null;
    return rated.reduce((a, b) => a + b, 0) / rated.length;
  }, [services]);

  const totalBookings = useMemo(
    () => Object.values(statsMap).reduce((a, s) => a + (s.bookingCount ?? 0), 0),
    [statsMap],
  );

  const hasFilters = q.length > 0 || categoryLabel !== 'All' || serviceType !== 'all';

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

  const onSpotScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const i = Math.min(2, Math.max(0, Math.round(e.nativeEvent.contentOffset.x / (SPOT_CARD_W + SPOT_GAP))));
      if (i !== spotIdx) setSpotIdx(i);
    },
    [spotIdx],
  );

  const pageSubtitle =
    homeConfig.servicesSubtitle?.trim() || content.branding.tagline || 'Trusted pest control & home services';

  const hero = (
    <View style={styles.hero}>
      <PremiumAurora tone="light" base={false} topFade />
      <View style={styles.heroRow}>
        <View style={styles.heroLeft}>
          <Text style={styles.heroTitle}>
            {copy.servicesScreenTitle?.trim() || homeConfig.sectionTitles.services}
          </Text>
          <Text style={styles.heroSub} numberOfLines={2}>
            {pageSubtitle}
          </Text>
          {avgRating ? (
            <View style={styles.heroMetaRow}>
              <PremiumIcon icon={AppIcons.ui.star} variant="plain" size={11} color={INK} fill={INK} />
              <Text style={styles.heroMeta}>
                {avgRating.toFixed(1)} avg{totalBookings > 0 ? ` · ${formatBookings(totalBookings)}` : ''}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );

  const searchBar = (
    <View style={styles.searchWrap}>
      <View style={styles.searchCard}>
        <View style={styles.searchInner}>
          <PremiumIcon icon={AppIcons.ui.search} variant="plain" size={19} color={MUTED} strokeWidth={1.9} />
          <TextInput
            {...textInputDefaults}
            value={q}
            onChangeText={setQ}
            placeholder={homeConfig.searchPlaceholder || 'Search services…'}
            placeholderTextColor={FAINT}
            style={styles.searchInput}
            returnKeyType="search"
            onSubmitEditing={() => safeAsync(load)}
          />
          {hasFilters ? (
            <Pressable style={({ pressed }) => [styles.resetBtn, pressed && styles.pressedSm]} onPress={resetFilters}>
              <PremiumIcon icon={AppIcons.ui.close} variant="plain" size={12} color={BRAND} strokeWidth={2.4} />
              <Text style={styles.resetText}>RESET</Text>
            </Pressable>
          ) : (
            <View style={styles.filterBadge}>
              <PremiumIcon icon={AppIcons.ui.filters} variant="plain" size={16} color={BRAND} strokeWidth={1.9} />
            </View>
          )}
        </View>
      </View>
    </View>
  );

  const categoryChips = (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.chipScroll}
      contentContainerStyle={styles.chipRow}
    >
      {homeConfig.categoryChips.map((c) => {
        const on = c.label === categoryLabel;
        const Icon = categoryIcon(c.category);
        return (
          <Pressable
            key={c.label}
            onPress={() => setCategoryLabel(c.label)}
            style={({ pressed }) => [styles.catChip, on && styles.catChipOn, pressed && styles.pressedSm]}
          >
            <View style={[styles.catChipIcon, on && styles.catChipIconOn]}>
              <PremiumIcon icon={Icon} variant="plain" size={15} color={on ? colors.white : BRAND} strokeWidth={2} />
            </View>
            <Text style={[styles.catChipText, on && styles.catChipTextOn]}>{c.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );

  const pestChips =
    availableTypes.length > 0 ? (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.pestScroll}
        contentContainerStyle={styles.chipRow}
      >
        {(['all', ...availableTypes] as const).map((k) => {
          const on = serviceType === k;
          const label = k === 'all' ? 'All types' : SERVICE_TYPE_LABELS[k];
          return (
            <Pressable
              key={k}
              onPress={() => setServiceType(k === 'all' ? 'all' : k)}
              style={({ pressed }) => [styles.pestChip, on && styles.pestChipOn, pressed && styles.pressedSm]}
            >
              {k === 'all' ? (
                <PremiumIcon icon={AppIcons.ui.layoutGrid} variant="plain" size={13} color={on ? colors.white : BRAND} strokeWidth={2} />
              ) : (
                <PestImage source={SERVICE_TYPE_META[k].image} size={16} />
              )}
              <Text style={[styles.pestChipText, on && styles.pestChipTextOn]}>{label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    ) : null;

  const spotlightBlock =
    !hasFilters && spotlight.length > 0 ? (
      <View style={styles.spotBlock}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={SPOT_CARD_W + SPOT_GAP}
          decelerationRate="fast"
          onScroll={onSpotScroll}
          scrollEventThrottle={32}
          contentContainerStyle={styles.spotRow}
        >
          {spotlight.map((s, i) => {
            const rating = serviceRating(s);
            const bookings = statsMap[s.id]?.bookingCount ?? 0;
            return (
              <Pressable key={s.id} onPress={() => appPush(sharedRoutes.service(s.id))}>
                <View style={styles.spotCard}>
                  <View style={styles.spotTop}>
                    <View style={styles.spotTag}>
                      <Text style={styles.spotTagText}>{SPOT_TAGS[i] ?? 'FEATURED'}</Text>
                    </View>
                    {rating > 0 ? (
                      <View style={styles.spotRateRow}>
                        <PremiumIcon icon={AppIcons.ui.star} variant="plain" size={11} color={BRAND} fill={BRAND} />
                        <Text style={styles.spotRate}>
                          {rating.toFixed(1)}
                          {bookings > 0 ? ` · ${formatBookings(bookings)}` : ''}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.spotMain}>
                    <View style={styles.spotIcon}>
                      <ServiceIcon iconKey={s.iconKey} size={26} variant="premium" boxSize={52} color={BRAND} />
                    </View>
                    <View style={styles.spotInfo}>
                      <Text style={styles.spotName} numberOfLines={2}>
                        {s.name}
                      </Text>
                      <Text style={styles.spotSub} numberOfLines={1}>
                        {durationLabel(s)}
                        {s.category ? ` · ${s.category[0].toUpperCase()}${s.category.slice(1)}` : ''}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.spotFooter}>
                    <View>
                      <Text style={styles.fromLabelDark}>FROM</Text>
                      <Text style={styles.spotPrice}>{formatRupeeFull(s.basePrice)}</Text>
                    </View>
                    <Pressable
                      style={({ pressed }) => [styles.spotBook, pressed && styles.pressedSm]}
                      onPress={() => appPush(sharedRoutes.bookPath(s.id))}
                      hitSlop={6}
                    >
                      <Text style={styles.spotBookText}>Book</Text>
                      <PremiumIcon icon={AppIcons.ui.arrowRight} variant="plain" size={13} color={colors.white} strokeWidth={2.6} />
                    </Pressable>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
        <View style={styles.dotsRow}>
          {spotlight.map((s, i) => (
            <View key={s.id} style={[styles.dot, spotIdx === i && styles.dotOn]} />
          ))}
        </View>
      </View>
    ) : null;

  const sortBar = (
    <View style={styles.sortBar}>
      <View style={styles.sortLeft}>
        <Text style={styles.countLabel}>
          {visibleServices.length} {visibleServices.length === 1 ? 'service' : 'services'}
        </Text>
      </View>
      <View style={styles.sortRight}>
        <View style={styles.segment}>
          {SORTS.map((s) => {
            const on = sort === s.key;
            return (
              <Pressable key={s.key} onPress={() => setSort(s.key)} style={[styles.segBtn, on && styles.segBtnOn]}>
                <Text style={[styles.segText, on && styles.segTextOn]}>{s.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable
          style={({ pressed }) => [styles.viewToggle, pressed && styles.pressedSm]}
          onPress={() => setView(view === 'grid' ? 'list' : 'grid')}
        >
          {view === 'grid' ? (
            <PremiumIcon icon={AppIcons.ui.rows} variant="plain" size={16} color={MUTED} strokeWidth={1.9} />
          ) : (
            <PremiumIcon icon={AppIcons.ui.layoutGrid} variant="plain" size={16} color={MUTED} strokeWidth={1.9} />
          )}
        </Pressable>
      </View>
    </View>
  );

  const trustBanner = (
    <View style={styles.trustCard}>
      <PremiumIcon icon={AppIcons.ui.shieldCheck} variant="mint" size={22} color={BRAND} strokeWidth={1.8} boxSize={46} />
      <View style={styles.trustBody}>
        <Text style={styles.trustTitle}>Every booking is protected</Text>
        <Text style={styles.trustSub}>100% satisfaction guarantee on all {services.length} services</Text>
        <View style={styles.trustChips}>
          {content.trust.badges.slice(0, 3).map((b) => (
            <View key={b} style={styles.trustChip}>
              <Text style={styles.trustChipText}>{b}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const listHeader = (
    <View>
      {hero}
      {searchBar}
      {categoryChips}
      {pestChips}
      {spotlightBlock}
      {sortBar}
    </View>
  );

  const gridCardW = (Dimensions.get('window').width - spacing.md * 2 - 12) / 2;

  const renderGridItem = ({ item }: { item: Service }) => {
    const rating = serviceRating(item);
    return (
      <Pressable
        style={({ pressed }) => [styles.card, { width: gridCardW }, pressed && styles.pressedCard]}
        onPress={() => appPush(sharedRoutes.service(item.id))}
      >
        {popularIds.has(item.id) ? (
          <View style={styles.popBadge}>
            <Text style={styles.popBadgeText}>Popular</Text>
          </View>
        ) : null}
        <View style={styles.cardIcon}>
          <ServiceIcon iconKey={item.iconKey} size={24} variant="premium" boxSize={52} color={BRAND} />
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardName} numberOfLines={2}>
            {item.name}
          </Text>
          <View style={styles.cardMetaRow}>
            <View style={styles.cardMeta}>
              <PremiumIcon icon={AppIcons.ui.clock} variant="plain" size={11} color={FAINT} strokeWidth={2} />
              <Text style={styles.cardMetaText}>{durationLabel(item)}</Text>
            </View>
            {rating > 0 ? (
              <View style={styles.cardMeta}>
                <PremiumIcon icon={AppIcons.ui.star} variant="plain" size={11} color={BRAND} fill={BRAND} />
                <Text style={styles.cardMetaRating}>{rating.toFixed(1)}</Text>
              </View>
            ) : null}
          </View>
        </View>
        <View style={styles.perforation} />
        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.fromLabel}>FROM</Text>
            <Text style={styles.cardPrice}>{formatRupeeFull(item.basePrice)}</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.bookPill, pressed && styles.pressedSm]}
            onPress={() => appPush(sharedRoutes.bookPath(item.id))}
            hitSlop={6}
          >
            <Text style={styles.bookPillText}>Book</Text>
            <PremiumIcon icon={AppIcons.ui.arrowRight} variant="plain" size={12} color={colors.white} strokeWidth={2.6} />
          </Pressable>
        </View>
      </Pressable>
    );
  };

  const renderListItem = ({ item }: { item: Service }) => {
    const rating = serviceRating(item);
    return (
      <Pressable
        style={({ pressed }) => [styles.rowCard, pressed && styles.pressedCard]}
        onPress={() => appPush(sharedRoutes.service(item.id))}
      >
        <View style={styles.rowIcon}>
          <ServiceIcon iconKey={item.iconKey} size={22} variant="premium" boxSize={48} color={BRAND} />
        </View>
        <View style={styles.rowBody}>
          <View style={styles.rowNameRow}>
            <Text style={styles.rowName} numberOfLines={1}>
              {item.name}
            </Text>
            {popularIds.has(item.id) ? (
              <View style={styles.hotBadge}>
                <Text style={styles.hotBadgeText}>Popular</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.rowMeta} numberOfLines={1}>
            {durationLabel(item)}
            {rating > 0 ? '  ·  ' : ''}
            {rating > 0 ? <Text style={styles.rowRating}>★ {rating.toFixed(1)}</Text> : null}
          </Text>
        </View>
        <View style={styles.rowRight}>
          <Text style={styles.rowPrice}>{formatRupeeFull(item.basePrice)}</Text>
          <Pressable
            style={({ pressed }) => [styles.rowBook, pressed && styles.pressedSm]}
            onPress={() => appPush(sharedRoutes.bookPath(item.id))}
            hitSlop={8}
          >
            <Text style={styles.rowBookText}>Book</Text>
            <PremiumIcon icon={AppIcons.ui.arrowRight} variant="plain" size={11} color={BRAND} strokeWidth={2.6} />
          </Pressable>
        </View>
      </Pressable>
    );
  };

  const emptyBlock = (
    <View style={styles.emptyWrap}>
      <EmptyState
        title={hasFilters ? 'No services found' : 'No services'}
        message={hasFilters ? 'Try a different search or clear the filters' : 'Check back soon.'}
      />
      {hasFilters ? (
        <Pressable style={({ pressed }) => [styles.clearBtn, pressed && styles.pressedSm]} onPress={resetFilters}>
          <Text style={styles.clearBtnText}>Clear filters</Text>
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <View style={styles.rootShell}>
      <FocusStatusBar style="dark" />
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {loading && services.length === 0 ? (
        <ScrollView style={styles.scroller} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {hero}
          {searchBar}
          <Spinner />
        </ScrollView>
      ) : loadError && services.length === 0 ? (
        <ScrollView style={styles.scroller} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {hero}
          {searchBar}
          <ListEmptyRetry
            message={loadError}
            onRetry={() => safeAsync(load, undefined, (msg) => setLoadError(msg))}
          />
        </ScrollView>
      ) : (
        <Animated.FlatList
          style={styles.scroller}
          key={view}
          data={visibleServices}
          keyExtractor={(item) => item.id}
          numColumns={view === 'grid' ? 2 : 1}
          columnWrapperStyle={view === 'grid' ? styles.column : undefined}
          {...CUSTOMER_LIST_PERF}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND} />
          }
          ListHeaderComponent={listHeader}
          ListFooterComponent={visibleServices.length > 0 ? trustBanner : null}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={emptyBlock}
          renderItem={view === 'grid' ? renderGridItem : renderListItem}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
            useNativeDriver: true,
          })}
          scrollEventThrottle={16}
        />
      )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  // White root so the status-bar strip matches the header wash; the lists below sit on the muted canvas.
  rootShell: { flex: 1, backgroundColor: colors.white },
  scroller: { backgroundColor: SCREEN_BG },
  safe: { flex: 1, backgroundColor: 'transparent' },
  listContent: { paddingBottom: TAB_BAR_SCROLL_PAD, flexGrow: 1 },
  column: { justifyContent: 'space-between', paddingHorizontal: spacing.md, marginBottom: 12 },
  pressedSm: { transform: [{ scale: 0.94 }] },
  pressedCard: { transform: [{ scale: 0.97 }] },

  hero: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, overflow: 'hidden' },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroLeft: { flex: 1, paddingRight: 12 },
  heroTitle: {
    fontFamily: fonts.displayExtra,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.7,
    color: INK,
  },
  heroMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  heroMeta: { fontFamily: fonts.bodySemi, fontSize: 11.5, color: MUTED },
  heroSub: { marginTop: 4, fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: MUTED },

  searchWrap: { paddingHorizontal: 20 },
  /** White field on the grey canvas (same as the home search bar). */
  searchCard: {
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.border,
  },
  searchInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 5,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: INK,
    paddingVertical: 13,
  },
  filterBadge: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: ui.brandSoft,
    borderWidth: 1,
    borderColor: ui.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: ui.brandSoft,
    borderWidth: 1,
    borderColor: ui.hairline,
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  resetText: { fontFamily: fonts.bodyBold, fontSize: 11, color: BRAND, letterSpacing: 0.4 },

  chipScroll: { marginTop: 14, flexGrow: 0 },
  pestScroll: { marginTop: 9, flexGrow: 0 },
  chipRow: { paddingHorizontal: 20, gap: 8 },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    paddingVertical: 7,
    paddingLeft: 8,
    paddingRight: 15,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
  },
  catChipOn: {
    backgroundColor: BRAND,
    borderColor: BRAND,
  },
  catChipIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: ui.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catChipIconOn: { backgroundColor: 'rgba(255,255,255,0.18)' },
  catChipText: { fontFamily: fonts.bodyBold, fontSize: 13, color: ui.text },
  catChipTextOn: { color: colors.white },
  pestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
  },
  pestChipOn: { backgroundColor: BRAND, borderColor: BRAND },
  pestChipText: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: INK },
  pestChipTextOn: { color: colors.white },

  spotBlock: { marginTop: 16 },
  spotRow: { paddingHorizontal: 20, gap: SPOT_GAP },
  spotCard: {
    width: SPOT_CARD_W,
    borderRadius: 22,
    padding: 18,
    overflow: 'hidden',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    ...ui.shadow,
  },
  spotTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  spotTag: {
    backgroundColor: ui.brandSoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  spotTagText: { fontFamily: fonts.bodyBold, fontSize: 9.5, letterSpacing: 1.2, color: BRAND },
  spotRateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  spotRate: { fontFamily: fonts.bodyBold, fontSize: 11, color: MUTED },
  spotMain: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 13 },
  spotIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spotInfo: { flex: 1, minWidth: 0 },
  spotName: { fontFamily: fonts.displayExtra, fontSize: 17, lineHeight: 20, color: INK },
  spotSub: { marginTop: 3, fontFamily: fonts.bodySemi, fontSize: 11, color: MUTED },
  spotFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
  fromLabelDark: { fontFamily: fonts.bodyBold, fontSize: 9.5, letterSpacing: 1.1, color: FAINT },
  spotPrice: { fontFamily: fonts.displayExtra, fontSize: 20, color: INK },
  spotBook: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: BRAND,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  spotBookText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.white },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 9 },
  dot: { width: 6, height: 6, borderRadius: 999, backgroundColor: ui.hairline },
  dotOn: { width: 20, backgroundColor: BRAND },

  sortBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 14,
  },
  sortLeft: { flexShrink: 0 },
  countLabel: { fontFamily: fonts.displayExtra, fontSize: 19, letterSpacing: -0.2, color: INK },
  sortRight: { flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0 },
  segment: { flexDirection: 'row', backgroundColor: ui.surfaceMuted, borderRadius: 999, padding: 3 },
  segBtn: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  segBtnOn: { backgroundColor: colors.white, ...ui.shadow },
  segText: { fontFamily: fonts.bodyBold, fontSize: 11, color: MUTED },
  segTextOn: { color: INK },
  viewToggle: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },

  card: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    borderRadius: 22,
    padding: 14,
    gap: 10,
    ...ui.shadow,
  },
  popBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: ui.brandSoft,
    zIndex: 2,
  },
  popBadgeText: { fontFamily: fonts.bodyBold, fontSize: 10.5, color: BRAND },
  cardIcon: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  cardBody: { minHeight: 54 },
  cardName: { fontFamily: fonts.bodyBold, fontSize: 14.5, lineHeight: 19, color: INK },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardMetaText: { fontFamily: fonts.bodySemi, fontSize: 11, color: FAINT },
  cardMetaRating: { fontFamily: fonts.bodyBold, fontSize: 11, color: BRAND },
  perforation: {
    marginHorizontal: -14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: ui.hairline,
  },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fromLabel: { fontFamily: fonts.bodyBold, fontSize: 9.5, letterSpacing: 1, color: ui.textTertiary },
  cardPrice: { fontFamily: fonts.displayExtra, fontSize: 17, color: INK },
  bookPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 13,
    paddingHorizontal: 13,
    paddingVertical: 9,
    backgroundColor: BRAND,
  },
  bookPillText: { fontFamily: fonts.bodyBold, fontSize: 12.5, color: colors.white },

  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginHorizontal: spacing.md,
    marginBottom: 10,
    ...ui.shadow,
  },
  rowIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1, minWidth: 0 },
  rowNameRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  rowName: { flexShrink: 1, fontFamily: fonts.bodyBold, fontSize: 14, color: INK },
  hotBadge: {
    backgroundColor: ui.brandSoft,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  hotBadgeText: { fontFamily: fonts.bodyBold, fontSize: 10, color: BRAND },
  rowMeta: { marginTop: 3, fontFamily: fonts.bodySemi, fontSize: 11, color: FAINT },
  rowRating: { fontFamily: fonts.bodyBold, color: BRAND },
  rowRight: { alignItems: 'flex-end' },
  rowPrice: { fontFamily: fonts.displayExtra, fontSize: 15, color: INK },
  rowBook: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  rowBookText: { fontFamily: fonts.bodyBold, fontSize: 12, color: BRAND },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingVertical: 36 },
  clearBtn: {
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 11,
    backgroundColor: BRAND,
  },
  clearBtnText: { fontFamily: fonts.bodyBold, fontSize: 12.5, color: colors.white },

  trustCard: {
    flexDirection: 'row',
    gap: 13,
    marginHorizontal: spacing.md,
    marginTop: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    borderRadius: 22,
    padding: 16,
    ...ui.shadow,
  },
  trustBody: { flex: 1, minWidth: 0 },
  trustTitle: { fontFamily: fonts.bodyBold, fontSize: 14.5, color: ui.text },
  trustSub: { marginTop: 3, fontFamily: fonts.bodySemi, fontSize: 12, lineHeight: 17, color: ui.textSecondary },
  trustChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 9 },
  trustChip: {
    backgroundColor: ui.brandSoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  trustChipText: { fontFamily: fonts.bodyBold, fontSize: 10.5, color: BRAND },
});
