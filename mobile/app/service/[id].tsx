import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Camera, Check, Clock } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { StarRating } from '@/components/ui/StarRating';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StickyActionBar } from '@/components/ui/StickyActionBar';
import { CustomerPageHeader } from '@/components/kit/CustomerPageHeader';
import { ServiceIcon } from '@/components/ServiceIcon';
import { ServiceTypeBadges } from '@/components/kit/ServiceTypeBadges';
import { api, screenLoadConfig } from '@/lib/api';
import { CACHE_TTL } from '@/lib/apiCache';
import { useScreenLoad } from '@/lib/useScreenLoad';
import { formatSocialProof } from '@/lib/display';
import { serviceDisplayRating } from '@/lib/ratings';
import type { Service, ServiceReview, ServiceStats } from '@/types/api';
import { colors, design, fonts, premium, shadows, spacing, typography } from '@/constants/theme';

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [service, setService] = useState<Service | null>(null);
  const [stats, setStats] = useState<ServiceStats | null>(null);
  const [reviews, setReviews] = useState<ServiceReview[]>([]);
  const { loading, error, runLoad } = useScreenLoad();

  const load = useCallback(
    async (skipCache = false) => {
      if (!id) return;
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

  if (loading) return <Spinner fullScreen />;

  if (error || !service) {
    return (
      <View style={styles.root}>
        <CustomerPageHeader variant="premium" title="Service" showBack />
        <ListEmptyRetry
          title="Service unavailable"
          message={error ?? 'This service is no longer available. Pull to refresh the catalog.'}
          onRetry={() => void runLoad(() => load(true))}
        />
      </View>
    );
  }

  const socialProof = formatSocialProof(stats?.bookingCount, serviceDisplayRating(service));

  return (
    <View style={styles.root}>
      <CustomerPageHeader variant="premium" title={service.name} showBack>
        <View style={styles.heroMeta}>
          <View style={styles.heroIcon}>
            <ServiceIcon iconKey={service.iconKey} size={32} color={colors.lime} />
          </View>
          <View style={styles.heroText}>
            {socialProof ? <Text style={styles.rating}>{socialProof}</Text> : null}
            <Text style={styles.heroPrice}>₹{service.basePrice}</Text>
          </View>
        </View>
      </CustomerPageHeader>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.sheetContent}>
        <View style={styles.head}>
          <StatusBadge label="Eco-Safe" tone="success" />
          {service.serviceTypes?.length ? <ServiceTypeBadges types={service.serviceTypes} /> : null}
        </View>

        <View style={styles.chips}>
          <View style={styles.chip}>
            <Clock size={13} color={colors.secondaryDark} />
            <Text style={styles.chipText}>
              {service.stepTemplate?.length
                ? `~${Math.max(30, service.stepTemplate.length * 15)} min`
                : '45–60 min'}
            </Text>
          </View>
          <View style={styles.chip}>
            <Camera size={13} color={colors.secondaryDark} />
            <Text style={styles.chipText}>Photo verified</Text>
          </View>
        </View>

        <Text style={styles.aboutTitle}>About this service</Text>
        <Text style={styles.about}>{service.shortDesc}</Text>

        {(service.stepTemplate?.length ?? 0) > 0 ? (
          <>
            <Text style={styles.aboutTitle}>Service steps</Text>
            {service.stepTemplate!.map((t) => (
              <View key={t} style={styles.checkRow}>
                <View style={styles.checkIcon}>
                  <Check size={14} color={colors.green} strokeWidth={3} />
                </View>
                <Text style={styles.checkText}>{t}</Text>
              </View>
            ))}
          </>
        ) : null}

        {reviews.length > 0 ? <Text style={styles.aboutTitle}>Recent reviews</Text> : null}
        {reviews.map((r) => (
          <Card key={r.id} variant="premium" style={styles.reviewCard}>
            <View style={styles.reviewAvatar}>
              <Text style={styles.reviewInitial}>{r.customerName[0]}</Text>
            </View>
            <View style={styles.reviewBody}>
              <Text style={styles.reviewName}>{r.customerName}</Text>
              <StarRating rating={r.stars} size={12} showValue />
              <Text style={styles.reviewText}>{r.comment ?? r.tags.join(', ')}</Text>
            </View>
          </Card>
        ))}
      </ScrollView>

      <StickyActionBar>
        <View style={styles.footerRow}>
          <View style={styles.footerPrice}>
            <Text style={styles.price}>₹{service.basePrice}</Text>
          </View>
          <Button
            title="Book now"
            variant="premium"
            onPress={() => router.push(`/book/${service.id}`)}
            style={styles.bookBtn}
          />
        </View>
      </StickyActionBar>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: design.screenBg },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: premium.radiusCard,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.floating,
  },
  heroText: { flex: 1 },
  heroPrice: { ...typography.price, fontSize: 28, color: colors.white, marginTop: 4 },
  rating: { fontFamily: fonts.body, fontSize: 12, color: colors.lime },
  scroll: { flex: 1 },
  sheetContent: { padding: spacing.lg, paddingBottom: 120 },
  head: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, alignItems: 'center' },
  chips: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.secondarySoft,
  },
  chipText: { fontFamily: fonts.bodySemi, fontSize: 11.5, color: colors.secondaryInk },
  reviewCard: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.secondarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewInitial: { fontFamily: fonts.displayExtra, fontSize: 14, color: colors.secondaryDark },
  reviewBody: { flex: 1, gap: 4 },
  reviewName: { fontFamily: fonts.display, fontSize: 13, color: colors.ink },
  reviewText: { fontFamily: fonts.body, fontSize: 12.5, color: colors.muted, lineHeight: 19 },
  aboutTitle: { ...design.sectionTitle, marginTop: spacing.lg },
  about: { fontFamily: fonts.body, fontSize: 13.5, color: colors.muted, marginTop: 8, lineHeight: 22 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 11 },
  checkIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: { fontFamily: fonts.body, fontSize: 13.5, color: colors.ink },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  footerPrice: { flex: 1 },
  footerNote: { fontFamily: fonts.body, fontSize: 10, color: colors.muted, marginTop: 3 },
  from: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.muted, letterSpacing: 0.3 },
  price: { fontFamily: fonts.displayExtra, fontSize: 24, color: premium.accentGold, marginTop: 2 },
  bookBtn: { flex: 1, maxWidth: 200, minHeight: 54 },
});
