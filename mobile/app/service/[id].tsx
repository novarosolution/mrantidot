import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { paramString } from '@/lib/routeParams';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { StickyActionBar } from '@/components/ui/StickyActionBar';
import { CustomerPageHeader } from '@/components/kit/CustomerPageHeader';
import { GlassBackdrop, GlassPanel } from '@/components/kit/GlassScreenKit';
import { ServiceIcon } from '@/components/ServiceIcon';
import { ServiceTypeBadges } from '@/components/kit/ServiceTypeBadges';
import { api, screenLoadConfig } from '@/lib/api';
import { CACHE_TTL } from '@/lib/apiCache';
import { useScreenLoad } from '@/lib/useScreenLoad';
import { formatSocialProof } from '@/lib/display';
import { serviceDisplayRating } from '@/lib/ratings';
import { safeGoBack, customerRoutes, sharedRoutes, appPush } from '@/lib/routes';
import type { Service, ServiceReview, ServiceStats } from '@/types/api';
import { fonts, headerTopPad, spacing, surfaces } from '@/constants/theme';

function SectionKicker({ label }: { label: string }) {
  return (
    <View style={styles.kickerRow}>
      <LinearGradient
        colors={['#30B84F', '#1A8734']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.kickerBar}
      />
      <Text style={styles.kickerText}>{label}</Text>
    </View>
  );
}

function Stars({ count }: { count: number }) {
  return (
    <View style={styles.starsRow}>
      {[...Array(5)].map((_, i) => {
        const on = i < count;
        const c = on ? '#25A443' : '#DBF1D1';
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

  const drift = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: 4200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(drift, { toValue: 0, duration: 4200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();
  }, [drift]);

  const load = useCallback(
    async (skipCache = false) => {
      if (!id) {
        throw new Error('Service not found');
      }
      const cache = skipCache ? { skipCache: true as const } : { cacheTtlMs: CACHE_TTL.services };
      const [svc, st, rev] = await Promise.all([
        api.get<{ service: Service }>(`/services/${id}`, { ...screenLoadConfig, ...cache }),
        api.get<{ stats: ServiceStats }>(`/services/${id}/stats`, { ...screenLoadConfig, ...cache }),
        api.get<{ reviews: ServiceReview[] }>(`/services/${id}/reviews`, { ...screenLoadConfig, ...cache }),
      ]);
      setService(svc.data.service);
      setStats(st.data.stats);
      setReviews(rev.data.reviews);
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
        <GlassBackdrop />
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
        <GlassBackdrop />
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
      <GlassBackdrop />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={['#0A6423', '#064D1B', '#043813']}
          locations={[0, 0.52, 1]}
          style={[styles.hero, { paddingTop: headerTopPad(insets.top) }]}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.9, y: 1 }}
        >
          <Animated.View
            style={[
              styles.heroGlow,
              {
                transform: [
                  { translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [0, 14] }) },
                  { translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [0, -10] }) },
                ],
              },
            ]}
            pointerEvents="none"
          >
            <LinearGradient
              colors={['rgba(184,232,106,0.4)', 'rgba(143,208,60,0)']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0.2, y: 0.2 }}
              end={{ x: 1, y: 1 }}
            />
          </Animated.View>
          <Animated.View
            style={[
              styles.heroGlowB,
              {
                transform: [
                  { translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) },
                  { translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [0, 8] }) },
                ],
              },
            ]}
            pointerEvents="none"
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0)']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          </Animated.View>
          <LinearGradient
            colors={['rgba(255,255,255,0.14)', 'rgba(255,255,255,0)']}
            style={styles.heroSheen}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            pointerEvents="none"
          />
          <View style={styles.heroTopRow}>
            <Pressable
              style={({ pressed }) => [styles.backBtn, pressed && styles.pressedSm]}
              onPress={() => safeGoBack(customerRoutes.services)}
              hitSlop={10}
            >
              <PremiumIcon icon={AppIcons.ui.chevronLeft} variant="plain" size={20} color="#FFFFFF" strokeWidth={2.2} />
            </Pressable>
            <Text style={styles.heroTitle} numberOfLines={2}>
              {service.name}
            </Text>
          </View>

          <View style={styles.heroMetaRow}>
            <View style={styles.heroIcon}>
              <ServiceIcon iconKey={service.iconKey} size={30} color="#FFFFFF" />
            </View>
            <View style={styles.heroText}>
              {socialProof ? (
                <View style={styles.ratingRow}>
                  <PremiumIcon icon={AppIcons.ui.star} variant="plain" size={12} color="#FFFFFF" fill="#FFFFFF" />
                  <Text style={styles.rating}>{socialProof}</Text>
                </View>
              ) : null}
              <View style={styles.priceRow}>
                <Text style={styles.heroPrice}>₹{service.basePrice}</Text>
                <Text style={styles.priceHint}>starting · per visit</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.tagsRow}>
          <View style={[styles.tag, styles.tagMint]}>
            <PremiumIcon icon={AppIcons.ui.leaf} variant="plain" size={12} color="#1A8734" strokeWidth={2.2} />
            <Text style={[styles.tagText, { color: '#1A8734' }]}>ECO-SAFE</Text>
          </View>
          <View style={[styles.tag, styles.tagPlain]}>
            <PremiumIcon icon={AppIcons.ui.clock} variant="plain" size={12} color="#5C8A63" strokeWidth={2.2} />
            <Text style={[styles.tagText, { color: '#5C8A63' }]}>{durationLabel.toUpperCase()}</Text>
          </View>
          <View style={[styles.tag, styles.tagPlain]}>
            <PremiumIcon icon={AppIcons.ui.camera} variant="plain" size={12} color="#5C8A63" strokeWidth={2.2} />
            <Text style={[styles.tagText, { color: '#5C8A63' }]}>PHOTO VERIFIED</Text>
          </View>
        </View>

        {service.serviceTypes?.length ? (
          <View style={styles.typeBadges}>
            <ServiceTypeBadges types={service.serviceTypes} />
          </View>
        ) : null}

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
                  <LinearGradient
                    colors={['#F5FBF2', '#D1EEC2']}
                    style={styles.stepNum}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.stepNumText}>{String(i + 1).padStart(2, '0')}</Text>
                  </LinearGradient>
                  <Text style={styles.stepText}>{t}</Text>
                  <PremiumIcon icon={AppIcons.ui.check} variant="plain" size={15} color="#30B84F" strokeWidth={2.6} />
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
                    <LinearGradient
                      colors={['#27A747', '#064D1B']}
                      style={styles.reviewAvatar}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.reviewInitial}>{r.customerName[0]}</Text>
                    </LinearGradient>
                    <View style={styles.reviewNameCol}>
                      <Text style={styles.reviewName}>{r.customerName}</Text>
                      <Stars count={r.stars} />
                    </View>
                  </View>
                  <Text style={styles.reviewText} numberOfLines={4}>
                    {r.comment ?? r.tags.join(', ')}
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
            <LinearGradient
              colors={['#27A747', '#064D1B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.bookBtn}
            >
              <Text style={styles.bookBtnText}>Book now</Text>
              <PremiumIcon icon={AppIcons.ui.arrowRight} variant="plain" size={16} color="#FFFFFF" strokeWidth={2.4} />
            </LinearGradient>
          </Pressable>
        </View>
      </StickyActionBar>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: surfaces.glassScreenBase },
  scroll: { flex: 1 },
  hero: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    top: -50,
    right: -36,
    width: 180,
    height: 180,
    borderRadius: 90,
    overflow: 'hidden',
  },
  heroGlowB: {
    position: 'absolute',
    bottom: -30,
    left: -40,
    width: 130,
    height: 130,
    borderRadius: 65,
    overflow: 'hidden',
  },
  heroSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 90,
  },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    flex: 1,
    fontFamily: fonts.displayExtra,
    fontSize: 22,
    letterSpacing: -0.3,
    color: '#FFFFFF',
  },
  heroMetaRow: { flexDirection: 'row', gap: 14, alignItems: 'center', marginTop: 18 },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: { flex: 1 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rating: { fontFamily: fonts.bodyBold, fontSize: 12.5, color: 'rgba(255,255,255,0.92)' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 7, marginTop: 3 },
  heroPrice: {
    fontFamily: fonts.displayExtra,
    fontSize: 30,
    letterSpacing: -0.6,
    color: '#FFFFFF',
  },
  priceHint: { fontFamily: fonts.bodySemi, fontSize: 12, color: 'rgba(255,255,255,0.65)' },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
  },
  tagMint: { backgroundColor: '#EAF6E3', borderColor: '#D1EEC2' },
  tagPlain: { backgroundColor: 'rgba(255,255,255,0.82)', borderColor: '#DBF1D1' },
  tagText: { fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 0.8 },
  typeBadges: { paddingHorizontal: 20, paddingTop: 10 },
  section: { paddingHorizontal: 20, paddingTop: 22 },
  kickerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  kickerBar: { width: 18, height: 3, borderRadius: 2 },
  kickerText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1.6,
    color: '#86AC80',
  },
  about: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13.5,
    color: '#38623C',
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
  stepRowBorder: { borderTopWidth: 1, borderTopColor: 'rgba(245,251,242,0.75)' },
  stepNum: {
    width: 30,
    height: 30,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: { fontFamily: fonts.bodyBold, fontSize: 11.5, color: '#1A8734' },
  stepText: { flex: 1, fontFamily: fonts.bodySemi, fontSize: 13.5, color: '#1F4129' },
  reviewsRail: { marginHorizontal: -20, marginTop: 11 },
  reviewsRailInner: { paddingHorizontal: 20, gap: 10, paddingBottom: 4 },
  reviewCard: {
    width: 240,
    backgroundColor: 'rgba(255,255,255,0.48)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
    borderRadius: 20,
    padding: 14,
  },
  reviewHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewInitial: { fontFamily: fonts.displayExtra, fontSize: 14, color: '#FFFFFF' },
  reviewNameCol: { gap: 2 },
  reviewName: { fontFamily: fonts.bodyBold, fontSize: 13, color: '#0B2213' },
  starsRow: { flexDirection: 'row', gap: 2 },
  reviewText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12.5,
    color: '#38623C',
    lineHeight: 18,
    marginTop: 9,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  fromLabel: { fontFamily: fonts.bodyBold, fontSize: 9.5, letterSpacing: 1, color: '#86AC80' },
  footerPrice: { fontFamily: fonts.displayExtra, fontSize: 22, color: '#1A8734' },
  bookBtnWrap: { flex: 1 },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    minHeight: 54,
    borderRadius: 18,
    shadowColor: '#064D1B',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  bookBtnText: { fontFamily: fonts.displayExtra, fontSize: 15, color: '#FFFFFF' },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.95 },
  pressedSm: { transform: [{ scale: 0.92 }] },
  spacing: { height: spacing.md },
});
