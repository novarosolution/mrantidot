import { useStaleFocusRefresh } from '@/lib/useStaleFocusRefresh';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ListRenderItem,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, ChevronDown, LayoutGrid, Search, X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdminActionSheet, type ActionSheetOption } from '@/components/kit/AdminActionSheet';
import { SEARCH_BAND } from '@/components/kit/HomeSearchBar';
import { PremiumAurora } from '@/components/kit/PremiumAurora';
import { PestImage } from '@/components/kit/ServiceThumb';
import { ServiceListRow } from '@/components/kit/ServiceListRow';
import { TrustNote } from '@/components/kit/TrustNote';
import { TAB_BAR_SCROLL_PAD } from '@/components/kit/GlassScreenKit';
import { FocusStatusBar } from '@/components/ui/FocusStatusBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { PressableScale } from '@/components/ui/PressableScale';
import { ServiceRowsSkeleton } from '@/components/kit/ScreenSkeletons';
import { Skeleton } from '@/components/ui/Skeleton';
import { fillCopy } from '@/constants/customerUiCopy';
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
import { colors, fonts, radii, typeScale, ui } from '@/constants/theme';
import { sharedRoutes, appPush } from '@/lib/routes';
import { serviceStartPrice } from '@/lib/serviceDisplay';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { haptic, stagger } from '@/lib/motion';

type SortKey = 'popular' | 'rating' | 'price';

const SORT_KEYS: SortKey[] = ['popular', 'rating', 'price'];

const H_PAD = 16;
const PEST_TILE = 72;

/** List rows: the filter bar (sticky) first, then services — or one empty-state row. */
type Row = { kind: 'filters' } | { kind: 'service'; service: Service; index: number } | { kind: 'empty' };
const FILTERS_ROW: Row = { kind: 'filters' };
const EMPTY_ROW: Row = { kind: 'empty' };

const rowKey = (r: Row) => (r.kind === 'service' ? r.service.id : r.kind);
const openService = (s: Service) => appPush(sharedRoutes.service(s.id));
const bookService = (s: Service) => appPush(sharedRoutes.bookPath(s.id));

/** Small dropdown-style button that opens a picker sheet. */
function FilterPill({ label, active = false, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  return (
    <PressableScale
      style={[styles.pill, active && styles.pillOn]}
      onPress={onPress}
      haptic="tap"
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={[styles.pillText, active && styles.pillTextOn]} numberOfLines={1}>
        {label}
      </Text>
      <ChevronDown size={14} color={active ? ui.brand : ui.textSecondary} strokeWidth={2.4} />
    </PressableScale>
  );
}

/** First paint: pest tiles + a few service rows as shimmer shapes (no spinner). */
function CatalogSkeleton() {
  return (
    <View>
      <View style={[styles.pestRow, styles.skelPests]}>
        {[0, 1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.pestItem}>
            <Skeleton width={PEST_TILE} height={PEST_TILE} radius={radii.card} />
            <Skeleton width={48} height={10} radius={5} style={styles.skelLabel} />
          </View>
        ))}
      </View>
      <ServiceRowsSkeleton rows={4} />
    </View>
  );
}

export default function ServicesListScreen() {
  const { content, homeConfig } = useAppContent();
  const copy = useCustomerUiCopy();
  const defaultCategory = homeConfig.categoryChips[0]?.label ?? 'All';
  const [services, setServices] = useState<Service[]>([]);
  const [statsMap, setStatsMap] = useState<Record<string, ServiceStats>>({});
  const [q, setQ] = useState('');
  const debouncedQ = useDebouncedValue(q, 300);
  const [categoryLabel, setCategoryLabel] = useState(defaultCategory);
  const [serviceType, setServiceType] = useState<'all' | ServiceTypeKey>('all');
  const [sort, setSort] = useState<SortKey>('popular');
  const [sheet, setSheet] = useState<'sort' | 'category' | null>(null);
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

  // Pick up admin changes (new offers, hidden services…) when the customer comes back to this screen.
  useStaleFocusRefresh(() => load().catch(() => undefined), 20_000);

  useEffect(() => {
    setLoading(true);
    safeAsync(async () => {
      try {
        await load();
      } catch (err) {
        setLoadError(getApiErrorMessage(err, copy.servicesLoadFailed));
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
      if (sort === 'price') return serviceStartPrice(a) - serviceStartPrice(b);
      if (sort === 'rating') return serviceDisplayRating(b) - serviceDisplayRating(a);
      return (statsMap[b.id]?.bookingCount ?? 0) - (statsMap[a.id]?.bookingCount ?? 0);
    });
  }, [services, selectedChip, serviceType, sort, statsMap]);

  /** The two most-booked services get a "Popular" label. */
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

  const categoryActive = categoryLabel !== defaultCategory;
  const hasFilters = q.length > 0 || categoryActive || serviceType !== 'all';

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } catch (err) {
      setLoadError(getApiErrorMessage(err, copy.servicesRefreshFailed));
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  function resetFilters() {
    setQ('');
    setCategoryLabel(defaultCategory);
    setServiceType('all');
    setSort('popular');
  }

  const pageSubtitle =
    homeConfig.servicesSubtitle?.trim() || content.branding.tagline?.trim() || copy.launchTaglineFallback;
  const title = copy.servicesScreenTitle?.trim() || homeConfig.sectionTitles.services;

  const hero = (
    <View style={styles.hero}>
      <PremiumAurora tone="light" base={false} topFade />
      {/* The list below is white, so melt the aurora into it instead of ending on a hard edge. */}
      <LinearGradient colors={['rgba(255,255,255,0)', colors.white]} style={styles.heroFade} pointerEvents="none" />
      <Text style={styles.heroTitle} accessibilityRole="header">
        {title}
      </Text>
      <Text style={styles.heroSub} numberOfLines={2}>
        {pageSubtitle}
      </Text>
    </View>
  );

  const searchBar = (
    <View style={styles.searchWrap}>
      <View style={styles.searchField}>
        <Search size={19} color={ui.textSecondary} strokeWidth={2} />
        <TextInput
          {...textInputDefaults}
          value={q}
          onChangeText={setQ}
          placeholder={homeConfig.searchPlaceholder || copy.servicesSearchPlaceholder}
          placeholderTextColor={ui.textTertiary}
          style={styles.searchInput}
          returnKeyType="search"
          onSubmitEditing={() => safeAsync(load)}
        />
        {q.length > 0 ? (
          <Pressable
            style={styles.clearX}
            onPress={() => setQ('')}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={copy.homeSearchClear}
          >
            <X size={13} color={colors.white} strokeWidth={3} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );

  /** One visual filter: pest art tiles ("All" first). */
  const pestRow =
    availableTypes.length > 0 ? (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.pestScroll}
        contentContainerStyle={styles.pestRow}
      >
        {(['all', ...availableTypes] as const).map((k) => {
          const on = serviceType === k;
          const label = k === 'all' ? copy.servicesAllLabel : SERVICE_TYPE_LABELS[k];
          return (
            <PressableScale
              key={k}
              containerStyle={styles.pestItem}
              style={styles.pestItemInner}
              scaleTo={0.94}
              onPress={() => {
                if (k !== serviceType) haptic('select');
                setServiceType(k);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={k === 'all' ? copy.servicesAllTypesA11y : label}
            >
              <View style={[styles.pestTile, on && styles.pestTileOn]}>
                {k === 'all' ? (
                  <LayoutGrid size={26} color={on ? ui.brand : ui.text} strokeWidth={2} />
                ) : (
                  <PestImage source={SERVICE_TYPE_META[k].image} size={46} />
                )}
              </View>
              <Text style={[styles.pestLabel, on && styles.pestLabelOn]} numberOfLines={1}>
                {label}
              </Text>
            </PressableScale>
          );
        })}
      </ScrollView>
    ) : null;

  const sortLabels: Record<SortKey, string> = {
    popular: copy.servicesSortPopular,
    rating: copy.servicesSortRating,
    price: copy.servicesSortPrice,
  };
  const sortLabel = sortLabels[sort];
  const filterRow = (
    <View style={styles.filterRow}>
      <Text style={styles.count}>
        {visibleServices.length === 1 ? copy.servicesCountOne : fillCopy(copy.servicesCountMany, { count: visibleServices.length })}
      </Text>
      <View style={styles.pills}>
        {homeConfig.categoryChips.length > 1 ? (
          <FilterPill
            label={categoryActive ? categoryLabel : copy.servicesCategoryLabel}
            active={categoryActive}
            onPress={() => setSheet('category')}
          />
        ) : null}
        <FilterPill label={sortLabel} onPress={() => setSheet('sort')} />
      </View>
    </View>
  );

  const rows = useMemo<Row[]>(
    () =>
      visibleServices.length > 0
        ? [FILTERS_ROW, ...visibleServices.map((service, index) => ({ kind: 'service' as const, service, index }))]
        : [FILTERS_ROW, EMPTY_ROW],
    [visibleServices],
  );
  const total = visibleServices.length;
  const renderRow: ListRenderItem<Row> = ({ item }) => {
    if (item.kind === 'filters') return <View style={styles.stickyBar}>{filterRow}</View>;
    if (item.kind === 'empty') return emptyBlock;
    return (
      // First screenful slides in one after another; rows further down render as-is.
      <FadeSlideIn delay={stagger(item.index)} slideFrom={12} disabled={item.index > 6}>
        <ServiceListRow
          service={item.service}
          badge={popularIds.has(item.service.id) ? copy.servicesPopularBadge : undefined}
          showDivider={item.index < total - 1}
          onPress={openService}
          onBook={bookService}
        />
      </FadeSlideIn>
    );
  };

  const tick = <Check size={18} color={ui.brand} strokeWidth={2.6} />;
  const sortOptions: ActionSheetOption[] = SORT_KEYS.map((k) => ({
    key: k,
    label: sortLabels[k],
    icon: sort === k ? tick : undefined,
    onPress: () => setSort(k),
  }));
  const categoryOptions: ActionSheetOption[] = homeConfig.categoryChips.map((c) => ({
    key: c.label,
    label: c.label,
    icon: c.label === categoryLabel ? tick : undefined,
    onPress: () => setCategoryLabel(c.label),
  }));

  const emptyBlock = (
    <View style={styles.emptyWrap}>
      <EmptyState
        title={hasFilters ? copy.servicesEmptyTitle : copy.homeEmptyNoServicesTitle}
        message={hasFilters ? copy.servicesEmptyMessage : copy.homeEmptyNoServicesMessage}
      />
      {hasFilters ? (
        <PressableScale style={styles.clearBtn} onPress={resetFilters} haptic="tap" accessibilityRole="button">
          <Text style={styles.clearBtnText}>{copy.servicesClearFilters}</Text>
        </PressableScale>
      ) : null}
    </View>
  );

  return (
    <View style={styles.rootShell}>
      <FocusStatusBar style="dark" />
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        {loading && services.length === 0 ? (
          <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            {hero}
            {searchBar}
            <CatalogSkeleton />
          </ScrollView>
        ) : loadError && services.length === 0 ? (
          <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            {hero}
            {searchBar}
            <ListEmptyRetry message={loadError} onRetry={() => safeAsync(load, undefined, (msg) => setLoadError(msg))} />
          </ScrollView>
        ) : (
          <FlatList<Row>
            style={styles.list}
            data={rows}
            keyExtractor={rowKey}
            {...CUSTOMER_LIST_PERF}
            // Clipping detaches rows that are mid-entrance (translated) and can leave blank cells on iOS.
            removeClippedSubviews={false}
            keyboardShouldPersistTaps="handled"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ui.brand} />}
            ListHeaderComponent={
              <View>
                {hero}
                {searchBar}
                {pestRow}
              </View>
            }
            // The count + category/sort bar (first row) pins to the top while the list scrolls under it.
            stickyHeaderIndices={[1]}
            ListFooterComponent={visibleServices.length > 0 ? <TrustNote style={styles.trust} /> : null}
            contentContainerStyle={styles.listContent}
            renderItem={renderRow}
          />
        )}
      </SafeAreaView>

      <AdminActionSheet visible={sheet === 'sort'} title={copy.servicesSortTitle} options={sortOptions} onClose={() => setSheet(null)} />
      <AdminActionSheet
        visible={sheet === 'category'}
        title={copy.servicesCategoryLabel}
        options={categoryOptions}
        onClose={() => setSheet(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // White root so the status-bar strip matches the header wash; the list below is white too.
  rootShell: { flex: 1, backgroundColor: colors.white },
  safe: { flex: 1, backgroundColor: 'transparent' },
  list: { backgroundColor: colors.white },
  listContent: { paddingBottom: TAB_BAR_SCROLL_PAD, flexGrow: 1 },

  hero: { paddingHorizontal: H_PAD, paddingTop: 12, paddingBottom: 18, overflow: 'hidden' },
  heroFade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 34 },
  heroTitle: { ...typeScale.display, color: ui.text },
  heroSub: { ...typeScale.body, marginTop: 4, color: ui.textSecondary },

  searchWrap: { paddingHorizontal: H_PAD },
  /** Grey field — same as the home search band. */
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 50,
    paddingHorizontal: 14,
    borderRadius: radii.control,
    backgroundColor: SEARCH_BAND,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.bodyMedium,
    fontSize: 15.5,
    color: ui.text,
    paddingVertical: 0,
  },
  clearX: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: ui.textTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  pestScroll: { marginTop: 20, flexGrow: 0 },
  pestRow: { paddingHorizontal: H_PAD, gap: 12 },
  pestItem: { width: PEST_TILE },
  pestItemInner: { alignItems: 'center' },
  skelPests: { marginTop: 20 },
  skelLabel: { marginTop: 8, alignSelf: 'center' },
  pestTile: {
    width: PEST_TILE,
    height: PEST_TILE,
    borderRadius: radii.card,
    backgroundColor: ui.band,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pestTileOn: { borderColor: ui.brand, backgroundColor: ui.brandSoft },
  pestLabel: { marginTop: 7, fontFamily: fonts.bodyMedium, fontSize: 12.5, color: ui.text },
  pestLabelOn: { fontFamily: fonts.bodyBold, color: ui.brand },

  stickyBar: {
    backgroundColor: colors.white,
    paddingTop: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ui.border,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: H_PAD,
  },
  count: { ...typeScale.section, color: ui.text },
  pills: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.border,
  },
  pillOn: { backgroundColor: ui.brandSoft, borderColor: ui.brand },
  pillText: { ...typeScale.captionStrong, flexShrink: 1, color: ui.text },
  pillTextOn: { color: ui.brand },

  trust: { marginHorizontal: H_PAD, marginTop: 8 },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingVertical: 36 },
  clearBtn: { borderRadius: radii.pill, paddingHorizontal: 22, minHeight: 44, justifyContent: 'center', backgroundColor: ui.brand },
  clearBtnText: { ...typeScale.captionStrong, fontFamily: fonts.bodyBold, color: colors.white },
});
