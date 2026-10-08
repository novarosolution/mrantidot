import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { paramString } from '@/lib/routeParams';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { StickyActionBar } from '@/components/ui/StickyActionBar';
import { CustomerPageHeader } from '@/components/kit/CustomerPageHeader';
import { GlassPanel } from '@/components/kit/GlassScreenKit';
import { ServiceThumb } from '@/components/kit/ServiceThumb';
import { FocusStatusBar } from '@/components/ui/FocusStatusBar';
import { ArrowLeft, Star } from 'lucide-react-native';
import { api, screenLoadConfig } from '@/lib/api';
import { CACHE_TTL } from '@/lib/apiCache';
import { useScreenLoad } from '@/lib/useScreenLoad';
import { formatSocialProof } from '@/lib/display';
import { serviceDisplayRating } from '@/lib/ratings';
import { safeGoBack, customerRoutes, sharedRoutes, appPush } from '@/lib/routes';
import type { Service, ServiceReview, ServiceStats } from '@/types/api';
import { colors, fonts, spacing, ui } from '@/constants/theme';

function SectionKicker({ label }: { label: string }) {
  return (
    <View style={styles.kickerRow}>
      <Text style={styles.kickerText}>{label}</Text>
    </View>
  );
}

function Stars({ count }: { count: number }) {
  return (
    <View style={styles.starsRow}>
      {[...Array(5)].map((_, i) => {
        const on = i < count;
        const c = on ? ui.brand : ui.brandSoft;
        return (
          <PremiumIcon
            key={i}
            icon={AppIcons.ui.star}
            variant="plain"
            size={11}
            color={c}
            fill={c}
          />
        );
      })}
    </View>
  );
}

export default function ServiceDetailScreen() {
  const id = paramString(useLocalSearchParams<{ id: string | string[] }>().id);
  const insets = useSafeAreaInsets();
  const [service, setService] = useState<Service | null>(null);
  const [stats, setStats] = useState<ServiceStats | null>(null);
  const [reviews, setReviews] = useState<ServiceReview[]>([]);
  const { loading, error, runLoad } = useScreenLoad(!!id);

  const { width: windowWidth } = useWindowDimensions();

  const load = useCallback(
    async (skipCache = false) => {
      if (!id) {
        throw new Error('Service not found');
      }
      const cache = skipCache ? { skipCache: true as const } : { cacheTtlMs: CACHE_TTL.services };
      const [svc, st, rev] = await Promise.allSettled([
        api.get<{ service: Service }>(`/services/${id}`, { ...screenLoadConfig, ...cache }),
        api.get<{ stats: ServiceStats }>(`/services/${id}/stats`, { ...screenLoadConfig, ...cache }),
        api.get<{ reviews: ServiceReview[] }>(`/services/${id}/reviews`, { ...screenLoadConfig, ...cache }),
      ]);
      if (svc.status === 'rejected') throw svc.reason;
      setService(svc.value.data.service);
      if (st.status === 'fulfilled') setStats(st.value.data.stats);
      if (rev.status === 'fulfilled') setReviews(rev.value.data.reviews);
    },
    [id],
  );

  useEffect(() => {
    if (!id) return;
    void runLoad(() => load());
  }, [id, load, runLoad]);

  if (!id) {
    return (
      <View style={styles.root}>
        <CustomerPageHeader
          variant="premium"
          title="Service"
          showBack
          onBack={() => safeGoBack(customerRoutes.services)}
        />
        <ListEmptyRetry
          title="Service unavailable"
          message="This service link is invalid."
          onRetry={() => safeGoBack(customerRoutes.services)}
        />
      </View>
    );
  }

  if (loading) return <Spinner fullScreen />;

  if (error || !service) {
    return (
      <View style={styles.root}>
        <CustomerPageHeader
          variant="premium"
          title="Service"
          showBack
          onBack={() => safeGoBack(customerRoutes.services)}
        />
        <ListEmptyRetry
          title="Service unavailable"
          message={error ?? 'This service is no longer available. Pull to refresh the catalog.'}
          onRetry={() => void runLoad(() => load(true))}
        />
      </View>
    );
  }

  const socialProof = formatSocialProof(stats?.bookingCount, serviceDisplayRating(service));
  const durationLabel = service.stepTemplate?.length
    ? `~${Math.max(30, service.stepTemplate.length * 15)} min`
    : '45–60 min';

  return (
    <View style={styles.root}>
      <FocusStatusBar style="dark" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, { paddingTop: insets.top + 6 }]}>
          <View style={styles.heroTopRow}>
            <Pressable
              style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
              onPress={() => safeGoBack(customerRoutes.services)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ArrowLeft size={22} color={ui.text} strokeWidth={2.1} />
            </Pressable>
          </View>
          <ServiceThumb
            service={service}
            width={windowWidth - 40}
            height={196}
            radius={22}
            iconSize={92}
          />
          <Text style={styles.heroTitle}>{service.name}</Text>
          {socialProof ? (
            <View style={styles.ratingRow}>
              <Star size={14} color={ui.star} fill={ui.star} strokeWidth={1.5} />
              <Text style={styles.rating}>{socialProof}</Text>
            </View>
          ) : null}
          <View style={styles.priceRow}>
            <Text style={styles.heroPrice}>₹{service.basePrice}</Text>
            <Text style={styles.priceHint}>starting · per visit</Text>
          </View>
        </View>

        <View style={styles.highlights}>
          {[
            { icon: AppIcons.ui.leaf, title: 'Eco-safe', sub: 'Kid & pet friendly' },
            { icon: AppIcons.ui.clock, title: durationLabel, sub: 'Visit duration' },
            { icon: AppIcons.ui.camera, title: 'Photo proof', sub: 'Every step' },
          ].map((h, i) => (
            <View key={h.sub} style={[styles.highlight, i > 0 && styles.highlightBorder]}>
              <PremiumIcon icon={h.icon} variant="plain" size={18} color={ui.brand} strokeWidth={2.1} />
              <Text style={styles.highlightTitle} numberOfLines={1}>
                {h.title}
              </Text>
              <Text style={styles.highlightSub} numberOfLines={1}>
                {h.sub}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <SectionKicker label="ABOUT THIS SERVICE" />
          <Text style={styles.about}>{service.shortDesc}</Text>
        </View>

        {(service.stepTemplate?.length ?? 0) > 0 ? (
          <View style={styles.section}>
            <SectionKicker label="SERVICE STEPS" />
            <GlassPanel style={styles.stepsCard} padded={false} tone="clear" intensity={44}>
              {service.stepTemplate!.map((t, i) => (
                <View key={t} style={[styles.stepRow, i > 0 && styles.stepRowBorder]}>
                  <View style={styles.stepNum}>
                    <Text style={styles.stepNumText}>{String(i + 1).padStart(2, '0')}</Text>
                  </View>
                  <Text style={styles.stepText}>{t}</Text>
                  <PremiumIcon icon={AppIcons.ui.check} variant="plain" size={15} color={ui.brand} strokeWidth={2.6} />
                </View>
              ))}
            </GlassPanel>
          </View>
        ) : null}

        {reviews.length > 0 ? (
          <View style={styles.section}>
            <SectionKicker label="RECENT REVIEWS" />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.reviewsRail}
              contentContainerStyle={styles.reviewsRailInner}
            >
              {reviews.map((r) => (
                <View key={r.id} style={styles.reviewCard}>
                  <View style={styles.reviewHead}>
                    <View style={styles.reviewAvatar}>
                      <Text style={styles.reviewInitial}>{r.customerName[0]}</Text>
                    </View>
                    <View style={styles.reviewNameCol}>
                      <Text style={styles.reviewName}>{r.customerName}</Text>
                      <Stars count={r.stars} />
                    </View>
                  </View>
                  <Text style={styles.reviewText} numberOfLines={4}>
                    {r.comment?.trim() || (r.tags ?? []).join(', ')}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        ) : null}
      </ScrollView>

      <StickyActionBar>
        <View style={styles.footerRow}>
          <View>
            <Text style={styles.fromLabel}>FROM</Text>
            <Text style={styles.footerPrice}>₹{service.basePrice}</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.bookBtnWrap, pressed && styles.pressed]}
            onPress={() => appPush(sharedRoutes.bookPath(service.id))}
          >
            <View style={styles.bookBtn}>
              <Text style={styles.bookBtnText}>Book now</Text>
              <PremiumIcon icon={AppIcons.ui.arrowRight} variant="plain" size={16} color={colors.white} strokeWidth={2.4} fill="none" />
            </View>
          </Pressable>
        </View>
      </StickyActionBar>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: ui.surfaceMuted },
  scroll: { flex: 1 },
  hero: {
    paddingHorizontal: 20,
    paddingBottom: 4,
    backgroundColor: colors.white,
  },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  backBtn: {
    width: 40,
    height: 40,
    marginLeft: -8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnPressed: { backgroundColor: ui.surfaceMuted },
  heroTitle: {
    marginTop: 18,
    fontFamily: fonts.displayExtra,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.6,
    color: ui.text,
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  rating: { fontFamily: fonts.bodySemi, fontSize: 13.5, color: ui.text },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 7, marginTop: 6 },
  heroPrice: {
    fontFamily: fonts.displayExtra,
    fontSize: 22,
    letterSpacing: -0.4,
    color: ui.text,
  },
  priceHint: { fontFamily: fonts.body, fontSize: 13, color: ui.textSecondary },
  highlights: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
  },
  highlight: { flex: 1, alignItems: 'center', gap: 4, paddingHorizontal: 6 },
  highlightBorder: { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: ui.border },
  highlightTitle: { marginTop: 2, fontFamily: fonts.bodyBold, fontSize: 13, color: ui.text },
  highlightSub: { fontFamily: fonts.body, fontSize: 11, color: ui.textSecondary },
  section: { paddingHorizontal: 20, paddingTop: 22 },
  kickerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  kickerText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1.4,
    color: ui.textTertiary,
  },
  about: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: ui.textSecondary,
    lineHeight: 22,
    marginTop: 9,
  },
  stepsCard: {
    marginTop: 11,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
  stepRowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: ui.border },
  stepNum: {
    width: 30,
    height: 30,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ui.brandSoft,
  },
  stepNumText: { fontFamily: fonts.bodyBold, fontSize: 11.5, color: ui.brand },
  stepText: { flex: 1, fontFamily: fonts.bodySemi, fontSize: 13.5, color: ui.text },
  reviewsRail: { marginHorizontal: -20, marginTop: 11 },
  reviewsRailInner: { paddingHorizontal: 20, gap: 10, paddingBottom: 4 },
  reviewCard: {
    width: 240,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.border,
    borderRadius: 16,
    padding: 14,
  },
  reviewHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ui.brand,
  },
  reviewInitial: { fontFamily: fonts.displayExtra, fontSize: 14, color: colors.white },
  reviewNameCol: { gap: 2 },
  reviewName: { fontFamily: fonts.bodyBold, fontSize: 13, color: ui.text },
  starsRow: { flexDirection: 'row', gap: 2 },
  reviewText: {
    fontFamily: fonts.body,
    fontSize: 12.5,
    color: ui.textSecondary,
    lineHeight: 18,
    marginTop: 9,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  fromLabel: { fontFamily: fonts.bodyBold, fontSize: 9.5, letterSpacing: 1, color: ui.textTertiary },
  footerPrice: { fontFamily: fonts.displayExtra, fontSize: 22, color: ui.text },
  bookBtnWrap: { flex: 1 },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: ui.brand,
  },
  bookBtnText: { fontFamily: fonts.displayExtra, fontSize: 15, color: colors.white },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.95 },
  pressedSm: { transform: [{ scale: 0.92 }] },
  spacing: { height: spacing.md },
});
