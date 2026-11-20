import { useStaleFocusRefresh } from '@/lib/useStaleFocusRefresh';
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
import { ListFootnote, ListSectionTitle } from '@/components/kit/ListGroup';
import { ScreenState } from '@/components/ui/ScreenState';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { useAppContent } from '@/context/AppContentContext';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { api, getApiErrorMessage, safeAsync, screenLoadConfig } from '@/lib/api';
import { CACHE_TTL } from '@/lib/apiCache';
import type { Offer, Service } from '@/types/api';
import { spacing, ui as themeUi } from '@/constants/theme';
import { customerRoutes, sharedRoutes, appPush } from '@/lib/routes';
import { serviceStartPrice } from '@/lib/serviceDisplay';
import { formatRupeeFull } from '@/components/kit/format';
import { fillCopy } from '@/constants/customerUiCopy';
import { stagger } from '@/lib/motion';
import { ListRowsSkeleton } from '@/components/kit/ScreenSkeletons';

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
    homePromo?.active === true && homePromo?.title?.trim()
      ? homePromo.title.trim()
      : content.trust.guaranteeText?.trim();
  const sectionTitle = homeConfig.quickLabels?.offers?.trim() || ui.offersScreenTitle;

  const load = async () => {
    setLoadError(null);
    const [o, s] = await Promise.all([
      api.get<{ offers: Offer[] }>('/offers', { ...screenLoadConfig, cacheTtlMs: CACHE_TTL.offers }),
      api.get<{ services: Service[] }>('/services', { ...screenLoadConfig, cacheTtlMs: CACHE_TTL.services }),
    ]);
    setOffers(o.data.offers);
    setServices(s.data.services);
  };

  // Pick up admin changes (new offers, hidden services…) when the customer comes back to this screen.
  useStaleFocusRefresh(() => load().catch(() => undefined), 20_000);

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
        subtitle: fillCopy(ui.offersFromPrice, { price: formatRupeeFull(serviceStartPrice(s)) }),
        onPress: () => appPush(sharedRoutes.book(s.id, { coupon: pickFor.code })),
      }))
    : [];

  const browseFab = (
    <HeaderActionButton
      icon={AppIcons.ui.layoutGrid}
      onPress={() => appPush(customerRoutes.services)}
      accessibilityLabel={ui.offersBrowseLabel}
    />
  );

  return (
    <CustomerListShell title={sectionTitle} showBack={false} rightAction={browseFab}>
      <ScreenState
        embedded
        loading={loading}
        error={loadError && offers.length === 0 ? loadError : null}
        onRetry={() => safeAsync(load, undefined, (msg) => setLoadError(msg))}
        skeleton={<ListRowsSkeleton rows={3} tall />}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={themeUi.brand} />}
          {...customerScrollProps}
        >
          {offers.length === 0 ? (
            // Nothing to promote yet — the empty state stands alone instead of sitting under a banner.
            <OffersEmpty hint={promoHint || ui.offersEmptyHint} />
          ) : (
            <View style={styles.list}>
              <OffersPromoHero
                brandName={brandName}
                fallbackTitle={ui.offersHeroFallbackTitle}
                fallbackSub={ui.offersHeroFallbackSub}
                subtitle={
                  homeConfig.promoCodeHint
                    ? fillCopy(ui.offersCodeHint, { code: homeConfig.promoCodeHint })
                    : content.trust.guaranteeText
                }
              />
              <ListSectionTitle title={`${ui.offersSectionAvailable} · ${offers.length}`} />
              {offers.map((o, i) => (
                <FadeSlideIn key={o.id} delay={stagger(i + 1)} slideFrom={14}>
                  <OfferCouponCard
                    offer={o}
                    index={i}
                    disabled={services.length === 0}
                    onPress={() => applyOffer(o)}
                  />
                </FadeSlideIn>
              ))}
              <ListFootnote>{ui.offersFootnote}</ListFootnote>
            </View>
          )}
        </ScrollView>
      </ScreenState>
      <AdminActionSheet
        visible={pickFor !== null}
        title={ui.offersPickServiceTitle}
        message={pickFor ? fillCopy(ui.offersApplyQuestion, { code: pickFor.code }) : undefined}
        options={pickOptions}
        onClose={() => setPickFor(null)}
      />
    </CustomerListShell>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: TAB_BAR_SCROLL_PAD, flexGrow: 1 },
  list: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
});
