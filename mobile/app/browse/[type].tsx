import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { safeGoBack, customerRoutes, sharedRoutes, appPush } from '@/lib/routes';
import { ServiceIcon } from '@/components/ServiceIcon';
import { CustomerPageHeader } from '@/components/kit/CustomerPageHeader';
import { GlassBackdrop } from '@/components/kit/GlassScreenKit';
import { Card } from '@/components/ui/Card';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { PremiumSectionHeader } from '@/components/ui/PremiumSectionHeader';
import { Spinner } from '@/components/ui/Spinner';
import { SERVICE_TYPE_META } from '@/constants/serviceTypeMeta';
import { isServiceTypeKey } from '@/constants/serviceTypes';
import { api, getApiErrorMessage, safeAsync, screenLoadConfig } from '@/lib/api';
import { CACHE_TTL } from '@/lib/apiCache';
import { formatBookingCount } from '@/lib/formatCount';
import type { Service } from '@/types/api';
import { colors, customerType, fonts, spacing, surfaces } from '@/constants/theme';

function formatPrice(service: Service): string {
  if (
    service.basePrice <= 50 &&
    (service.serviceTypes?.includes('bird') || service.serviceTypes?.includes('silo'))
  ) {
    return `₹${service.basePrice} / sq ft`;
  }
  return `₹${service.basePrice}`;
}

export default function ServicesByTypeScreen() {
  const { type: rawType } = useLocalSearchParams<{ type: string }>();
  const typeKey = rawType && isServiceTypeKey(rawType) ? rawType : null;
  const meta = typeKey ? SERVICE_TYPE_META[typeKey] : null;
  const TypeIcon = meta?.icon;

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
        <GlassBackdrop />
        <SafeAreaView style={styles.safe} edges={['left', 'right']}>
          <CustomerPageHeader title="Browse" variant="premium" showBack onBack={() => safeGoBack(customerRoutes.services)} />
          <ListEmptyRetry message="Unknown service type" onRetry={() => safeGoBack(customerRoutes.services)} />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <GlassBackdrop />
      <SafeAreaView style={styles.safe} edges={['left', 'right']}>
        <CustomerPageHeader
          title={meta.label}
          subtitle="Services & starting prices"
          variant="premium"
          showBack
          onBack={() => safeGoBack(customerRoutes.services)}
          rightAction={
            TypeIcon ? (
              <View style={[styles.headerIcon, { backgroundColor: meta.bg }]}>
                <TypeIcon size={20} color={meta.color} />
              </View>
            ) : undefined
          }
        />

        {loading && services.length === 0 ? (
          <Spinner />
        ) : error && services.length === 0 ? (
          <ListEmptyRetry message={error} onRetry={() => safeAsync(() => load(true))} />
        ) : (
          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            <PremiumSectionHeader
              title={`${services.length} service${services.length === 1 ? '' : 's'}`}
              subtitle="Transparent pricing · Certified experts"
              style={styles.section}
              compact
            />
            {services.length === 0 ? (
              <Text style={styles.empty}>No services listed for this type yet.</Text>
            ) : (
              services.map((service) => (
                <Card
                  key={service.id}
                  variant="premium"
                  style={styles.card}
                  onPress={() => appPush(sharedRoutes.service(service.id))}
                >
                  <View style={styles.cardRow}>
                    <View style={styles.cardIcon}>
                      <ServiceIcon iconKey={service.iconKey} size={24} color={colors.forest} />
                    </View>
                    <View style={styles.cardBody}>
                      <Text style={styles.cardName}>{service.name}</Text>
                      <Text style={styles.cardDesc} numberOfLines={2}>
                        {service.shortDesc}
                      </Text>
                      {service.stats?.bookingCount ? (
                        <Text style={styles.cardMeta}>
                          {formatBookingCount(service.stats.bookingCount)} booked
                        </Text>
                      ) : null}
                    </View>
                    <View style={styles.cardPriceCol}>
                      <Text style={styles.cardPrice}>{formatPrice(service)}</Text>
                      <Text style={styles.cardFrom}>starting</Text>
                    </View>
                  </View>
                </Card>
              ))
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: surfaces.glassScreenBase },
  safe: { flex: 1, backgroundColor: 'transparent' },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  section: { marginTop: spacing.sm, marginBottom: spacing.xs },
  list: { paddingHorizontal: spacing.md, gap: spacing.sm, paddingBottom: spacing.xxl },
  empty: {
    ...customerType.sectionSubtitle,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  card: { padding: 14 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1, gap: 4 },
  cardName: { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink },
  cardDesc: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, lineHeight: 16 },
  cardMeta: { fontFamily: fonts.body, fontSize: 11, color: colors.green },
  cardPriceCol: { alignItems: 'flex-end' },
  cardPrice: { fontFamily: fonts.bodySemi, fontSize: 16, color: colors.forest },
  cardFrom: { fontFamily: fonts.body, fontSize: 10, color: colors.muted },
});
