import { LinearGradient } from 'expo-linear-gradient';
import type { LucideIcon } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  FlatList,
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ServiceIcon } from '@/components/ServiceIcon';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { GlassBackdrop, GlassPanel, TAB_BAR_SCROLL_PAD, glassSkin } from '@/components/kit/GlassScreenKit';
import { HeroDarkSlice } from '@/components/kit/HeroDarkSlice';
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
import { colors, fonts, headerTopPad, spacing, surfaces } from '@/constants/theme';
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

const INK = '#0B2213';
const MUTED = '#5C8A63';
const FAINT = '#86AC80';
const BORDER = '#E3F1DA';
const SCREEN_BG = surfaces.glassScreenBase;
const DEEP = '#0A6423';

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
  return `${count} bookings`;
}

export default function ServicesListScreen() {
  const insets = useSafeAreaInsets();
  const { content, homeConfig } = useAppContent();
  const ui = useCustomerUiCopy();
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
    return new Set(ranked.slice(0, 3).map((s) => s.id));
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
    <HeroDarkSlice
      style={styles.hero}
      contentStyle={{ paddingTop: headerTopPad(insets.top), paddingHorizontal: 20, paddingBottom: 58 }}
      sliceHeight={26}
    >
      <View style={styles.heroRow}>
        <View style={styles.heroLeft}>
          <View style={styles.eyebrowRow}>
            <LinearGradient colors={['#8FD03C', '#68D03C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.eyebrowBar} />
            <Text style={styles.eyebrow}>{content.branding.name || 'Mr Antidot'}</Text>
          </View>
          <Text style={styles.heroTitle}>
            {ui.servicesScreenTitle?.trim() || homeConfig.sectionTitles.services}
          </Text>
        </View>
        <View style={styles.heroRight}>
          <View style={styles.countPill}>
            <Text style={styles.countNum}>{visibleServices.length}</Text>
            <Text style={styles.countLb}>SHOWN</Text>
          </View>
          {avgRating ? (
            <View style={styles.heroMetaRow}>
              <PremiumIcon icon={AppIcons.ui.star} variant="plain" size={11} color="#FFFFFF" fill="#8FD03C" />
              <Text style={styles.heroMeta}>
                {avgRating.toFixed(1)} avg{totalBookings > 0 ? ` · ${formatBookings(totalBookings)}` : ''}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
      <Text style={styles.heroSub}>{pageSubtitle}</Text>
    </HeroDarkSlice>
  );

  const searchBar = (
    <View style={styles.searchWrap}>
      <GlassPanel style={styles.searchCard} padded={false} tone="clear" intensity={48}>
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
              <PremiumIcon icon={AppIcons.ui.close} variant="plain" size={12} color="#1A8734" strokeWidth={2.4} />
              <Text style={styles.resetText}>RESET</Text>
            </Pressable>
          ) : (
            <View style={styles.filterBadge}>
              <PremiumIcon icon={AppIcons.ui.filters} variant="plain" size={16} color="#1B873E" strokeWidth={1.9} />
            </View>
          )}
        </View>
      </GlassPanel>
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
              <PremiumIcon icon={Icon} variant="plain" size={15} color={on ? '#FFFFFF' : '#1B873E'} strokeWidth={2} />
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
          const Icon = k === 'all' ? AppIcons.ui.layoutGrid : SERVICE_TYPE_META[k].icon;
          return (
            <Pressable
              key={k}
              onPress={() => setServiceType(k === 'all' ? 'all' : k)}
              style={({ pressed }) => [styles.pestChip, on && styles.pestChipOn, pressed && styles.pressedSm]}
            >
              <PremiumIcon icon={Icon} variant="plain" size={13} color={on ? '#FFFFFF' : '#38623C'} strokeWidth={2} />
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
                <LinearGradient
                  colors={['#1B873E', '#043813']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.spotCard}
                >
                  <View style={styles.spotOrb} pointerEvents="none" />
                  <View style={styles.spotTop}>
                    <View style={styles.spotTag}>
                      <Text style={styles.spotTagText}>{SPOT_TAGS[i] ?? 'FEATURED'}</Text>
                    </View>
                    {rating > 0 ? (
                      <View style={styles.spotRateRow}>
                        <PremiumIcon icon={AppIcons.ui.star} variant="plain" size={11} color="#FFFFFF" fill="#FFFFFF" />
                        <Text style={styles.spotRate}>
                          {rating.toFixed(1)}
                          {bookings > 0 ? ` · ${formatBookings(bookings)}` : ''}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.spotMain}>
                    <View style={styles.spotIcon}>
                      <ServiceIcon iconKey={s.iconKey} size={26} color="#FFFFFF" />
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
                      <Text style={styles.spotPrice}>₹{s.basePrice}</Text>
                    </View>
                    <Pressable
                      style={({ pressed }) => [styles.spotBook, pressed && styles.pressedSm]}
                      onPress={() => appPush(sharedRoutes.bookPath(s.id))}
                      hitSlop={6}
                    >
                      <Text style={styles.spotBookText}>BOOK</Text>
                      <PremiumIcon icon={AppIcons.ui.arrowRight} variant="plain" size={13} color={DEEP} strokeWidth={2.6} />
                    </Pressable>
                  </View>
                </LinearGradient>
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
        <LinearGradient colors={['#68D03C', '#1A8734']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.countBar} />
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
      <PremiumIcon icon={AppIcons.ui.shieldCheck} variant="gradient" size={22} color="#FFFFFF" strokeWidth={1.8} boxSize={46} />
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
          <LinearGradient colors={['#68D03C', '#27A747']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.popBadge}>
            <Text style={styles.popBadgeText}>POPULAR</Text>
          </LinearGradient>
        ) : null}
        <View style={styles.cardIcon}>
          <ServiceIcon iconKey={item.iconKey} size={24} variant="premium" boxSize={52} color="#0B7228" />
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
                <PremiumIcon icon={AppIcons.ui.star} variant="plain" size={11} color="#25A443" fill="#25A443" />
                <Text style={styles.cardMetaRating}>{rating.toFixed(1)}</Text>
              </View>
            ) : null}
          </View>
        </View>
        <View style={styles.perforation}>
          <View style={[styles.notch, styles.notchLeft]} />
          <View style={[styles.notch, styles.notchRight]} />
        </View>
        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.fromLabel}>FROM</Text>
            <Text style={styles.cardPrice}>₹{item.basePrice}</Text>
          </View>
          <Pressable
            style={({ pressed }) => [pressed && styles.pressedSm]}
            onPress={() => appPush(sharedRoutes.bookPath(item.id))}
            hitSlop={6}
          >
            <LinearGradient colors={['#209640', '#0A6423']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.bookPill}>
              <Text style={styles.bookPillText}>BOOK</Text>
              <PremiumIcon icon={AppIcons.ui.arrowRight} variant="plain" size={12} color="#FFFFFF" strokeWidth={2.6} />
            </LinearGradient>
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
          <ServiceIcon iconKey={item.iconKey} size={22} variant="glass" boxSize={48} color="#0B7228" />
        </View>
        <View style={styles.rowBody}>
          <View style={styles.rowNameRow}>
            <Text style={styles.rowName} numberOfLines={1}>
              {item.name}
            </Text>
            {popularIds.has(item.id) ? (
              <View style={styles.hotBadge}>
                <Text style={styles.hotBadgeText}>HOT</Text>
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
          <Text style={styles.rowPrice}>₹{item.basePrice}</Text>
          <Pressable
            style={({ pressed }) => [styles.rowBook, pressed && styles.pressedSm]}
            onPress={() => appPush(sharedRoutes.bookPath(item.id))}
            hitSlop={8}
          >
            <Text style={styles.rowBookText}>BOOK</Text>
            <PremiumIcon icon={AppIcons.ui.arrowRight} variant="plain" size={11} color="#1A8734" strokeWidth={2.6} />
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
        <Pressable style={({ pressed }) => [pressed && styles.pressedSm]} onPress={resetFilters}>
          <LinearGradient colors={['#209640', '#0A6423']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>Clear filters</Text>
          </LinearGradient>
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <View style={styles.rootShell}>
      <GlassBackdrop />
      <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      {loading && services.length === 0 ? (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {hero}
          {searchBar}
          <Spinner />
        </ScrollView>
      ) : loadError && services.length === 0 ? (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {hero}
          {searchBar}
          <ListEmptyRetry
            message={loadError}
            onRetry={() => safeAsync(load, undefined, (msg) => setLoadError(msg))}
          />
        </ScrollView>
      ) : (
        <FlatList
          key={view}
          data={visibleServices}
          keyExtractor={(item) => item.id}
          numColumns={view === 'grid' ? 2 : 1}
          columnWrapperStyle={view === 'grid' ? styles.column : undefined}
          {...CUSTOMER_LIST_PERF}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.green} />
          }
          ListHeaderComponent={listHeader}
          ListFooterComponent={visibleServices.length > 0 ? trustBanner : null}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={emptyBlock}
          renderItem={view === 'grid' ? renderGridItem : renderListItem}
        />
      )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  rootShell: { flex: 1, backgroundColor: SCREEN_BG },
  safe: { flex: 1, backgroundColor: 'transparent' },
  listContent: { paddingBottom: TAB_BAR_SCROLL_PAD, flexGrow: 1 },
  column: { justifyContent: 'space-between', paddingHorizontal: spacing.md, marginBottom: 12 },
  pressedSm: { transform: [{ scale: 0.94 }] },
  pressedCard: { transform: [{ scale: 0.97 }] },

  hero: {
    overflow: 'hidden',
  },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroLeft: { flex: 1, paddingRight: 12 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyebrowBar: { width: 18, height: 3, borderRadius: 2 },
  eyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 11.5,
    letterSpacing: 2.6,
    color: 'rgba(255,255,255,0.82)',
    textTransform: 'uppercase',
  },
  heroTitle: {
    marginTop: 8,
    fontFamily: fonts.displayExtra,
    fontSize: 30,
    lineHeight: 33,
    letterSpacing: -0.5,
    color: '#FFFFFF',
  },
  heroRight: { alignItems: 'flex-end' },
  countPill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  countNum: { fontFamily: fonts.displayExtra, fontSize: 23, color: '#FFFFFF' },
  countLb: { fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 1, color: 'rgba(255,255,255,0.62)' },
  heroMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 9 },
  heroMeta: { fontFamily: fonts.bodyBold, fontSize: 11, color: 'rgba(255,255,255,0.72)' },
  heroSub: { marginTop: 10, fontFamily: fonts.body, fontSize: 13, color: 'rgba(255,255,255,0.68)' },

  searchWrap: { paddingHorizontal: 20, marginTop: -32 },
  searchCard: {
    borderRadius: 19,
    ...glassSkin.frost,
    shadowColor: '#03170B',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 8,
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
    backgroundColor: '#EAF6E3',
    borderWidth: 1,
    borderColor: '#DBF1D1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F2FAEE',
    borderWidth: 1,
    borderColor: '#DBF1D1',
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  resetText: { fontFamily: fonts.bodyBold, fontSize: 11, color: '#1A8734', letterSpacing: 0.4 },

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
    backgroundColor: 'rgba(255,255,255,0.48)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  catChipOn: {
    backgroundColor: '#0A6423',
    borderColor: '#064D1B',
    shadowColor: '#03170B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 5,
  },
  catChipIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#EAF6E3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  catChipIconOn: { backgroundColor: 'rgba(255,255,255,0.14)' },
  catChipText: { fontFamily: fonts.bodyBold, fontSize: 13, color: '#1F4129' },
  catChipTextOn: { color: '#FFFFFF' },
  pestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.48)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  pestChipOn: { backgroundColor: '#0A6423', borderColor: '#064D1B' },
  pestChipText: { fontFamily: fonts.bodyBold, fontSize: 12, color: '#38623C' },
  pestChipTextOn: { color: '#FFFFFF' },

  spotBlock: { marginTop: 16 },
  spotRow: { paddingHorizontal: 20, gap: SPOT_GAP },
  spotCard: {
    width: SPOT_CARD_W,
    borderRadius: 26,
    padding: 18,
    overflow: 'hidden',
    shadowColor: '#03170B',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.24,
    shadowRadius: 22,
    elevation: 8,
  },
  spotOrb: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(104,208,60,0.14)',
  },
  spotTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  spotTag: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  spotTagText: { fontFamily: fonts.bodyBold, fontSize: 9.5, letterSpacing: 1.2, color: '#FFFFFF' },
  spotRateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  spotRate: { fontFamily: fonts.bodyBold, fontSize: 11, color: 'rgba(255,255,255,0.72)' },
  spotMain: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 13 },
  spotIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spotInfo: { flex: 1, minWidth: 0 },
  spotName: { fontFamily: fonts.displayExtra, fontSize: 17, lineHeight: 20, color: '#FFFFFF' },
  spotSub: { marginTop: 3, fontFamily: fonts.bodySemi, fontSize: 11, color: 'rgba(255,255,255,0.65)' },
  spotFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
  fromLabelDark: { fontFamily: fonts.bodyBold, fontSize: 9.5, letterSpacing: 1.1, color: 'rgba(255,255,255,0.55)' },
  spotPrice: { fontFamily: fonts.displayExtra, fontSize: 20, color: '#FFFFFF' },
  spotBook: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 11,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.24,
    shadowRadius: 12,
    elevation: 4,
  },
  spotBookText: { fontFamily: fonts.bodyBold, fontSize: 11.5, letterSpacing: 0.8, color: DEEP },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 9 },
  dot: { width: 6, height: 6, borderRadius: 999, backgroundColor: '#CBE3BF' },
  dotOn: { width: 20, backgroundColor: '#0A6423' },

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
  countBar: { width: 26, height: 3, borderRadius: 2, marginTop: 6 },
  sortRight: { flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0 },
  segment: { flexDirection: 'row', backgroundColor: '#E6F4DE', borderRadius: 999, padding: 3 },
  segBtn: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  segBtnOn: {
    backgroundColor: '#0A6423',
    shadowColor: '#03170B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  segText: { fontFamily: fonts.bodyBold, fontSize: 11, color: MUTED },
  segTextOn: { color: '#FFFFFF' },
  viewToggle: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },

  card: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.48)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.58)',
    borderRadius: 22,
    padding: 14,
    gap: 10,
    shadowColor: '#03170B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  popBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderBottomLeftRadius: 14,
    zIndex: 2,
  },
  popBadgeText: { fontFamily: fonts.bodyBold, fontSize: 8.5, letterSpacing: 1, color: '#FFFFFF' },
  cardIcon: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  cardBody: { minHeight: 54 },
  cardName: { fontFamily: fonts.bodyBold, fontSize: 14.5, lineHeight: 19, color: INK },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardMetaText: { fontFamily: fonts.bodySemi, fontSize: 11, color: FAINT },
  cardMetaRating: { fontFamily: fonts.bodyBold, fontSize: 11, color: '#1A8734' },
  perforation: {
    marginHorizontal: -14,
    borderTopWidth: 1.5,
    borderColor: '#E5F2DD',
    borderStyle: 'dashed',
    position: 'relative',
  },
  notch: {
    position: 'absolute',
    top: -6,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: SCREEN_BG,
    borderWidth: 1,
    borderColor: BORDER,
  },
  notchLeft: { left: -6 },
  notchRight: { right: -6 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fromLabel: { fontFamily: fonts.bodyBold, fontSize: 9.5, letterSpacing: 1, color: '#9FBC96' },
  cardPrice: { fontFamily: fonts.displayExtra, fontSize: 17, color: '#1A8734' },
  bookPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 13,
    paddingHorizontal: 13,
    paddingVertical: 9,
    shadowColor: '#03170B',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  bookPillText: { fontFamily: fonts.bodyBold, fontSize: 10.5, letterSpacing: 0.8, color: '#FFFFFF' },

  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    backgroundColor: 'rgba(255,255,255,0.48)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.58)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginHorizontal: spacing.md,
    marginBottom: 10,
    shadowColor: '#03170B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  rowIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1, minWidth: 0 },
  rowNameRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  rowName: { flexShrink: 1, fontFamily: fonts.bodyBold, fontSize: 14, color: INK },
  hotBadge: {
    backgroundColor: '#68D03C',
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  hotBadgeText: { fontFamily: fonts.bodyBold, fontSize: 8, letterSpacing: 0.8, color: '#064D1B' },
  rowMeta: { marginTop: 3, fontFamily: fonts.bodySemi, fontSize: 11, color: FAINT },
  rowRating: { fontFamily: fonts.bodyBold, color: '#1A8734' },
  rowRight: { alignItems: 'flex-end' },
  rowPrice: { fontFamily: fonts.displayExtra, fontSize: 15, color: '#1A8734' },
  rowBook: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  rowBookText: { fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 0.5, color: '#1A8734' },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingVertical: 36 },
  clearBtn: { borderRadius: 999, paddingHorizontal: 20, paddingVertical: 11 },
  clearBtnText: { fontFamily: fonts.bodyBold, fontSize: 12.5, color: '#FFFFFF' },

  trustCard: {
    flexDirection: 'row',
    gap: 13,
    marginHorizontal: spacing.md,
    marginTop: 14,
    backgroundColor: '#EFF9EA',
    borderWidth: 1,
    borderColor: '#D6EFC9',
    borderRadius: 24,
    padding: 16,
  },
  trustIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#03170B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 4,
  },
  trustBody: { flex: 1, minWidth: 0 },
  trustTitle: { fontFamily: fonts.bodyBold, fontSize: 14.5, color: '#1B873E' },
  trustSub: { marginTop: 3, fontFamily: fonts.bodySemi, fontSize: 12, lineHeight: 17, color: '#38623C' },
  trustChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 9 },
  trustChip: {
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderWidth: 1,
    borderColor: '#D6EFC9',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  trustChipText: { fontFamily: fonts.bodyBold, fontSize: 10.5, color: '#1B873E' },
});
