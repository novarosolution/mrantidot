import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { safeGoBack, customerRoutes, sharedRoutes, appPush } from '@/lib/routes';
import { CustomerPageHeader } from '@/components/kit/CustomerPageHeader';
import { TAB_BAR_SCROLL_PAD } from '@/components/kit/GlassScreenKit';
import { ListGroup, ListNavRow } from '@/components/kit/ListGroup';
import { PestImage } from '@/components/kit/ServiceThumb';
import { ServiceListRow } from '@/components/kit/ServiceListRow';
import { TrustNote } from '@/components/kit/TrustNote';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { plural } from '@/components/kit/format';
import { AppIcons } from '@/constants/appIcons';
import { SERVICE_TYPE_META } from '@/constants/serviceTypeMeta';
import { isServiceTypeKey } from '@/constants/serviceTypes';
import { api, getApiErrorMessage, safeAsync, screenLoadConfig } from '@/lib/api';
import { CACHE_TTL } from '@/lib/apiCache';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import type { Service } from '@/types/api';
import { colors, fonts, spacing, ui } from '@/constants/theme';

export default function ServicesByTypeScreen() {
  const { type: rawType } = useLocalSearchParams<{ type: string }>();
  const typeKey = rawType && isServiceTypeKey(rawType) ? rawType : null;
  const meta = typeKey ? SERVICE_TYPE_META[typeKey] : null;
  const TypeImage = meta?.image;
  const copy = useCustomerUiCopy();

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

  const badges = copy.browseBadges.split(',').map((b) => b.trim()).filter(Boolean);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['left', 'right']}>
        <CustomerPageHeader
          title={copy.browseTitle.replace('{type}', meta.label)}
          subtitle={copy.browseSubtitle}
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
            {/* One compact line of context — the page title already names the pest. */}
            <View style={[styles.intro, { backgroundColor: meta.bg }]}>
              {TypeImage ? (
                <View style={styles.introArt}>
                  <PestImage source={TypeImage} size={56} />
                </View>
              ) : null}
              <View style={styles.introText}>
                <Text style={styles.introTitle}>{plural(services.length, 'service')}</Text>
                {badges.length > 0 ? (
                  <Text style={styles.introSub} numberOfLines={2}>
                    {badges.join(' · ')}
                  </Text>
                ) : null}
              </View>
            </View>

            {services.length === 0 ? (
              <EmptyState title="No services yet" message="Nothing listed for this type right now." />
            ) : (
              <View style={styles.card}>
                {services.map((service, i) => (
                  <ServiceListRow
                    key={service.id}
                    service={service}
                    onPress={() => appPush(sharedRoutes.service(service.id))}
                    onBook={() => appPush(sharedRoutes.book(service.id))}
                    showDivider={i < services.length - 1}
                  />
                ))}
              </View>
            )}

            {services.length > 0 ? <TrustNote /> : null}

            <ListGroup>
              <ListNavRow
                icon={AppIcons.ui.help}
                title="Not sure which service?"
                subtitle="Talk to our team — we'll point you to the right treatment"
                onPress={() => appPush(customerRoutes.help)}
              />
            </ListGroup>
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
  intro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 20,
  },
  introArt: {
    width: 72,
    height: 72,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  introText: { flex: 1, minWidth: 0 },
  introTitle: { fontFamily: fonts.displaySemi, fontSize: 21, letterSpacing: -0.4, color: ui.text },
  introSub: { marginTop: 3, fontFamily: fonts.bodyMedium, fontSize: 13.5, lineHeight: 19, color: ui.textSecondary },
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: ui.hairline,
    overflow: 'hidden',
  },
});
