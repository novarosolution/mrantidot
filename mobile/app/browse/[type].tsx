import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Star } from 'lucide-react-native';
import { safeGoBack, customerRoutes, sharedRoutes, appPush } from '@/lib/routes';
import { CustomerPageHeader } from '@/components/kit/CustomerPageHeader';
import { TAB_BAR_SCROLL_PAD } from '@/components/kit/GlassScreenKit';
import { ListGroup, ListNavRow } from '@/components/kit/ListGroup';
import { PestImage } from '@/components/kit/ServiceThumb';
import { ServiceListRow } from '@/components/kit/ServiceListRow';
import { TrustNote } from '@/components/kit/TrustNote';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
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
import { colors, fonts, spacing, ui } from '@/constants/theme';

export default function ServicesByTypeScreen() {
  const { type: rawType } = useLocalSearchParams<{ type: string }>();
  const typeKey = rawType && isServiceTypeKey(rawType) ? rawType : null;
  const meta = typeKey ? SERVICE_TYPE_META[typeKey] : null;
  const copy = useCustomerUiCopy();
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
        setError(getApiErrorMessage(err, 'Could not load services'));
      } finally {
        setLoading(false);
      }
    },
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
          <CustomerPageHeader title="Browse" variant="premium" showBack onBack={() => safeGoBack(customerRoutes.services)} />
          <ListEmptyRetry message="Unknown service type" onRetry={() => safeGoBack(customerRoutes.services)} />
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
          <Spinner />
        ) : error && services.length === 0 ? (
          <ListEmptyRetry message={error} onRetry={() => safeAsync(() => load(true))} />
        ) : (
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* Summary: who we are for this pest, how well rated, and how soon we can come. */}
            <View style={styles.white}>
              <View style={styles.summary}>
                <View style={[styles.art, { backgroundColor: meta.bg }]}>
                  <PestImage source={meta.image} size={58} />
                </View>
                <View style={styles.flex}>
                  {proof ? (
                    <View style={styles.proofRow}>
                      <Star size={13} color={ui.star} fill={ui.star} strokeWidth={1.5} />
                      <Text style={styles.proof}>{proof}</Text>
                    </View>
                  ) : null}
                  {from != null ? (
                    <Text style={styles.from}>
                      Starts at <Text style={styles.fromStrong}>{formatRupeeFull(from)}</Text>
                    </Text>
                  ) : null}
                </View>
                {earliest ? (
                  <View style={styles.earliest}>
                    <View style={styles.earliestHead}>
                      <View style={styles.dot} />
                      <Text style={styles.earliestLabel}>Earliest</Text>
                    </View>
                    <Text style={styles.earliestValue}>{earliest}</Text>
                  </View>
                ) : null}
              </View>
              {badges.length > 0 ? <Text style={styles.badges}>{badges.join('  ·  ')}</Text> : null}

              {/* Quick picks — one tile per treatment, like the reference's sub-category grid. */}
              {services.length > 1 ? (
                <View style={styles.tiles}>
                  {services.slice(0, 6).map((s) => {
                    const t = (s.serviceTypes?.[0] ?? typeKey) as ServiceTypeKey;
                    const m = SERVICE_TYPE_META[t] ?? meta;
                    return (
                      <Pressable
                        key={s.id}
                        style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
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
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}
            </View>

            {services.length === 0 ? (
              <View style={styles.white}>
                <EmptyState title="No services yet" message="Nothing listed for this type right now." />
              </View>
            ) : (
              groups.map((g) => (
                <View key={g.key}>
                  <View style={styles.band} />
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{groups.length > 1 ? g.title : 'Available treatments'}</Text>
                    {g.services.map((s, i) => (
                      <ServiceListRow
                        key={s.id}
                        service={s}
                        detailed
                        onPress={() => open(s)}
                        onBook={() => open(s)}
                        showDivider={i < g.services.length - 1}
                      />
                    ))}
                  </View>
                </View>
              ))
            )}

            <View style={styles.band} />
            <View style={styles.footer}>
              {services.length > 0 ? <TrustNote /> : null}
              <ListGroup>
                <ListNavRow
                  icon={AppIcons.ui.help}
                  title="Not sure which service?"
                  subtitle="Talk to our team — we'll point you to the right treatment"
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
  root: { flex: 1, backgroundColor: ui.surfaceMuted },
  flex: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.8 },
  scroll: { paddingBottom: TAB_BAR_SCROLL_PAD },
  white: { backgroundColor: colors.white, paddingHorizontal: spacing.md, paddingVertical: 18 },
  band: { height: 8, backgroundColor: ui.surfaceMuted },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  art: { width: 72, height: 72, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  proofRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  proof: {
    fontFamily: fonts.bodySemi,
    fontSize: 13.5,
    color: ui.text,
    textDecorationLine: 'underline',
    textDecorationStyle: 'dotted',
  },
  from: { marginTop: 5, fontFamily: fonts.bodyMedium, fontSize: 13.5, color: ui.textSecondary },
  fromStrong: { fontFamily: fonts.bodyBold, color: ui.text },
  earliest: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ui.border,
  },
  earliestHead: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: ui.brand },
  earliestLabel: { fontFamily: fonts.bodyBold, fontSize: 11.5, color: ui.brand },
  earliestValue: { marginTop: 2, fontFamily: fonts.bodySemi, fontSize: 12.5, color: ui.text },
  badges: { marginTop: 14, fontFamily: fonts.bodyMedium, fontSize: 12.5, color: ui.textSecondary },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 18 },
  tile: { width: '30.5%', alignItems: 'center', gap: 8 },
  tileArt: { width: '100%', aspectRatio: 1.15, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  tileText: { textAlign: 'center', fontFamily: fonts.bodyMedium, fontSize: 12.5, lineHeight: 16, color: ui.text },
  section: { backgroundColor: colors.white, paddingTop: 20 },
  sectionTitle: {
    marginHorizontal: spacing.md,
    fontFamily: fonts.displaySemi,
    fontSize: 20,
    letterSpacing: -0.4,
    color: ui.text,
  },
  footer: { padding: spacing.md, gap: spacing.md },
});
