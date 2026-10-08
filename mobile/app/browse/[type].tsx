import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { safeGoBack, customerRoutes, sharedRoutes, appPush } from '@/lib/routes';
import { CustomerPageHeader } from '@/components/kit/CustomerPageHeader';
import { TAB_BAR_SCROLL_PAD } from '@/components/kit/GlassScreenKit';
import { PestImage } from '@/components/kit/ServiceThumb';
import { ServiceListRow } from '@/components/kit/ServiceListRow';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { formatRupeeFull, plural } from '@/components/kit/format';
import { SERVICE_TYPE_META } from '@/constants/serviceTypeMeta';
import { isServiceTypeKey } from '@/constants/serviceTypes';
import { api, getApiErrorMessage, safeAsync, screenLoadConfig } from '@/lib/api';
import { CACHE_TTL } from '@/lib/apiCache';
import type { Service } from '@/types/api';
import { colors, fonts, spacing, ui } from '@/constants/theme';

function formatPrice(service: Service): string {
  if (
    service.basePrice <= 50 &&
    (service.serviceTypes?.includes('bird') || service.serviceTypes?.includes('silo'))
  ) {
    return `₹${service.basePrice} / sq ft`;
  }
  return formatRupeeFull(service.basePrice);
}

export default function ServicesByTypeScreen() {
  const { type: rawType } = useLocalSearchParams<{ type: string }>();
  const typeKey = rawType && isServiceTypeKey(rawType) ? rawType : null;
  const meta = typeKey ? SERVICE_TYPE_META[typeKey] : null;
  const TypeImage = meta?.image;

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

  if (!typeKey || !meta) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.safe} edges={['left', 'right']}>
          <CustomerPageHeader title="Browse" variant="premium" showBack onBack={() => safeGoBack(customerRoutes.services)} />
          <ListEmptyRetry message="Unknown service type" onRetry={() => safeGoBack(customerRoutes.services)} />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['left', 'right']}>
        <CustomerPageHeader
          title="Browse"
          subtitle="Starting prices · book in minutes"
          variant="premium"
          showBack
          onBack={() => safeGoBack(customerRoutes.services)}
        />

        {loading && services.length === 0 ? (
          <Spinner />
        ) : error && services.length === 0 ? (
          <ListEmptyRetry message={error} onRetry={() => safeAsync(() => load(true))} />
        ) : (
          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            <View style={[styles.hero, { backgroundColor: meta.bg }]}>
              <View style={styles.heroText}>
                <Text style={styles.heroKicker}>{plural(services.length, 'service')}</Text>
                <Text style={styles.heroTitle}>{meta.label}</Text>
                <View style={styles.heroBadges}>
                  {['Certified experts', 'Eco-safe', 'Fixed prices'].map((b) => (
                    <View key={b} style={styles.heroBadge}>
                      <Check size={11} color={ui.brand} strokeWidth={3} />
                      <Text style={styles.heroBadgeText}>{b}</Text>
                    </View>
                  ))}
                </View>
              </View>
              {TypeImage ? <PestImage source={TypeImage} size={76} /> : null}
            </View>
            {services.length === 0 ? (
              <EmptyState title="No services yet" message="Nothing listed for this type right now." />
            ) : (
              <View style={styles.card}>
                {services.map((service, i) => (
                  <ServiceListRow
                    key={service.id}
                    service={service}
                    priceLabel={formatPrice(service)}
                    onPress={() => appPush(sharedRoutes.service(service.id))}
                    onBook={() => appPush(sharedRoutes.book(service.id))}
                    showDivider={i < services.length - 1}
                  />
                ))}
              </View>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: ui.surfaceMuted },
  safe: { flex: 1, backgroundColor: 'transparent' },
  list: { padding: spacing.md, gap: spacing.md, paddingBottom: TAB_BAR_SCROLL_PAD },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 18,
    borderRadius: 22,
  },
  heroText: { flex: 1, minWidth: 0 },
  heroKicker: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: ui.brand,
  },
  heroTitle: { marginTop: 4, fontFamily: fonts.display, fontSize: 22, letterSpacing: -0.4, color: ui.text },
  heroBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  heroBadgeText: { fontFamily: fonts.bodySemi, fontSize: 11, color: ui.text },
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: ui.hairline,
    overflow: 'hidden',
  },
});
