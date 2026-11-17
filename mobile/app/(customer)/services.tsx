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
import { plural } from '@/components/kit/format';
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
import { colors, fonts, ui } from '@/constants/theme';
import { sharedRoutes, appPush } from '@/lib/routes';

type SortKey = 'popular' | 'rating' | 'price';

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'popular', label: 'Popular' },
  { key: 'rating', label: 'Top rated' },
  { key: 'price', label: 'Price: low to high' },
];

const H_PAD = 16;
const PEST_TILE = 72;

/** Small dropdown-style button that opens a picker sheet. */
function FilterPill({ label, active = false, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.pill, active && styles.pillOn, pressed && styles.pillPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={[styles.pillText, active && styles.pillTextOn]} numberOfLines={1}>
        {label}
      </Text>
      <ChevronDown size={14} color={active ? ui.brand : ui.textSecondary} strokeWidth={2.4} />
    </Pressable>
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
      setLoadError(getApiErrorMessage(err, 'Could not refresh services'));
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
    homeConfig.servicesSubtitle?.trim() || content.branding.tagline || 'Trusted pest control & home services';
  const title = copy.servicesScreenTitle?.trim() || homeConfig.sectionTitles.services;

  const hero = (
    <View style={styles.hero}>
      <PremiumAurora tone="light" base={false} topFade />
      {/* The list below is white, so melt the aurora into it instead of ending on a hard edge. */}
      <LinearGradient colors={['rgba(255,255,255,0)', '#FFFFFF']} style={styles.heroFade} pointerEvents="none" />
      <Text style={styles.heroTitle}>{title}</Text>
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
          placeholder={homeConfig.searchPlaceholder || 'Search services…'}
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
            accessibilityLabel="Clear search"
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
          const label = k === 'all' ? 'All' : SERVICE_TYPE_LABELS[k];
          return (
            <Pressable
              key={k}
              style={styles.pestItem}
              onPress={() => setServiceType(k)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={k === 'all' ? 'All types' : label}
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
            </Pressable>
          );
        })}
      </ScrollView>
    ) : null;

  const sortLabel = SORTS.find((s) => s.key === sort)?.label ?? 'Popular';
  const filterRow = (
    <View style={styles.filterRow}>
      <Text style={styles.count}>{plural(visibleServices.length, 'service')}</Text>
      <View style={styles.pills}>
        {homeConfig.categoryChips.length > 1 ? (
          <FilterPill
            label={categoryActive ? categoryLabel : 'Category'}
            active={categoryActive}
            onPress={() => setSheet('category')}
          />
        ) : null}
        <FilterPill label={sortLabel} onPress={() => setSheet('sort')} />
      </View>
    </View>
  );

  const tick = <Check size={18} color={ui.brand} strokeWidth={2.6} />;
  const sortOptions: ActionSheetOption[] = SORTS.map((s) => ({
    key: s.key,
    label: s.label,
    icon: sort === s.key ? tick : undefined,
    onPress: () => setSort(s.key),
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
        title={hasFilters ? 'No services found' : 'No services'}
        message={hasFilters ? 'Try a different search or clear the filters' : 'Check back soon.'}
      />
      {hasFilters ? (
        <Pressable style={({ pressed }) => [styles.clearBtn, pressed && styles.pillPressed]} onPress={resetFilters}>
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
          <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            {hero}
            {searchBar}
            <Spinner />
          </ScrollView>
        ) : loadError && services.length === 0 ? (
          <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            {hero}
            {searchBar}
            <ListEmptyRetry message={loadError} onRetry={() => safeAsync(load, undefined, (msg) => setLoadError(msg))} />
          </ScrollView>
        ) : (
          <FlatList
            style={styles.list}
            data={visibleServices}
            keyExtractor={(item) => item.id}
            {...CUSTOMER_LIST_PERF}
            keyboardShouldPersistTaps="handled"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ui.brand} />}
            ListHeaderComponent={
              <View>
                {hero}
                {searchBar}
                {pestRow}
                {filterRow}
              </View>
            }
            ListFooterComponent={visibleServices.length > 0 ? <TrustNote style={styles.trust} /> : null}
            ListEmptyComponent={emptyBlock}
            contentContainerStyle={styles.listContent}
            renderItem={({ item, index }) => (
              <ServiceListRow
                service={item}
                badge={popularIds.has(item.id) ? 'Popular' : undefined}
                showDivider={index < visibleServices.length - 1}
                onPress={() => appPush(sharedRoutes.service(item.id))}
                onBook={() => appPush(sharedRoutes.bookPath(item.id))}
              />
            )}
          />
        )}
      </SafeAreaView>

      <AdminActionSheet visible={sheet === 'sort'} title="Sort by" options={sortOptions} onClose={() => setSheet(null)} />
      <AdminActionSheet
        visible={sheet === 'category'}
        title="Category"
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
  heroTitle: {
    fontFamily: fonts.displayExtra,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.7,
    color: ui.text,
  },
  heroSub: { marginTop: 4, fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: ui.textSecondary },

  searchWrap: { paddingHorizontal: H_PAD },
  /** Grey field — same as the home search band. */
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 50,
    paddingHorizontal: 14,
    borderRadius: 14,
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
  pestItem: { width: PEST_TILE, alignItems: 'center' },
  pestTile: {
    width: PEST_TILE,
    height: PEST_TILE,
    borderRadius: 20,
    backgroundColor: '#F4F5F4',
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pestTileOn: { borderColor: ui.brand, backgroundColor: ui.brandSoft },
  pestLabel: { marginTop: 7, fontFamily: fonts.bodyMedium, fontSize: 12.5, color: ui.text },
  pestLabelOn: { fontFamily: fonts.bodyBold, color: ui.brand },

  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: H_PAD,
    marginTop: 24,
    marginBottom: 2,
  },
  count: { fontFamily: fonts.displaySemi, fontSize: 21, letterSpacing: -0.4, color: ui.text },
  pills: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 17,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.border,
  },
  pillOn: { backgroundColor: ui.brandSoft, borderColor: 'rgba(8,123,53,0.35)' },
  pillPressed: { opacity: 0.8 },
  pillText: { flexShrink: 1, fontFamily: fonts.bodySemi, fontSize: 13, color: ui.text },
  pillTextOn: { color: ui.brand },

  trust: { marginHorizontal: H_PAD, marginTop: 8 },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingVertical: 36 },
  clearBtn: { borderRadius: 999, paddingHorizontal: 20, paddingVertical: 11, backgroundColor: ui.brand },
  clearBtnText: { fontFamily: fonts.bodyBold, fontSize: 12.5, color: colors.white },
});
