import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, Share, StyleSheet, Text, View, type ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Check, CircleCheck, Info, Share2, ShieldCheck, Star, X } from 'lucide-react-native';
import { paramString } from '@/lib/routeParams';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { StickyActionBar } from '@/components/ui/StickyActionBar';
import { CustomerPageHeader } from '@/components/kit/CustomerPageHeader';
import { PestImage } from '@/components/kit/ServiceThumb';
import { FocusStatusBar } from '@/components/ui/FocusStatusBar';
import { PressableScale } from '@/components/ui/PressableScale';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { useReducedMotion } from '@/lib/a11yPrefs';
import { haptic, motion, stagger } from '@/lib/motion';
import { AppIcons } from '@/constants/appIcons';
import { SERVICE_TYPE_META } from '@/constants/serviceTypeMeta';
import { useAppContent } from '@/context/AppContentContext';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { fillCopy } from '@/constants/customerUiCopy';
import { api, screenLoadConfig } from '@/lib/api';
import { CACHE_TTL } from '@/lib/apiCache';
import { useScreenLoad } from '@/lib/useScreenLoad';
import { formatSocialProof } from '@/lib/display';
import { serviceDisplayRating } from '@/lib/ratings';
import { earliestSlotLabel } from '@/lib/earliestSlot';
import { formatDuration, serviceDurationMins, serviceStartPrice } from '@/lib/serviceDisplay';
import { formatRupeeFull, plural } from '@/components/kit/format';
import { safeGoBack, customerRoutes, sharedRoutes, appPush } from '@/lib/routes';
import type { Service, ServiceReview, ServiceStats, ServiceTypeKey } from '@/types/api';
import { colors, fonts, ui } from '@/constants/theme';
import { ServiceDetailSkeleton } from '@/components/kit/ScreenSkeletons';

const PAD = 16;

function reviewDate(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <View style={styles.sectionHead}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {sub ? <Text style={styles.sectionSub}>{sub}</Text> : null}
    </View>
  );
}

/** Grey band between sections — the Urban-style page rhythm. */
function Band() {
  return <View style={styles.band} />;
}

export default function ServiceDetailScreen() {
  const id = paramString(useLocalSearchParams<{ id: string | string[] }>().id);
  const insets = useSafeAreaInsets();
  const copy = useCustomerUiCopy();
  const { content } = useAppContent();
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const includedY = useRef(0);
  const optionsY = useRef(0);
  const [service, setService] = useState<Service | null>(null);
  const [stats, setStats] = useState<ServiceStats | null>(null);
  const [reviews, setReviews] = useState<ServiceReview[]>([]);
  const [optionKey, setOptionKey] = useState<string | null>(null);
  const { loading, error, runLoad } = useScreenLoad(!!id);
  const earliest = useMemo(() => earliestSlotLabel(), []);
  const reducedMotion = useReducedMotion();
  /** Hero art pops in once the service has loaded. */
  const artIn = useRef(new Animated.Value(0)).current;

  const load = useCallback(
    async (skipCache = false) => {
      if (!id) throw new Error('Service not found');
      const cache = skipCache ? { skipCache: true as const } : { cacheTtlMs: CACHE_TTL.services };
      const [svc, st, rev] = await Promise.allSettled([
        api.get<{ service: Service }>(`/services/${id}`, { ...screenLoadConfig, ...cache }),
        api.get<{ stats: ServiceStats }>(`/services/${id}/stats`, { ...screenLoadConfig, ...cache }),
        api.get<{ reviews: ServiceReview[] }>(`/services/${id}/reviews`, { ...screenLoadConfig, ...cache }),
      ]);
      if (svc.status === 'rejected') throw svc.reason;
      const s = svc.value.data.service;
      setService(s);
      // The cheapest size is picked up front so the price bar is never empty.
      setOptionKey((prev) => (prev && s.options?.some((o) => o.key === prev) ? prev : (s.options?.[0]?.key ?? null)));
      if (st.status === 'fulfilled') setStats(st.value.data.stats);
      if (rev.status === 'fulfilled') setReviews(rev.value.data.reviews);
    },
    [id],
  );

  useEffect(() => {
    if (!id) return;
    void runLoad(() => load());
  }, [id, load, runLoad]);

  useEffect(() => {
    if (!service) return;
    if (reducedMotion) {
      artIn.setValue(1);
      return;
    }
    Animated.spring(artIn, { toValue: 1, ...motion.springSnappy, useNativeDriver: true }).start();
  }, [service, reducedMotion, artIn]);

  if (!id || (!loading && (error || !service))) {
    return (
      <View style={styles.root}>
        <CustomerPageHeader variant="premium" title={copy.serviceUnavailableTitle} showBack onBack={() => safeGoBack(customerRoutes.services)} />
        <ListEmptyRetry
          title={copy.serviceUnavailableTitle}
          message={!id ? 'This service link is invalid.' : (error ?? 'This service is no longer available.')}
          onRetry={() => (id ? void runLoad(() => load(true)) : safeGoBack(customerRoutes.services))}
        />
      </View>
    );
  }

  if (loading || !service) return <ServiceDetailSkeleton />;

  const brand = content.branding.name?.trim() || 'Mr Antidot';
  const type = (service.serviceTypes?.[0] ?? 'general') as ServiceTypeKey;
  const meta = SERVICE_TYPE_META[type] ?? SERVICE_TYPE_META.general;
  const rating = serviceDisplayRating(service);
  const socialProof = formatSocialProof(stats?.bookingCount, rating);
  const options = service.options ?? [];
  const selected = options.find((o) => o.key === optionKey);
  const price = selected?.price ?? serviceStartPrice(service);
  const duration = formatDuration(serviceDurationMins(service));
  const included = service.included ?? [];
  const excluded = service.excluded ?? [];
  const notes = service.notes ?? [];
  const steps = service.stepTemplate ?? [];
  const trustBadges = (content.trust.badges ?? []).map((b) => b.trim()).filter(Boolean);
  const guarantee = content.trust.guaranteeText?.trim();

  const counts = [5, 4, 3, 2, 1].map((n) => ({ n, count: reviews.filter((r) => Math.round(r.stars) === n).length }));
  const maxCount = Math.max(1, ...counts.map((c) => c.count));
  const reviewTotal = Math.max(stats?.reviewCount ?? 0, reviews.length);

  const scrollTo = (y: number) => scrollViewRef.current?.scrollTo({ y: Math.max(0, y - insets.top - 60), animated: true });

  function book() {
    if (!service) return;
    if (options.length > 0 && !selected) {
      scrollTo(optionsY.current);
      return;
    }
    appPush(sharedRoutes.book(service.id, selected ? { option: selected.key } : undefined));
  }

  function shareService() {
    if (!service) return;
    void Share.share({
      message: fillCopy(copy.serviceShareMessage, {
        service: service.name,
        brand,
        price: formatRupeeFull(serviceStartPrice(service)),
      }),
    }).catch(() => undefined);
  }

  const headerFade = scrollY.interpolate({ inputRange: [140, 200], outputRange: [0, 1], extrapolate: 'clamp' });
  // Hero stretches to cover the pull-down gap and drifts slower than the page on scroll (parallax).
  const heroH = insets.top + 60 + 170 + 18;
  const heroMotion = reducedMotion
    ? undefined
    : {
        transform: [
          {
            translateY: scrollY.interpolate({
              inputRange: [-200, 0, heroH],
              outputRange: [-100, 0, heroH * 0.35],
              extrapolateRight: 'clamp',
            }),
          },
          { scale: scrollY.interpolate({ inputRange: [-200, 0], outputRange: [1 + 200 / heroH, 1], extrapolateRight: 'clamp' }) },
        ],
      };

  return (
    <View style={styles.root}>
      <FocusStatusBar style="dark" />
      <Animated.ScrollView
        ref={scrollViewRef}
        style={styles.flex}
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
      >
        {/* Hero art in the pest type's colour; the floating back/share buttons sit on it. */}
        <Animated.View style={[styles.hero, { paddingTop: insets.top + 60, backgroundColor: meta.bg }, heroMotion]}>
          <Animated.View
            style={[
              styles.heroArt,
              {
                opacity: artIn,
                transform: [{ scale: artIn.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] }) }],
              },
            ]}
          >
            <PestImage source={meta.image} size={150} />
          </Animated.View>
        </Animated.View>

        <FadeSlideIn delay={stagger(1)} slideFrom={16}>
          <View style={styles.white}>
            <View style={styles.titleRow}>
              <View style={styles.flex}>
                <Text style={styles.title}>{service.name}</Text>
                {socialProof ? (
                  <View style={styles.ratingRow}>
                    <Star size={13} color={ui.star} fill={ui.star} strokeWidth={1.5} />
                    <Text style={styles.ratingText}>{socialProof}</Text>
                  </View>
                ) : null}
              </View>
              {earliest ? (
                <View style={styles.earliest}>
                  <View style={styles.earliestHead}>
                    <View style={styles.earliestDot} />
                    <Text style={styles.earliestLabel}>{copy.serviceEarliestLabel}</Text>
                  </View>
                  <Text style={styles.earliestValue}>{earliest}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.priceLine}>
              {copy.serviceStartsAtLabel} <Text style={styles.priceStrong}>{formatRupeeFull(serviceStartPrice(service))}</Text>
              {'  ·  '}
              {duration}
            </Text>
            {service.shortDesc ? <Text style={styles.about}>{service.shortDesc}</Text> : null}
            <View style={styles.facts}>
              {[
                { icon: AppIcons.ui.leaf, label: `${copy.serviceFactOneTitle} · ${copy.serviceFactOneSub}` },
                { icon: AppIcons.ui.camera, label: `${copy.serviceFactThreeTitle} · ${copy.serviceFactThreeSub}` },
              ].map((f) => (
                <View key={f.label} style={styles.fact}>
                  <f.icon size={14} color={ui.brand} strokeWidth={2.2} />
                  <Text style={styles.factText} numberOfLines={1}>
                    {f.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

        </FadeSlideIn>

        {options.length > 0 ? (
          <View
            onLayout={(e) => {
              optionsY.current = e.nativeEvent.layout.y;
            }}
          >
            <Band />
            <FadeSlideIn delay={stagger(2)} slideFrom={16}>
              <View style={styles.white}>
                <SectionTitle title={copy.serviceOptionsHeading} />
                <View style={styles.reqHead}>
                  <View style={styles.reqNum}>
                    <Text style={styles.reqNumText}>1</Text>
                  </View>
                  <Text style={styles.reqTitle}>{service.optionsTitle || 'Size of home'}</Text>
                </View>
                <View style={styles.optionGrid}>
                  {options.map((o) => {
                    const on = o.key === optionKey;
                    return (
                      <Pressable
                        key={o.key}
                        onPress={() => {
                          if (o.key !== optionKey) haptic('select');
                          setOptionKey(o.key);
                        }}
                        style={({ pressed }) => [
                          styles.option,
                          // 2 or 4 sizes read best as a 2-column grid; otherwise three across.
                          options.length === 2 || options.length === 4 ? styles.optionHalf : styles.optionThird,
                          on && styles.optionOn,
                          pressed && styles.pressed,
                        ]}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: on }}
                        accessibilityLabel={`${o.label}, ${formatRupeeFull(o.price)}`}
                      >
                        <Text style={[styles.optionLabel, on && styles.optionLabelOn]} numberOfLines={2}>
                          {o.label}
                        </Text>
                        <Text style={styles.optionPrice}>{formatRupeeFull(o.price)}</Text>
                        {o.note ? (
                          <Text style={styles.optionNote} numberOfLines={2}>
                            {o.note}
                          </Text>
                        ) : null}
                        {on ? (
                          <View style={styles.optionTick}>
                            <Check size={11} color={colors.white} strokeWidth={3.2} />
                          </View>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
                {included.length > 0 ? (
                  <Pressable onPress={() => scrollTo(includedY.current)} hitSlop={6} accessibilityRole="link">
                    <Text style={styles.link}>{copy.serviceIncludedLink}</Text>
                  </Pressable>
                ) : null}
              </View>
            </FadeSlideIn>
          </View>
        ) : null}

        {notes.length > 0 ? (
          <>
            <Band />
            <View style={styles.white}>
              <SectionTitle title={copy.serviceNotesTitle} />
              {notes.map((n) => (
                <View key={n} style={styles.noteRow}>
                  <Info size={17} color={ui.textTertiary} strokeWidth={2} />
                  <Text style={styles.noteText}>{n}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {included.length > 0 ? (
          <>
            <Band />
            <View
              style={styles.white}
              onLayout={(e) => {
                includedY.current = e.nativeEvent.layout.y;
              }}
            >
              <SectionTitle title={copy.serviceIncludedTitle} />
              <View style={styles.tileGrid}>
                {included.map((item) => (
                  <View key={item} style={styles.tile}>
                    <CircleCheck size={20} color={ui.brand} strokeWidth={2.1} />
                    <Text style={styles.tileText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        ) : null}

        {steps.length > 0 ? (
          <>
            <Band />
            <View style={styles.white}>
              <SectionTitle title={copy.serviceStepsTitle} sub={fillCopy(copy.serviceStepsSub, { duration })} />
              {steps.map((t, i) => (
                <View key={`${t}-${i}`} style={styles.stepRow}>
                  <View style={styles.stepRail}>
                    <View style={styles.stepNum}>
                      <Text style={styles.stepNumText}>{i + 1}</Text>
                    </View>
                    {i < steps.length - 1 ? <View style={styles.stepLine} /> : null}
                  </View>
                  <Text style={styles.stepText}>{t}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {excluded.length > 0 ? (
          <>
            <Band />
            <View style={styles.white}>
              <SectionTitle title={copy.serviceExcludedTitle} />
              {excluded.map((x) => (
                <View key={x} style={styles.noteRow}>
                  <X size={18} color={colors.error} strokeWidth={2.4} />
                  <Text style={styles.noteText}>{x}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {trustBadges.length > 0 || guarantee ? (
          <>
            <Band />
            <View style={styles.white}>
              <SectionTitle title={fillCopy(copy.serviceWhyTitle, { brand })} />
              <View style={styles.trustCard}>
                <View style={styles.flex}>
                  {trustBadges.slice(0, 4).map((b) => (
                    <View key={b} style={styles.trustRow}>
                      <ShieldCheck size={16} color={ui.brand} strokeWidth={2.2} />
                      <Text style={styles.trustText}>{b}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.trustSeal}>
                  <ShieldCheck size={34} color={colors.white} strokeWidth={2} />
                </View>
              </View>
              {guarantee ? <Text style={styles.guarantee}>{guarantee}</Text> : null}
            </View>
          </>
        ) : null}

        {reviews.length > 0 ? (
          <>
            <Band />
            <View style={styles.white}>
              <View style={styles.ratingSummary}>
                <View style={styles.ratingBig}>
                  <View style={styles.ratingBigRow}>
                    <Star size={22} color={ui.star} fill={ui.star} strokeWidth={1.5} />
                    <Text style={styles.ratingBigText}>{(rating ?? 0).toFixed(1)}</Text>
                  </View>
                  <Text style={styles.ratingBigSub}>{plural(reviewTotal, 'review')}</Text>
                </View>
                <View style={styles.bars}>
                  {counts.map((c) => (
                    <View key={c.n} style={styles.barRow}>
                      <Text style={styles.barLabel}>{c.n}★</Text>
                      <View style={styles.barTrack}>
                        <View style={[styles.barFill, { width: `${(c.count / maxCount) * 100}%` }]} />
                      </View>
                      <Text style={styles.barCount}>{c.count}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <Text style={styles.reviewsHeading}>{copy.serviceReviewsTitle}</Text>
              {reviews.slice(0, 5).map((r, i) => {
                const text = r.comment?.trim() || (r.tags ?? []).join(', ');
                const when = reviewDate(r.createdAt);
                return (
                  <View key={r.id} style={[styles.review, i > 0 && styles.reviewBorder]}>
                    <View style={styles.reviewHead}>
                      <View style={styles.flex}>
                        <Text style={styles.reviewName}>{r.customerName}</Text>
                        {when ? <Text style={styles.reviewDate}>{when}</Text> : null}
                      </View>
                      <View style={styles.reviewStars}>
                        <Star size={11} color={colors.white} fill={colors.white} strokeWidth={1.5} />
                        <Text style={styles.reviewStarsText}>{r.stars}</Text>
                      </View>
                    </View>
                    {text ? <Text style={styles.reviewText}>{text}</Text> : null}
                  </View>
                );
              })}
            </View>
          </>
        ) : null}

        <Band />
        <View style={[styles.white, styles.shareBlock]}>
          <Text style={styles.shareText}>{copy.serviceShareText}</Text>
          <PressableScale
            containerStyle={styles.shareBtnWrap}
            style={styles.shareBtn}
            onPress={shareService}
            accessibilityRole="button"
          >
            <Text style={styles.shareBtnText}>{copy.serviceShareButton}</Text>
            <Share2 size={15} color={ui.brand} strokeWidth={2.4} />
          </PressableScale>
        </View>
      </Animated.ScrollView>

      {/* Floating header: buttons always on, white bar + title fade in once the hero scrolls away. */}
      <View style={[styles.topBar, { height: insets.top + 56 }]} pointerEvents="box-none">
        <Animated.View style={[styles.topBarBg, { opacity: headerFade }]} />
        <View style={[styles.topBarRow, { marginTop: insets.top + 6 }]} pointerEvents="box-none">
          <PressableScale
            scaleTo={0.92}
            style={styles.circleBtn}
            onPress={() => safeGoBack(customerRoutes.services)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={20} color={ui.text} strokeWidth={2.2} />
          </PressableScale>
          <Animated.Text style={[styles.topBarTitle, { opacity: headerFade }]} numberOfLines={1}>
            {service.name}
          </Animated.Text>
          <PressableScale
            scaleTo={0.92}
            style={styles.circleBtn}
            onPress={shareService}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Share this service"
          >
            <Share2 size={18} color={ui.text} strokeWidth={2.2} />
          </PressableScale>
        </View>
      </View>

      <StickyActionBar>
        <View style={styles.footerRow}>
          <View style={styles.flex}>
            <Text style={styles.footerPrice}>{formatRupeeFull(price)}</Text>
            <Text style={styles.footerSub} numberOfLines={1}>
              {selected ? `${selected.label} · ${duration}` : `${copy.serviceFromLabel} · ${duration}`}
            </Text>
          </View>
          <PressableScale containerStyle={styles.bookWrap} style={styles.bookBtn} onPress={book} haptic="tap" accessibilityRole="button">
            <Text style={styles.bookText}>{copy.serviceBookButton}</Text>
          </PressableScale>
        </View>
      </StickyActionBar>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: ui.surfaceMuted },
  flex: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.85 },
  hero: { alignItems: 'center', paddingBottom: 18 },
  heroArt: {
    width: 190,
    height: 170,
    alignItems: 'center',
    justifyContent: 'center',
  },
  white: { backgroundColor: colors.white, paddingHorizontal: PAD, paddingVertical: 20 },
  band: { height: 8, backgroundColor: ui.surfaceMuted },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  title: { fontFamily: fonts.displaySemi, fontSize: 25, lineHeight: 31, letterSpacing: -0.6, color: ui.text },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  ratingText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13.5,
    color: ui.textSecondary,
  },
  earliest: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: colors.white,
    alignItems: 'flex-start',
  },
  earliestHead: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  earliestDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: ui.brand },
  earliestLabel: { fontFamily: fonts.bodyBold, fontSize: 11.5, color: ui.brand },
  earliestValue: { marginTop: 2, fontFamily: fonts.bodySemi, fontSize: 12.5, color: ui.text },
  priceLine: { marginTop: 12, fontFamily: fonts.bodyMedium, fontSize: 14, color: ui.textSecondary },
  priceStrong: { fontFamily: fonts.bodyBold, color: ui.text },
  about: { marginTop: 10, fontFamily: fonts.body, fontSize: 14, lineHeight: 21, color: ui.textSecondary },
  facts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  fact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    height: 30,
    borderRadius: 15,
    backgroundColor: ui.brandSoft,
  },
  factText: { fontFamily: fonts.bodySemi, fontSize: 12, color: ui.text },
  sectionHead: { marginBottom: 14 },
  sectionTitle: { fontFamily: fonts.displaySemi, fontSize: 20, letterSpacing: -0.4, color: ui.text },
  sectionSub: { marginTop: 3, fontFamily: fonts.body, fontSize: 13, color: ui.textSecondary },
  reqHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  reqNum: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: ui.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reqNumText: { fontFamily: fonts.bodyBold, fontSize: 12, color: ui.textSecondary },
  reqTitle: { fontFamily: fonts.bodySemi, fontSize: 15.5, color: ui.text },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  option: {
    minHeight: 74,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: colors.white,
  },
  optionHalf: { width: '48.4%' },
  optionThird: { width: '31.6%' },
  optionOn: { borderColor: ui.brand, borderWidth: 1.5, backgroundColor: ui.brandSoft },
  optionLabel: { fontFamily: fonts.bodySemi, fontSize: 13, color: ui.textSecondary, paddingRight: 14 },
  optionLabelOn: { color: ui.text },
  optionPrice: { marginTop: 6, fontFamily: fonts.bodyBold, fontSize: 15, color: ui.text },
  optionNote: { marginTop: 3, fontFamily: fonts.body, fontSize: 11.5, color: ui.textTertiary },
  optionTick: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: ui.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  link: {
    marginTop: 16,
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: ui.brand,
    textDecorationLine: 'underline',
  },
  noteRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 7 },
  noteText: { flex: 1, fontFamily: fonts.body, fontSize: 14.5, lineHeight: 21, color: ui.text },
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: {
    width: '48.4%',
    minHeight: 92,
    padding: 12,
    gap: 8,
    borderRadius: 16,
    backgroundColor: ui.surfaceMuted,
  },
  tileText: { fontFamily: fonts.bodySemi, fontSize: 13.5, lineHeight: 19, color: ui.text },
  stepRow: { flexDirection: 'row', gap: 12 },
  stepRail: { width: 26, alignItems: 'center' },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: ui.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.white },
  stepLine: { width: 2, flex: 1, minHeight: 14, backgroundColor: ui.brandSoft, marginVertical: 3 },
  stepText: { flex: 1, paddingTop: 3, paddingBottom: 16, fontFamily: fonts.bodySemi, fontSize: 14.5, color: ui.text },
  trustCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 18,
    backgroundColor: ui.brandSoft,
  },
  trustRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 },
  trustText: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 14, color: ui.text },
  trustSeal: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: ui.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guarantee: { marginTop: 12, fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: ui.textSecondary },
  ratingSummary: { flexDirection: 'row', alignItems: 'center', gap: 18, marginBottom: 18 },
  ratingBig: { width: 92 },
  ratingBigRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ratingBigText: { fontFamily: fonts.displaySemi, fontSize: 30, letterSpacing: -0.8, color: ui.text },
  ratingBigSub: { marginTop: 2, fontFamily: fonts.bodyMedium, fontSize: 13, color: ui.textSecondary },
  bars: { flex: 1, gap: 5 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barLabel: { width: 24, fontFamily: fonts.bodySemi, fontSize: 12, color: ui.text },
  barTrack: { flex: 1, height: 5, borderRadius: 3, backgroundColor: ui.surfaceMuted, overflow: 'hidden' },
  barFill: { height: 5, borderRadius: 3, backgroundColor: ui.text },
  barCount: { width: 24, textAlign: 'right', fontFamily: fonts.body, fontSize: 12, color: ui.textSecondary },
  reviewsHeading: { fontFamily: fonts.displaySemi, fontSize: 18, letterSpacing: -0.3, color: ui.text, marginBottom: 4 },
  review: { paddingVertical: 14 },
  reviewBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: ui.border },
  reviewHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  reviewName: { fontFamily: fonts.bodyBold, fontSize: 15, color: ui.text },
  reviewDate: { marginTop: 2, fontFamily: fonts.body, fontSize: 12, color: ui.textTertiary },
  reviewStars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    height: 22,
    borderRadius: 6,
    backgroundColor: ui.brand,
  },
  reviewStarsText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.white },
  reviewText: { marginTop: 8, fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: ui.text },
  shareBlock: { alignItems: 'center', gap: 12 },
  shareText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: ui.textSecondary },
  shareBtnWrap: { alignSelf: 'stretch' },
  shareBtn: {
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ui.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  shareBtnText: { fontFamily: fonts.bodyBold, fontSize: 15, color: ui.brand },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0 },
  topBarBg: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ui.border,
  },
  topBarRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: PAD },
  topBarTitle: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 16, color: ui.text },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...ui.shadow,
  },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  footerPrice: { fontFamily: fonts.displaySemi, fontSize: 21, letterSpacing: -0.4, color: ui.text },
  footerSub: { marginTop: 1, fontFamily: fonts.bodyMedium, fontSize: 12.5, color: ui.textSecondary },
  bookWrap: { flexShrink: 0 },
  bookBtn: {
    height: 50,
    paddingHorizontal: 34,
    borderRadius: 14,
    backgroundColor: ui.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookText: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.white },
});
