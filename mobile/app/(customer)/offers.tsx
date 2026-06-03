import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CustomerListShell } from '@/components/kit/CustomerListShell';
import { AdminActionSheet, type ActionSheetOption } from '@/components/kit/AdminActionSheet';
import { OfferCouponCard } from '@/components/kit/OfferCouponCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { api, getApiErrorMessage, safeAsync, screenLoadConfig } from '@/lib/api';
import type { Offer, Service } from '@/types/api';
import { colors, fonts, spacing } from '@/constants/theme';

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

  return (
    <CustomerListShell
      title="Offers & Coupons"
      subtitle="Pick a service when applying a coupon"
      showBack={false}
    >
      {loading ? (
        <Spinner />
      ) : loadError && offers.length === 0 ? (
        <ListEmptyRetry message={loadError} onRetry={() => safeAsync(load)} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.green} />}
        >
          {offers.length === 0 ? (
            <View style={styles.emptyWrap}>
              <EmptyState title="No offers right now" message="Check back later for discounts" />
            </View>
          ) : (
            offers.map((o) => (
              <View key={o.id}>
                <OfferCouponCard offer={o} disabled={services.length === 0} onPress={() => applyOffer(o)} />
                {services.length > 0 ? (
                  <Text style={styles.hint}>Applies to any active service · {services.length} available</Text>
                ) : null}
              </View>
            ))
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
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  emptyWrap: { paddingTop: spacing.xl },
  hint: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.muted,
    marginTop: -8,
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
  },
});
