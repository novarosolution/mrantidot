import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, Filter, MapPin, Search } from 'lucide-react-native';
import { PopularServiceCard } from '@/components/kit/PopularServiceCard';
import { ServiceGrid } from '@/components/kit/ServiceGrid';
import { PromoBanner } from '@/components/ui/PromoBanner';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { api, checkHealth, getApiErrorMessage, safeAsync, screenLoadConfig } from '@/lib/api';
import { config } from '@/lib/config';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import type { HomeConfig, HomePromo, Service, ServiceStats } from '@/types/api';
import { PremiumSectionHeader } from '@/components/ui/PremiumSectionHeader';
import { colors, design, fonts, gradients, headerTopPad, premium, radius, shadows, spacing, surfaces } from '@/constants/theme';

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

  const load = useCallback(async () => {
    if (!user) return;
    setLoadError(null);
    const params: Record<string, string> = { includeStats: '1' };
    if (debouncedQ) params.q = debouncedQ;
    const selectedChip = homeConfig.categoryChips.find((c) => c.label === cat);
    if (selectedChip?.category) params.category = selectedChip.category;

    const [svcRes, promoRes, notifRes] = await Promise.allSettled([
      api.get<{ services: Service[] }>('/services', { ...screenLoadConfig, params }),
      api.get<{ promo: HomePromo; homeConfig: HomeConfig }>('/content/home', screenLoadConfig),
      api.get<{ unreadCount: number }>('/notifications', screenLoadConfig),
    ]);

    let config = DEFAULT_HOME_CONFIG;
    if (promoRes.status === 'fulfilled') {
      setHomePromo(promoRes.value.data.promo);
      config = promoRes.value.data.homeConfig ?? DEFAULT_HOME_CONFIG;
      setHomeConfig(config);
    }
    if (svcRes.status === 'fulfilled') {
      const list = svcRes.value.data.services;
      setServices(list);
      const featuredId = config.featuredServiceId;
      const featured = featuredId ? list.find((s) => s.id === featuredId) : undefined;
      const popularSvc = featured ?? list[0];
      setPopularStats(popularSvc?.stats ?? null);
    } else {
      throw svcRes.reason;
    }
    if (notifRes.status === 'fulfilled') {
      setUnread(notifRes.value.data.unreadCount);
    } else {
      setUnread(0);
    }
  }, [debouncedQ, cat, user]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    safeAsync(async () => {
      try {
        await load();
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
  }, [load, user]);

  const popular =
    (homeConfig.featuredServiceId
      ? services.find((s) => s.id === homeConfig.featuredServiceId)
      : undefined) ?? services[0];

  async function onRefresh() {
    setRefreshing(true);
    try {
      await load();
      setLoadError(null);
    } catch (err) {
      setLoadError(getApiErrorMessage(err, 'Could not refresh'));
    } finally {
      setRefreshing(false);
    }
  }

  if (!user) return <Spinner fullScreen />;

  if (loadError && services.length === 0 && !loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <ListEmptyRetry message={loadError} onRetry={() => safeAsync(load)} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.green} />}
      >
        <LinearGradient colors={[...gradients.premiumHero]} style={[styles.hero, { paddingTop: headerTopPad(insets.top) }]}>
          <View style={styles.top}>
            <Pressable onPress={() => router.push('/(customer)/settings')}>
              <View style={styles.locRow}>
                <MapPin size={13} color={colors.lime} />
                <Text style={styles.loc}>{user?.city ?? 'Set city in profile'}</Text>
              </View>
              <Text style={styles.greet}>Hi, {(user.name?.trim() || 'there').split(' ')[0]}</Text>
            </Pressable>
            <View style={styles.topRight}>
              <Pressable style={styles.bell} onPress={() => router.push('/(customer)/notifications')}>
                <Bell size={19} color={colors.ink} />
                {unread > 0 ? (
                  <View style={styles.bellBadge}>
                    <Text style={styles.bellBadgeText}>{unread > 9 ? '9+' : unread}</Text>
                  </View>
                ) : null}
              </Pressable>
              <Pressable style={styles.avatar} onPress={() => router.push('/(customer)/profile')}>
                <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() ?? 'U'}</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.searchRow}>
            <Search size={18} color={colors.muted} />
            <TextInput
              style={styles.search}
              placeholder={homeConfig.searchPlaceholder}
              placeholderTextColor={colors.muted}
              value={q}
              onChangeText={setQ}
              onSubmitEditing={() => safeAsync(load)}
            />
            <Pressable style={styles.filter} onPress={() => router.push('/(customer)/services')}>
              <Filter size={16} color={colors.lime} />
            </Pressable>
          </View>
        </LinearGradient>

        <PromoBanner
          promo={homePromo}
          onPress={() => {
            const target = homePromo?.serviceId ?? popular?.id;
            if (target) router.push(`/service/${target}`);
          }}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips} contentContainerStyle={styles.chipsContent}>
          {homeConfig.categoryChips.map((c) => (
            <Chip key={c.label} label={c.label} selected={cat === c.label} onPress={() => setCat(c.label)} />
          ))}
        </ScrollView>

        <PremiumSectionHeader
          title={homeConfig.sectionTitles.services}
          actionLabel={homeConfig.servicesActionLabel}
          onAction={() => router.push('/(customer)/services')}
        />

        {loading && services.length === 0 ? (
          <View style={styles.loadingBox}>
            <Spinner />
          </View>
        ) : services.length === 0 ? (
          <View style={styles.emptyWrap}>
            <EmptyState
              title={debouncedQ ? 'No matches found' : 'No services available'}
              message={debouncedQ ? `Nothing matches “${debouncedQ}”. Try a different search.` : 'Check back soon.'}
            />
          </View>
        ) : (
          <ServiceGrid services={services} onPressItem={(s) => router.push(`/service/${s.id}`)} />
        )}

        <PremiumSectionHeader
          title={homeConfig.sectionTitles.popular}
          actionLabel={homeConfig.popularActionLabel}
          onAction={() => router.push('/(customer)/services')}
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
          <View style={styles.emptyWrap}>
            <EmptyState title="Nothing popular yet" message="Popular services will appear here." />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: design.screenBg },
  root: { flex: 1 },
  content: { paddingBottom: spacing.xl },
  hero: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    ...shadows.hero,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  loc: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.lime },
  greet: { fontFamily: fonts.displayExtra, fontSize: 22, color: colors.white, marginTop: 3 },
  topRight: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  bell: {
    width: 42,
    height: 42,
    borderRadius: radius.sm,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...premium.shadowSoft,
  },
  bellBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  bellBadgeText: { fontFamily: fonts.bodyBold, fontSize: 9, color: colors.white },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.displayExtra, color: colors.white, fontSize: 16 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    height: 52,
    backgroundColor: surfaces.glass,
    borderRadius: premium.radiusCard,
    borderWidth: 1,
    borderColor: surfaces.glassBorder,
    gap: spacing.sm,
    ...shadows.floating,
  },
  search: { flex: 1, fontFamily: fonts.body, fontSize: 14, color: colors.ink },
  filter: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.secondaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chips: { marginTop: spacing.md },
  chipsContent: { paddingHorizontal: spacing.md },
  loadingBox: { paddingVertical: spacing.lg, alignItems: 'center' },
  emptyWrap: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
});
