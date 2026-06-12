import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { safeGoBack } from '@/lib/routes';
import { ServiceIcon } from '@/components/ServiceIcon';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { SERVICE_TYPE_META } from '@/constants/serviceTypeMeta';
import { isServiceTypeKey } from '@/constants/serviceTypes';
import { api, getApiErrorMessage, safeAsync, screenLoadConfig } from '@/lib/api';
import { CACHE_TTL } from '@/lib/apiCache';
import { formatBookingCount } from '@/lib/formatCount';
import type { Service } from '@/types/api';
import { colors, design, fonts, headerTopPad, premium, radius, spacing } from '@/constants/theme';

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
  const insets = useSafeAreaInsets();
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
      <SafeAreaView style={styles.safe} edges={['left', 'right']}>
        <ListEmptyRetry message="Unknown service type" onRetry={() => safeGoBack('/(customer)/services')} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <View style={[styles.header, { paddingTop: headerTopPad(insets.top) }]}>
        <Pressable style={styles.back} onPress={() => safeGoBack('/(customer)/services')} hitSlop={8}>
          <ChevronLeft size={22} color={colors.forest} />
        </Pressable>
        <View style={[styles.headerIcon, { backgroundColor: meta.bg }]}>
          {TypeIcon ? <TypeIcon size={22} color={meta.color} /> : null}
        </View>
        <View style={styles.headerBody}>
          <Text style={styles.headerTitle}>{meta.label}</Text>
          <Text style={styles.headerSub}>Services & starting prices</Text>
        </View>
      </View>

      {loading && services.length === 0 ? (
        <Spinner />
      ) : error && services.length === 0 ? (
        <ListEmptyRetry message={error} onRetry={() => safeAsync(() => load(true))} />
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {services.length === 0 ? (
            <Text style={styles.empty}>No services listed for this type yet.</Text>
          ) : (
            services.map((service) => (
              <Pressable
                key={service.id}
                style={({ pressed }) => [styles.card, pressed && styles.pressed]}
                onPress={() => router.push(`/service/${service.id}`)}
              >
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
              </Pressable>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: design.screenBg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBody: { flex: 1 },
  headerTitle: { fontFamily: fonts.displayExtra, fontSize: 18, color: colors.ink },
  headerSub: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 2 },
  list: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xxl },
  empty: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    ...premium.shadowSoft,
  },
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
  pressed: { opacity: 0.92 },
});
