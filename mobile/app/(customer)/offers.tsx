import { useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { AppIcons } from '@/constants/appIcons';
import { CustomerListShell } from '@/components/kit/CustomerListShell';
import { HeaderActionButton } from '@/components/kit/HeaderActionButton';
import { TAB_BAR_SCROLL_PAD, customerScrollProps } from '@/components/kit/GlassScreenKit';
import { AdminActionSheet, type ActionSheetOption } from '@/components/kit/AdminActionSheet';
import { OfferCouponCard } from '@/components/kit/OfferCouponCard';
import { OffersEmpty } from '@/components/kit/OffersEmpty';
import { OffersPromoHero } from '@/components/kit/OffersPromoHero';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { PremiumSectionHeader } from '@/components/ui/PremiumSectionHeader';
import { Spinner } from '@/components/ui/Spinner';
import { useAppContent } from '@/context/AppContentContext';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { api, getApiErrorMessage, safeAsync, screenLoadConfig } from '@/lib/api';
import { CACHE_TTL } from '@/lib/apiCache';
import type { Offer, Service } from '@/types/api';
import { colors, spacing } from '@/constants/theme';
import { customerRoutes, sharedRoutes, appPush } from '@/lib/routes';

export default function OffersScreen() {
  const { content, homePromo, homeConfig } = useAppContent();
  const ui = useCustomerUiCopy();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pickFor, setPickFor] = useState<Offer | null>(null);

  const brandName = content.branding.name?.trim() || 'Mr Antidot';
  const promoHint =
    homePromo?.active !== false && homePromo?.title?.trim()
      ? homePromo.title.trim()
      : content.trust.guaranteeText?.trim();
  const sectionTitle = homeConfig.quickLabels?.offers?.trim() || ui.offersScreenTitle;
  const couponsTitle =
    offers.length > 0 ? ui.offersSectionAvailable : homeConfig.sectionTitles.popular || 'Popular now';

  const load = async () => {
    setLoadError(null);
    const [o, s] = await Promise.all([
      api.get<{ offers: Offer[] }>('/offers', { ...screenLoadConfig, cacheTtlMs: CACHE_TTL.offers }),
      api.get<{ services: Service[] }>('/services', { ...screenLoadConfig, cacheTtlMs: CACHE_TTL.services }),
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
      Alert.alert(ui.offersNoServicesAlertTitle, ui.offersNoServicesAlertBody);
      return;
    }
    if (services.length === 1) {
      appPush(sharedRoutes.book(services[0]!.id, { coupon: offer.code }));
      return;
    }
    setPickFor(offer);
  }

  const pickOptions: ActionSheetOption[] = pickFor
    ? services.slice(0, 12).map((s) => ({
        key: s.id,
        label: s.name,
        subtitle: `₹${s.basePrice}`,
        onPress: () => appPush(sharedRoutes.book(s.id, { coupon: pickFor.code })),
      }))
    : [];

  const browseFab = (
    <HeaderActionButton
      icon={AppIcons.ui.layoutGrid}
      onPress={() => appPush(customerRoutes.services)}
      accessibilityLabel="Browse services"
    />
  );

  const subtitle =
    offers.length === 0
      ? promoHint || ui.offersEmptyHint
      : `${offers.length} coupon${offers.length === 1 ? '' : 's'} available`;

  return (
    <CustomerListShell title={sectionTitle} subtitle={subtitle} showBack={false} rightAction={browseFab}>
      {loading ? (
        <Spinner />
      ) : loadError && offers.length === 0 ? (
        <ListEmptyRetry
          message={loadError}
          onRetry={() => safeAsync(load, undefined, (msg) => setLoadError(msg))}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.green} />}
          {...customerScrollProps}
        >
          <OffersPromoHero
            offerCount={offers.length}
            brandName={brandName}
            fallbackTitle={ui.offersHeroFallbackTitle}
            fallbackSub={ui.offersHeroFallbackSub}
            subtitle={
              offers.length === 0
                ? promoHint
                : homeConfig.promoCodeHint
                  ? `Use code ${homeConfig.promoCodeHint} at checkout`
                  : content.trust.guaranteeText
            }
          />

          {offers.length === 0 ? (
            <OffersEmpty />
          ) : (
            <>
              <PremiumSectionHeader title={couponsTitle} style={styles.section} />
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
        title={ui.offersPickServiceTitle}
        message={pickFor ? `Apply ${pickFor.code} to which service?` : undefined}
        options={pickOptions}
        onClose={() => setPickFor(null)}
      />
    </CustomerListShell>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: TAB_BAR_SCROLL_PAD, flexGrow: 1 },
  section: { marginBottom: spacing.xs },
  offerWrap: { paddingHorizontal: spacing.md },
});
