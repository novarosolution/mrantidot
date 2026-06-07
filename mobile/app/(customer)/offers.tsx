import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { CustomerListShell } from '@/components/kit/CustomerListShell';
import { AdminActionSheet, type ActionSheetOption } from '@/components/kit/AdminActionSheet';
import { OfferCouponCard } from '@/components/kit/OfferCouponCard';
import { OffersEmpty } from '@/components/kit/OffersEmpty';
import { OffersPromoHero } from '@/components/kit/OffersPromoHero';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { PremiumSectionHeader } from '@/components/ui/PremiumSectionHeader';
import { Spinner } from '@/components/ui/Spinner';
import { Pressable } from 'react-native';
import { api, getApiErrorMessage, safeAsync, screenLoadConfig } from '@/lib/api';
import type { Offer, Service } from '@/types/api';
import { colors, spacing } from '@/constants/theme';

export default function OffersScreen() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pickFor, setPickFor] = useState<Offer | null>(null);

  const load = async () => {
    setLoadError(null);
    const [o, s] = await Promise.all([
      api.get<{ offers: Offer[] }>('/offers', screenLoadConfig),
      api.get<{ services: Service[] }>('/services', screenLoadConfig),
    ]);
    setOffers(o.data.offers);
    setServices(s.data.services);
  };

  useEffect(() => {
    safeAsync(async () => {
      try {
        await load();
      } catch (err) {
        setLoadError(getApiErrorMessage(err, 'Could not load offers'));
      } finally {
        setLoading(false);
      }
    });
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    try {
      await load();
    } catch (err) {
      setLoadError(getApiErrorMessage(err, 'Could not refresh offers'));
    } finally {
      setRefreshing(false);
    }
  }

  function applyOffer(offer: Offer) {
    if (services.length === 0) {
      Alert.alert('No services', 'No services available to book right now.');
      return;
    }
    if (services.length === 1) {
      router.push({
        pathname: '/book/[serviceId]',
        params: { serviceId: services[0]!.id, coupon: offer.code },
      });
      return;
    }
    setPickFor(offer);
  }

  const pickOptions: ActionSheetOption[] = pickFor
    ? services.slice(0, 12).map((s) => ({
        key: s.id,
        label: s.name,
        subtitle: `₹${s.basePrice}`,
        onPress: () =>
          router.push({
            pathname: '/book/[serviceId]',
            params: { serviceId: s.id, coupon: pickFor.code },
          }),
      }))
    : [];

  const browseFab = (
    <Pressable style={styles.fab} onPress={() => router.push('/(customer)/services')} hitSlop={8}>
      <Sparkles size={17} color={colors.white} strokeWidth={2.2} />
    </Pressable>
  );

  return (
    <CustomerListShell title="Offers" showBack={false}
      rightAction={browseFab}
    >
      {loading ? (
        <Spinner />
      ) : loadError && offers.length === 0 ? (
        <ListEmptyRetry message={loadError} onRetry={() => safeAsync(load)} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.green} />}
        >
          <OffersPromoHero offerCount={offers.length} />

          {offers.length === 0 ? (
            <OffersEmpty />
          ) : (
            <>
              <PremiumSectionHeader title="Available coupons" style={styles.section} />
              {offers.map((o) => (
                <View key={o.id} style={styles.offerWrap}>
                  <OfferCouponCard offer={o} disabled={services.length === 0} onPress={() => applyOffer(o)} />
                </View>
              ))}
            </>
          )}
        </ScrollView>
      )}
      <AdminActionSheet
        visible={pickFor !== null}
        title="Choose a service"
        message={pickFor ? `Apply ${pickFor.code} to which service?` : undefined}
        options={pickOptions}
        onClose={() => setPickFor(null)}
      />
    </CustomerListShell>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl },
  section: { marginBottom: spacing.xs },
  offerWrap: { paddingHorizontal: spacing.md },
  fab: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
