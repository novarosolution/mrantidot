import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
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
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { ArrowLeft, ArrowRight, Star } from 'lucide-react-native';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { PressableScale } from '@/components/ui/PressableScale';
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
  const copy = useCustomerUiCopy();
  const scrollY = useRef(new Animated.Value(0)).current;
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
      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
      >
        <View style={[styles.hero, { paddingTop: insets.top + 6 }]}>
          {/* The floating back button (overlay header) sits on this image's top-left corner. */}
          <FadeSlideIn slideFrom={14}>
            <ServiceThumb
              service={service}
              width={windowWidth - 40}
              height={Math.round((windowWidth - 40) * 0.66)}
              radius={28}
              iconSize={96}
            />
          </FadeSlideIn>
          <Text style={styles.heroTitle}>{service.name}</Text>
          {socialProof ? (
            <View style={styles.ratingRow}>
              <Star size={14} color={ui.star} fill={ui.star} strokeWidth={1.5} />
              <Text style={styles.rating}>{socialProof}</Text>
            </View>
          ) : null}
          <View style={styles.priceRow}>
            <Text style={styles.heroPrice}>₹{service.basePrice}</Text>
            <Text style={styles.priceHint}>{copy.servicePriceHint}</Text>
          </View>
        </View>

        <View style={styles.highlights}>
          {[
            { icon: AppIcons.ui.leaf, title: copy.serviceFactOneTitle, sub: copy.serviceFactOneSub },
            { icon: AppIcons.ui.clock, title: durationLabel, sub: copy.serviceFactDurationSub },
            { icon: AppIcons.ui.camera, title: copy.serviceFactThreeTitle, sub: copy.serviceFactThreeSub },
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
          <SectionKicker label={copy.serviceAboutTitle.toUpperCase()} />
          <Text style={styles.about}>{service.shortDesc}</Text>
        </View>

        {(service.stepTemplate?.length ?? 0) > 0 ? (
          <View style={styles.section}>
            <SectionKicker label={copy.serviceStepsTitle.toUpperCase()} />
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
            <SectionKicker label={copy.serviceReviewsTitle.toUpperCase()} />
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
      </Animated.ScrollView>

      <View style={[styles.topBar, { height: insets.top + 52 }]} pointerEvents="box-none">
        <Animated.View
          style={[styles.topBarBg, { opacity: scrollY.interpolate({ inputRange: [150, 210], outputRange: [0, 1], extrapolate: 'clamp' }) }]}
        />
        <View style={[styles.topBarRow, { marginTop: insets.top + 6 }]} pointerEvents="box-none">
          <PressableScale
            scaleTo={0.92}
            onPress={() => safeGoBack(customerRoutes.services)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <GlassSurface style={styles.backBtn} intensity={35} tintOpacity={0.72} float>
              <ArrowLeft size={20} color={ui.text} strokeWidth={2.2} />
            </GlassSurface>
          </PressableScale>
          <Animated.Text
            style={[styles.topBarTitle, { opacity: scrollY.interpolate({ inputRange: [190, 240], outputRange: [0, 1], extrapolate: 'clamp' }) }]}
            numberOfLines={1}
          >
            {service.name}
          </Animated.Text>
        </View>
      </View>

      <StickyActionBar>
        <View style={styles.footerRow}>
          <View>
            <Text style={styles.fromLabel}>{copy.serviceFromLabel.toUpperCase()}</Text>
            <Text style={styles.footerPrice}>₹{service.basePrice}</Text>
          </View>
          <PressableScale
            containerStyle={styles.bookBtnWrap}
            style={styles.bookBtn}
            onPress={() => appPush(sharedRoutes.bookPath(service.id))}
            accessibilityRole="button"
          >
            <Text style={styles.bookBtnText}>{copy.serviceBookButton}</Text>
            <View style={styles.bookArrow}>
              <ArrowRight size={15} color={ui.brand} strokeWidth={2.6} />
            </View>
          </PressableScale>
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
  /** Floating header: back button always, white bar + title fade in once the hero scrolls away. */
  topBar: { position: 'absolute', top: 0, left: 0, right: 0 },
  topBarBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ui.border,
  },
  topBarRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 30 },
  topBarTitle: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 16, color: ui.text, marginRight: 40 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
    minHeight: 54,
    paddingLeft: 22,
    paddingRight: 8,
    borderRadius: 27,
    backgroundColor: ui.brand,
    ...ui.shadowFloat,
  },
  bookArrow: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookBtnText: { fontFamily: fonts.displayExtra, fontSize: 15, color: colors.white },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.95 },
  pressedSm: { transform: [{ scale: 0.92 }] },
  spacing: { height: spacing.md },
});
