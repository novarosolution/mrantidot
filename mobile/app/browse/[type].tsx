import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, Star } from 'lucide-react-native';
import { safeGoBack, customerRoutes, sharedRoutes, appPush } from '@/lib/routes';
import { CustomerPageHeader } from '@/components/kit/CustomerPageHeader';
import { ListGroup, ListNavRow } from '@/components/kit/ListGroup';
import { PestImage } from '@/components/kit/ServiceThumb';
import { ServiceListRow } from '@/components/kit/ServiceListRow';
import { TrustNote } from '@/components/kit/TrustNote';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { formatRupeeFull } from '@/components/kit/format';
import { AppIcons } from '@/constants/appIcons';
import { SERVICE_TYPE_META } from '@/constants/serviceTypeMeta';
import { isServiceTypeKey } from '@/constants/serviceTypes';
import { api, getApiErrorMessage, safeAsync, screenLoadConfig } from '@/lib/api';
import { CACHE_TTL } from '@/lib/apiCache';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { formatSocialProof } from '@/lib/display';
import { earliestSlotLabel } from '@/lib/earliestSlot';
import { serviceDisplayRating } from '@/lib/ratings';
import { serviceStartPrice } from '@/lib/serviceDisplay';
import type { Service, ServiceCategory, ServiceTypeKey } from '@/types/api';
import { colors, fonts, radii, spacing, typeScale, ui } from '@/constants/theme';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { PressableScale } from '@/components/ui/PressableScale';
import { stagger } from '@/lib/motion';
import { CategorySkeleton } from '@/components/kit/ScreenSkeletons';

export default function ServicesByTypeScreen() {
  const { type: rawType } = useLocalSearchParams<{ type: string }>();
  const typeKey = rawType && isServiceTypeKey(rawType) ? rawType : null;
  const meta = typeKey ? SERVICE_TYPE_META[typeKey] : null;
  const copy = useCustomerUiCopy();
  const insets = useSafeAreaInsets();
  const earliest = useMemo(() => earliestSlotLabel(), []);

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (skipCache = false) => {
      if (!typeKey) return;
      setError(null);
      setLoading(true);
      try {
        const { data } = await api.get<{ services: Service[] }>('/services', {
          ...screenLoadConfig,
          params: { type: typeKey, includeStats: '1' },
          cacheTtlMs: CACHE_TTL.services,
          ...(skipCache ? { skipCache: true } : {}),
        });
        setServices(data.services);
      } catch (err) {
        setError(getApiErrorMessage(err, copy.servicesLoadFailed));
      } finally {
        setLoading(false);
      }
    },
    // Copy changes must not refetch the list.
    [typeKey],
  );

  useEffect(() => {
    safeAsync(load);
  }, [load]);

  /** One section per catalog category, in the admin's order; titles only matter when there are several. */
  const groups = useMemo(() => {
    const defs: { key: string; title: string; cats: ServiceCategory[] }[] = [
      { key: 'home', title: copy.homeRailHomeTitle, cats: ['residential', 'general'] },
      { key: 'business', title: copy.homeRailBusinessTitle, cats: ['commercial'] },
      { key: 'cleaning', title: copy.homeRailCleaningTitle, cats: ['cleaning'] },
    ];
    return defs
      .map((d) => ({ ...d, services: services.filter((s) => d.cats.includes(s.category ?? 'general')) }))
      .filter((g) => g.services.length > 0);
  }, [services, copy]);

  if (!typeKey || !meta) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.flex} edges={['left', 'right']}>
          <CustomerPageHeader title={copy.browseFallbackTitle} variant="premium" showBack onBack={() => safeGoBack(customerRoutes.services)} />
          <ListEmptyRetry message={copy.browseUnknownType} onRetry={() => safeGoBack(customerRoutes.services)} />
        </SafeAreaView>
      </View>
    );
  }

  const badges = copy.browseBadges.split(',').map((b) => b.trim()).filter(Boolean);
  const rated = services.map(serviceDisplayRating).filter((r) => r > 0);
  const avgRating = rated.length ? rated.reduce((a, b) => a + b, 0) / rated.length : null;
  const bookings = services.reduce((n, s) => n + (s.stats?.bookingCount ?? 0), 0);
  const proof = formatSocialProof(bookings, avgRating);
  const from = services.length ? Math.min(...services.map(serviceStartPrice)) : null;
  const open = (s: Service) => appPush(sharedRoutes.service(s.id));

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.flex} edges={['left', 'right']}>
        <CustomerPageHeader
          title={copy.browseTitle.replace('{type}', meta.label)}
          subtitle={copy.browseSubtitle}
          variant="premium"
          showBack
          onBack={() => safeGoBack(customerRoutes.services)}
        />

        {loading && services.length === 0 ? (
          <CategorySkeleton />
        ) : error && services.length === 0 ? (
          <ListEmptyRetry message={error} onRetry={() => safeAsync(() => load(true))} />
        ) : (
          // A pushed screen — no tab bar to clear, only the home indicator.
          <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }} showsVerticalScrollIndicator={false}>
            {/* Summary: who we are for this pest, how well rated, and how soon we can come. */}
            <FadeSlideIn delay={stagger(0)} slideFrom={14}>
              <View style={styles.white}>
                <View style={styles.summary}>
                  <View style={[styles.art, { backgroundColor: meta.bg }]}>
                    <PestImage source={meta.image} size={58} />
                  </View>
                  <View style={styles.flex}>
                    {proof ? (
                      <View style={styles.proofRow}>
                        <Star size={12} color={colors.amber} fill={colors.amber} strokeWidth={1.5} />
                        <Text style={styles.proof} numberOfLines={1}>
                          {proof}
                        </Text>
                      </View>
                    ) : null}
                    {from != null ? (
                      <>
                        <Text style={styles.fromLabel}>{copy.serviceStartsAtLabel}</Text>
                        <Text style={styles.fromPrice}>{formatRupeeFull(from)}</Text>
                      </>
                    ) : null}
                  </View>
                </View>
                {earliest ? (
                  <View style={styles.earliest}>
                    <View style={styles.dot} />
                    <Text style={styles.earliestLabel}>{copy.serviceEarliestLabel}</Text>
                    <Text style={styles.earliestValue}>{earliest}</Text>
                  </View>
                ) : null}
                {badges.length > 0 ? (
                  <View style={styles.badgeRow}>
                    {badges.map((b) => (
                      <View key={b} style={styles.badge}>
                        <Check size={12} color={ui.brand} strokeWidth={3} />
                        <Text style={styles.badgeText}>{b}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                {/* Quick picks — one tile per treatment, like the reference's sub-category grid. */}
                {services.length > 1 ? (
                  <View style={styles.tiles}>
                    {services.slice(0, 6).map((s) => {
                      const t = (s.serviceTypes?.[0] ?? typeKey) as ServiceTypeKey;
                      const m = SERVICE_TYPE_META[t] ?? meta;
                      return (
                        <PressableScale
                          key={s.id}
                          containerStyle={styles.tile}
                          style={styles.tileInner}
                          onPress={() => open(s)}
                          accessibilityRole="button"
                          accessibilityLabel={s.name}
                        >
                          <View style={[styles.tileArt, { backgroundColor: m.bg }]}>
                            <PestImage source={m.image} size={44} />
                          </View>
                          <Text style={styles.tileText} numberOfLines={2}>
                            {s.name}
                          </Text>
                        </PressableScale>
                      );
                    })}
                  </View>
                ) : null}
              </View>
            </FadeSlideIn>

            {services.length === 0 ? (
              <View style={styles.white}>
                <EmptyState title={copy.browseEmptyTitle} message={copy.browseEmptyMessage} />
              </View>
            ) : (
              groups.map((g, gi) => (
                <FadeSlideIn key={g.key} delay={stagger(gi + 1)} slideFrom={14}>
                  <View style={styles.band} />
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle} accessibilityRole="header">
                      {groups.length > 1 ? g.title : copy.browseAvailableTitle}
                    </Text>
                    {g.services.map((s, i) => (
                      <ServiceListRow
                        key={s.id}
                        service={s}
                        detailed
                        onPress={open}
                        onBook={open}
                        showDivider={i < g.services.length - 1}
                      />
                    ))}
                  </View>
                </FadeSlideIn>
              ))
            )}

            <View style={styles.band} />
            <View style={styles.footer}>
              {services.length > 0 ? <TrustNote /> : null}
              <ListGroup>
                <ListNavRow
                  icon={AppIcons.ui.help}
                  title={copy.browseHelpTitle}
                  subtitle={copy.browseHelpSub}
                  onPress={() => appPush(customerRoutes.help)}
                />
              </ListGroup>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: ui.canvas },
  flex: { flex: 1, minWidth: 0 },
  white: { backgroundColor: colors.white, paddingHorizontal: spacing.md, paddingVertical: 18 },
  band: { height: 8, backgroundColor: ui.canvas },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  art: { width: 88, height: 88, borderRadius: radii.card, alignItems: 'center', justifyContent: 'center' },
  proofRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 9,
    height: 26,
    borderRadius: radii.pill,
    backgroundColor: '#FFF7E2',
  },
  proof: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: ui.text },
  fromLabel: { marginTop: 10, fontFamily: fonts.bodyMedium, fontSize: 12, color: ui.textSecondary },
  fromPrice: { marginTop: 1, fontFamily: fonts.displayExtra, fontSize: 24, lineHeight: 30, letterSpacing: -0.6, color: ui.text },
  earliest: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 16,
    paddingHorizontal: 14,
    height: 42,
    borderRadius: radii.control,
    backgroundColor: ui.brandSoft,
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: ui.brand },
  earliestLabel: { fontFamily: fonts.bodyBold, fontSize: 12, color: ui.brand },
  earliestValue: { flex: 1, textAlign: 'right', fontFamily: fonts.bodySemi, fontSize: 13, color: ui.text },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    height: 28,
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ui.border,
    backgroundColor: colors.white,
  },
  badgeText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: ui.textSecondary },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 20 },
  tile: { width: '30.5%' },
  tileInner: { alignItems: 'center', gap: 8 },
  tileArt: { width: '100%', aspectRatio: 1.15, borderRadius: radii.control, alignItems: 'center', justifyContent: 'center' },
  tileText: { textAlign: 'center', fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 16, color: ui.text },
  section: { backgroundColor: colors.white, paddingTop: 20 },
  sectionTitle: { ...typeScale.section, fontSize: 17, lineHeight: 23, marginHorizontal: spacing.md, color: ui.text },
  footer: { padding: spacing.md, gap: spacing.md },
});
