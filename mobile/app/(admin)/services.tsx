import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Edit } from 'lucide-react-native';
import { AdminAddButton } from '@/components/kit/AdminAddButton';
import { AdminListShell, adminListShellStyles } from '@/components/kit/AdminListShell';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { ToggleSwitch } from '@/components/kit/ToggleSwitch';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { ServiceIcon } from '@/components/ServiceIcon';
import { api, screenLoadConfig } from '@/lib/api';
import { ADMIN_LIST_PERF } from '@/lib/listConfig';
import { useScreenLoad } from '@/lib/useScreenLoad';
import { ServiceTypeBadges } from '@/components/kit/ServiceTypeBadges';
import type { Service } from '@/types/api';
import { colors, fonts, spacing } from '@/constants/theme';

type ServiceFilter = 'all' | 'active' | 'inactive';

export default function AdminServicesScreen() {
  const [services, setServices] = useState<Service[]>([]);
  const [listFilter, setListFilter] = useState<ServiceFilter>('all');
  const { loading, error, refreshing, runLoad, reload, refresh } = useScreenLoad();

  const load = useCallback(async () => {
    const { data } = await api.get<{ services: Service[] }>('/services', {
      ...screenLoadConfig,
      params: { includeInactive: '1', includeStats: '1' },
    });
    setServices(data.services);
  }, []);

  const focusedOnce = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!focusedOnce.current) {
        focusedOnce.current = true;
        void runLoad(load, 'Could not load services');
        return;
      }
      void refresh(load);
    }, [load, runLoad, refresh]),
  );

  const visibleServices = useMemo(() => {
    if (listFilter === 'active') return services.filter((s) => s.active !== false);
    if (listFilter === 'inactive') return services.filter((s) => s.active === false);
    return services;
  }, [services, listFilter]);

  const toggleActive = useCallback((s: Service) => {
    const next = s.active === false;
    const action = next ? 'restore' : 'deactivate';
    Alert.alert(
      next ? 'Restore service?' : 'Deactivate service?',
      next ? 'Service will appear for customers again.' : 'Customers will no longer see this service.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: next ? 'Restore' : 'Deactivate',
          style: next ? 'default' : 'destructive',
          onPress: () => {
            void (async () => {
              setServices((prev) =>
                prev.map((x) => (x.id === s.id ? { ...x, active: next } : x)),
              );
              try {
                await api.patch(`/services/${s.id}`, { active: next });
              } catch {
                setServices((prev) =>
                  prev.map((x) => (x.id === s.id ? { ...x, active: s.active } : x)),
                );
                Alert.alert('Error', `Could not ${action} service`);
              }
            })();
          },
        },
      ],
    );
  }, []);

  if (loading) return <Spinner fullScreen />;

  if (error) {
    return (
      <AdminListShell title="Services" subtitle="Error">
        <ListEmptyRetry message={error} onRetry={() => void reload(load, error)} />
      </AdminListShell>
    );
  }

  const activeCount = services.filter((s) => s.active !== false).length;

  const addBtn = <AdminAddButton onPress={() => router.push('/(admin)/service-edit')} />;

  return (
    <AdminListShell
      title="Services"
      subtitle={`${activeCount} active · ${services.length} total`}
      rightAction={addBtn}
    >
      <View style={styles.chips}>
        {(['all', 'active', 'inactive'] as const).map((key) => (
          <Chip
            key={key}
            label={key === 'all' ? 'All' : key === 'active' ? 'Active' : 'Inactive'}
            selected={listFilter === key}
            onPress={() => setListFilter(key)}
          />
        ))}
      </View>
      <FlatList
        data={visibleServices}
        keyExtractor={(s) => s.id}
        {...ADMIN_LIST_PERF}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void refresh(load)}
            tintColor={colors.green}
          />
        }
        contentContainerStyle={visibleServices.length === 0 ? adminListShellStyles.empty : adminListShellStyles.list}
        ListEmptyComponent={<EmptyState title="No services" />}
        renderItem={({ item, index }) => (
          <Card variant="premium" style={{ ...styles.row, ...(item.active === false ? styles.rowInactive : {}) }}>
            <Pressable style={styles.main} onPress={() => router.push({ pathname: '/(admin)/service-edit', params: { id: item.id } })}>
              <View style={[styles.icon, index % 2 === 0 && styles.iconAlt]}>
                <ServiceIcon iconKey={item.iconKey} size={23} color={index % 2 === 0 ? colors.lime : colors.green} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.desc} numberOfLines={1}>{item.shortDesc}</Text>
                <ServiceTypeBadges types={item.serviceTypes} max={3} />
                <Text style={styles.price}>
                  ₹{item.basePrice}{' '}
                  <Text style={styles.rating}>· ★ {item.rating?.toFixed(1) ?? '4.8'}</Text>
                  {item.active === false ? <Text style={styles.inactiveTag}> · Inactive</Text> : null}
                </Text>
                {item.stats ? (
                  <Text style={styles.stats}>
                    {item.stats.bookingCount} bookings · {item.stats.reviewCount} reviews
                  </Text>
                ) : null}
              </View>
            </Pressable>
            <View style={styles.actions}>
              <ToggleSwitch value={item.active !== false} onToggle={() => void toggleActive(item)} />
              <Pressable
                style={styles.edit}
                onPress={() => router.push({ pathname: '/(admin)/service-edit', params: { id: item.id } })}
              >
                <Edit size={15} color={colors.green} />
              </Pressable>
            </View>
          </Card>
        )}
      />
    </AdminListShell>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, padding: 14 },
  rowInactive: { opacity: 0.72 },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconAlt: { backgroundColor: colors.soft },
  flex: { flex: 1, minWidth: 0 },
  name: { fontFamily: fonts.display, fontSize: 13.5 },
  desc: { fontFamily: fonts.body, fontSize: 10.5, color: colors.muted, marginTop: 2 },
  price: { fontFamily: fonts.displayExtra, fontSize: 14, color: colors.green, marginTop: 5 },
  rating: { fontFamily: fonts.body, fontSize: 9, color: colors.muted, fontWeight: '500' },
  stats: { fontFamily: fonts.body, fontSize: 10, color: colors.muted, marginTop: 3 },
  inactiveTag: { fontFamily: fonts.bodySemi, fontSize: 9, color: colors.error },
  actions: { alignItems: 'flex-end', gap: 9 },
  edit: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: colors.secondarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
