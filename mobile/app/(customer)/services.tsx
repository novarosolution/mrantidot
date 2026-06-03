import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ArrowUpDown, Clock, Search, ShieldCheck, Star, X } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CustomerListShell, listShellStyles } from '@/components/kit/CustomerListShell';
import { ServiceIcon } from '@/components/ServiceIcon';
import { StarRating } from '@/components/ui/StarRating';
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { api, getApiErrorMessage, safeAsync, screenLoadConfig } from '@/lib/api';
import { CUSTOMER_LIST_PERF } from '@/lib/listConfig';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { formatBookingCount } from '@/lib/formatCount';
import { ServiceTypeBadges } from '@/components/kit/ServiceTypeBadges';
import { SERVICE_TYPE_KEYS, SERVICE_TYPE_LABELS } from '@/constants/serviceTypes';
import type { Service, ServiceCategory, ServiceStats, ServiceTypeKey } from '@/types/api';
import { colors, design, fonts, gradients, premium, radius, spacing } from '@/constants/theme';

type CategoryFilter = 'all' | ServiceCategory;
type TypeFilter = 'all' | ServiceTypeKey;
type SortKey = 'popular' | 'rating' | 'price';

const CATEGORY_META: Record<ServiceCategory, { label: string; tone: BadgeTone }> = {
  residential: { label: 'Residential', tone: 'success' },
  commercial: { label: 'Commercial', tone: 'info' },
  cleaning: { label: 'Cleaning', tone: 'sky' },
  general: { label: 'General', tone: 'neutral' },
};

const CATEGORY_ORDER: ServiceCategory[] = ['residential', 'commercial', 'cleaning', 'general'];

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'popular', label: 'Popular' },
  { key: 'rating', label: 'Top rated' },
  { key: 'price', label: 'Price' },
];

const POPULAR_THRESHOLD = 10;

function serviceRating(service: Service, stats?: ServiceStats): number {
  return stats?.avgRating ?? service.rating ?? 0;
}

function durationLabel(service: Service): string {
  const steps = service.stepTemplate?.length ?? 0;
  return steps > 0 ? `~${Math.max(30, steps * 15)} min` : '45–60 min';
}

export default function ServicesListScreen() {
  const [services, setServices] = useState<Service[]>([]);
  const [statsMap, setStatsMap] = useState<Record<string, ServiceStats>>({});
  const [q, setQ] = useState('');
  const debouncedQ = useDebouncedValue(q, 300);
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [serviceType, setServiceType] = useState<TypeFilter>('all');
  const [sort, setSort] = useState<SortKey>('popular');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    const { data } = await api.get<{ services: Service[] }>('/services', {
      ...screenLoadConfig,
      params: { includeStats: '1', ...(debouncedQ ? { q: debouncedQ } : {}) },
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

  const availableCategories = useMemo(() => {
    const present = new Set(services.map((s) => s.category).filter(Boolean) as ServiceCategory[]);
    return CATEGORY_ORDER.filter((c) => present.has(c));
  }, [services]);

  const availableTypes = useMemo(() => {
    const present = new Set<ServiceTypeKey>();
    for (const s of services) {
      for (const t of s.serviceTypes ?? []) present.add(t);
    }
    return SERVICE_TYPE_KEYS.filter((k) => present.has(k));
  }, [services]);

  const visibleServices = useMemo(() => {
    let filtered = category === 'all' ? services : services.filter((s) => s.category === category);
    if (serviceType !== 'all') {
      filtered = filtered.filter((s) => s.serviceTypes?.includes(serviceType));
    }
    const sorted = [...filtered].sort((a, b) => {
      if (sort === 'price') return a.basePrice - b.basePrice;
      if (sort === 'rating') return serviceRating(b, statsMap[b.id]) - serviceRating(a, statsMap[a.id]);
      return (statsMap[b.id]?.bookingCount ?? 0) - (statsMap[a.id]?.bookingCount ?? 0);
    });
    return sorted;
  }, [services, category, serviceType, sort, statsMap]);

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
    setCategory('all');
    setServiceType('all');
    setSort('popular');
  }

  const searchHeader = (
    <View style={styles.headerExtra}>
      <View style={styles.searchRow}>
        <Search size={17} color={colors.muted} />
        <TextInput
          style={styles.search}
          placeholder="Search services…"
          placeholderTextColor={colors.muted}
          value={q}
          onChangeText={setQ}
          returnKeyType="search"
          onSubmitEditing={() => safeAsync(load)}
        />
        {q.length > 0 ? (
          <Pressable onPress={() => setQ('')} hitSlop={8} accessibilityLabel="Clear search">
            <X size={16} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>

      {availableCategories.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catRow}
          keyboardShouldPersistTaps="handled"
        >
          <CategoryChip label="All" active={category === 'all'} onPress={() => setCategory('all')} />
          {availableCategories.map((c) => (
            <CategoryChip
              key={c}
              label={CATEGORY_META[c].label}
              active={category === c}
              onPress={() => setCategory(c)}
            />
          ))}
        </ScrollView>
      ) : null}

      {availableTypes.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.typeRow}
          keyboardShouldPersistTaps="handled"
        >
          <CategoryChip label="All types" active={serviceType === 'all'} onPress={() => setServiceType('all')} />
          {availableTypes.map((t) => (
            <CategoryChip
              key={t}
              label={SERVICE_TYPE_LABELS[t]}
              active={serviceType === t}
              onPress={() => setServiceType(t)}
            />
          ))}
        </ScrollView>
      ) : null}
    </View>
  );

  const toolbar = (
    <View style={styles.toolbar}>
      <Text style={styles.count}>
        {visibleServices.length} {visibleServices.length === 1 ? 'service' : 'services'}
      </Text>
      <View style={styles.sortRow}>
        <ArrowUpDown size={13} color={colors.muted} />
        {SORTS.map((s) => {
          const on = sort === s.key;
          return (
            <Pressable
              key={s.key}
              onPress={() => setSort(s.key)}
              style={[styles.sortChip, on && styles.sortChipOn]}
            >
              <Text style={[styles.sortText, on && styles.sortTextOn]}>{s.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  return (
    <CustomerListShell
      title="Our Services"
      subtitle="Browse and book pest control"
      showBack={false}
      headerExtra={searchHeader}
    >
      {loading ? (
        <Spinner />
      ) : loadError && services.length === 0 ? (
        <ListEmptyRetry message={loadError} onRetry={() => safeAsync(load)} />
      ) : (
        <FlatList
          data={visibleServices}
          keyExtractor={(item) => item.id}
          {...CUSTOMER_LIST_PERF}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.green} />
          }
          ListHeaderComponent={services.length > 0 ? toolbar : null}
          contentContainerStyle={visibleServices.length === 0 ? listShellStyles.empty : listShellStyles.list}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <EmptyState
                title={debouncedQ || category !== 'all' || serviceType !== 'all' ? 'No matches found' : 'No services'}
                message={
                  debouncedQ || category !== 'all' || serviceType !== 'all'
                    ? 'Try a different search or filter.'
                    : 'Check back soon.'
                }
              />
              {debouncedQ || category !== 'all' || serviceType !== 'all' ? (
                <Button title="Reset filters" variant="secondary" onPress={resetFilters} style={styles.resetBtn} />
              ) : null}
            </View>
          }
          renderItem={({ item }) => (
            <ServiceRow
              service={item}
              stats={statsMap[item.id]}
              onOpen={() => router.push(`/service/${item.id}`)}
              onBook={() => router.push(`/book/${item.id}`)}
            />
          )}
        />
      )}
    </CustomerListShell>
  );
}

function CategoryChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.catChip, active ? styles.catChipOn : styles.catChipOff]}>
      <Text style={[styles.catText, active ? styles.catTextOn : styles.catTextOff]}>{label}</Text>
    </Pressable>
  );
}

function ServiceRow({
  service,
  stats,
  onOpen,
  onBook,
}: {
  service: Service;
  stats?: ServiceStats;
  onOpen: () => void;
  onBook: () => void;
}) {
  const rating = serviceRating(service, stats);
  const bookingCount = stats?.bookingCount ?? 0;
  const reviewCount = stats?.reviewCount ?? 0;
  const isPopular = bookingCount >= POPULAR_THRESHOLD;
  const categoryMeta = service.category ? CATEGORY_META[service.category] : null;

  return (
    <Card variant="premium" style={styles.card} onPress={onOpen}>
      <View style={styles.cardTop}>
        <LinearGradient colors={[...gradients.primary]} style={styles.icon}>
          <ServiceIcon iconKey={service.iconKey} size={26} color={colors.white} />
        </LinearGradient>
        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={styles.name} numberOfLines={1}>{service.name}</Text>
            {categoryMeta ? <StatusBadge label={categoryMeta.label} tone={categoryMeta.tone} /> : null}
          </View>
          <View style={styles.ratingRow}>
            {rating > 0 ? (
              <StarRating rating={rating} size={12} showValue count={reviewCount || undefined} />
            ) : (
              <StatusBadge label="New" tone="sky" />
            )}
            {isPopular ? <StatusBadge label="★ Popular" tone="gold" /> : null}
          </View>
          <Text style={styles.desc} numberOfLines={2}>{service.shortDesc}</Text>
          <ServiceTypeBadges types={service.serviceTypes} max={3} />
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaChip}>
          <Clock size={12} color={colors.green} />
          <Text style={styles.metaText}>{durationLabel(service)}</Text>
        </View>
        <View style={styles.metaChip}>
          <ShieldCheck size={12} color={colors.skyDeep} />
          <Text style={styles.metaText}>Photo verified</Text>
        </View>
        {bookingCount > 0 ? (
          <View style={styles.metaChip}>
            <Star size={12} color={premium.accentGold} />
            <Text style={styles.metaText}>{formatBookingCount(bookingCount)} booked</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.priceRow}>
        <View>
          <Text style={styles.from}>Starting at</Text>
          <Text style={styles.price}>
            ₹{service.basePrice} <Text style={styles.per}>/ visit</Text>
          </Text>
        </View>
        <Button title="Book now" variant="premium" onPress={onBook} style={styles.bookBtn} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  headerExtra: { marginTop: spacing.sm },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    height: 48,
    backgroundColor: colors.white,
    borderRadius: premium.radiusCard,
    gap: spacing.sm,
    ...premium.shadowSoft,
  },
  search: { flex: 1, fontFamily: fonts.body, fontSize: 14, color: colors.ink },
  catRow: { gap: spacing.sm, paddingTop: spacing.sm, paddingRight: spacing.md },
  typeRow: { gap: spacing.sm, paddingTop: spacing.xs, paddingRight: spacing.md },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.full,
  },
  catChipOn: { backgroundColor: colors.lime },
  catChipOff: { backgroundColor: 'rgba(255,255,255,0.16)' },
  catText: { fontFamily: fonts.bodySemi, fontSize: 12.5 },
  catTextOn: { color: colors.forest },
  catTextOff: { color: colors.white },

  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  count: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.muted },
  sortRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  sortChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortChipOn: { backgroundColor: colors.soft, borderColor: colors.green },
  sortText: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.muted },
  sortTextOn: { color: colors.forest },

  card: { marginBottom: spacing.md, padding: spacing.md, gap: spacing.sm },
  cardTop: { flexDirection: 'row', gap: spacing.md },
  icon: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  name: { flex: 1, fontFamily: fonts.display, fontSize: 16, color: colors.ink },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  desc: { fontFamily: fonts.body, fontSize: 12.5, color: colors.muted, lineHeight: 18, marginTop: 2 },

  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.card,
  },
  metaText: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.ink },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  from: { fontFamily: fonts.bodySemi, fontSize: 10, color: colors.muted, letterSpacing: 0.3 },
  price: { fontFamily: fonts.displayExtra, fontSize: 18, color: premium.accentGold, marginTop: 2 },
  per: { fontFamily: fonts.body, fontSize: 11, color: colors.muted },
  bookBtn: { paddingHorizontal: 20, minHeight: 44 },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  resetBtn: { paddingHorizontal: spacing.lg },
});
