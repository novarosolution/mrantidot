import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { AdminAddButton } from '@/components/kit/AdminAddButton';
import { AdminListShell, adminListShellStyles } from '@/components/kit/AdminListShell';
import { AdminServiceListCard } from '@/components/kit/AdminServiceListCard';
import { AdminServiceTypeGrid } from '@/components/kit/AdminServiceTypeGrid';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { api, screenLoadConfig } from '@/lib/api';
import { CACHE_TTL } from '@/lib/apiCache';
import { ADMIN_LIST_PERF } from '@/lib/listConfig';
import { useScreenLoad } from '@/lib/useScreenLoad';
import { useStaleFocusRefresh } from '@/lib/useStaleFocusRefresh';
import { SERVICE_TYPE_LABELS } from '@/constants/serviceTypes';
import { SERVICE_TYPE_META } from '@/constants/serviceTypeMeta';
import type { Service, ServiceTypeKey } from '@/types/api';
import { colors, fonts, spacing } from '@/constants/theme';

type ServiceFilter = 'all' | 'active' | 'inactive';
type BrowseMode = 'types' | 'list';

export default function AdminServicesScreen() {
  const [services, setServices] = useState<Service[]>([]);
  const [browseMode, setBrowseMode] = useState<BrowseMode>('types');
  const [selectedType, setSelectedType] = useState<ServiceTypeKey | 'all'>('all');
  const [listFilter, setListFilter] = useState<ServiceFilter>('all');
  const { loading, error, refreshing, runLoad, reload, refresh } = useScreenLoad();

  const load = useCallback(async (opts?: { skipCache?: boolean }) => {
    const { data } = await api.get<{ services: Service[] }>('/services', {
      ...screenLoadConfig,
      params: { includeInactive: '1', includeStats: '1' },
      cacheTtlMs: CACHE_TTL.services,
      ...(opts?.skipCache ? { skipCache: true } : {}),
    });
    setServices(data.services);
  }, []);

  useEffect(() => {
    void runLoad(() => load(), 'Could not load services');
  }, [load, runLoad]);

  useStaleFocusRefresh(() => refresh(() => load({ skipCache: true })), 45_000);

  const visibleServices = useMemo(() => {
    let list = services;
    if (browseMode === 'list' && selectedType !== 'all') {
      list = list.filter((s) => s.serviceTypes?.includes(selectedType));
    }
    if (listFilter === 'active') return list.filter((s) => s.active !== false);
    if (listFilter === 'inactive') return list.filter((s) => s.active === false);
    return list;
  }, [services, browseMode, selectedType, listFilter]);

  const toggleActive = useCallback((s: Service) => {
    const next = s.active === false;
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
              setServices((prev) => prev.map((x) => (x.id === s.id ? { ...x, active: next } : x)));
              try {
                await api.patch(`/services/${s.id}`, { active: next });
              } catch {
                setServices((prev) => prev.map((x) => (x.id === s.id ? { ...x, active: s.active } : x)));
                Alert.alert('Error', `Could not ${next ? 'restore' : 'deactivate'} service`);
              }
            })();
          },
        },
      ],
    );
  }, []);

  function openType(type: ServiceTypeKey | 'all') {
    setSelectedType(type);
    setBrowseMode('list');
    setListFilter('all');
  }

  function backToTypes() {
    setBrowseMode('types');
  }

  function openEdit(id?: string) {
    router.push(id ? { pathname: '/(admin)/service-edit', params: { id } } : '/(admin)/service-edit');
  }

  if (loading) return <Spinner fullScreen />;

  if (error) {
    return (
      <AdminListShell title="Services" subtitle="Error">
        <ListEmptyRetry message={error} onRetry={() => void reload(() => load({ skipCache: true }), error)} />
      </AdminListShell>
    );
  }

  const activeCount = services.filter((s) => s.active !== false).length;
  const listTitle =
    selectedType === 'all'
      ? 'All services'
      : SERVICE_TYPE_META[selectedType].label;
  const listSubtitle =
    selectedType === 'all'
      ? `${activeCount} active · ${services.length} total`
      : `${visibleServices.length} service${visibleServices.length === 1 ? '' : 's'}`;

  if (browseMode === 'types') {
    return (
      <AdminListShell
        title="Services"
        subtitle={`${activeCount} active · ${services.length} total`}
        showBack={false}
        rightAction={<AdminAddButton onPress={() => openEdit()} />}
      >
        <AdminServiceTypeGrid
          services={services}
          onSelectType={openType}
          onAddService={() => openEdit()}
        />
      </AdminListShell>
    );
  }

  return (
    <AdminListShell
      title={listTitle}
      subtitle={listSubtitle}
      rightAction={<AdminAddButton onPress={() => openEdit()} />}
      headerExtra={
        <View style={styles.headerExtra}>
          <Pressable style={styles.backTypes} onPress={backToTypes}>
            <ChevronLeft size={18} color={colors.forest} />
            <Text style={styles.backTypesText}>Pest types</Text>
          </Pressable>
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
        </View>
      }
    >
      <FlatList
        data={visibleServices}
        keyExtractor={(s) => s.id}
        {...ADMIN_LIST_PERF}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void refresh(() => load({ skipCache: true }))} tintColor={colors.green} />
        }
        contentContainerStyle={
          visibleServices.length === 0 ? adminListShellStyles.empty : adminListShellStyles.list
        }
        ListEmptyComponent={
          <EmptyState
            title="No services"
            message={
              selectedType === 'all'
                ? 'Add your first service to the catalog.'
                : `No services tagged with ${SERVICE_TYPE_LABELS[selectedType]}.`
            }
          />
        }
        renderItem={({ item, index }) => (
          <AdminServiceListCard
            service={item}
            index={index}
            onPress={() => openEdit(item.id)}
            onEdit={() => openEdit(item.id)}
            onToggleActive={() => toggleActive(item)}
          />
        )}
      />
    </AdminListShell>
  );
}

const styles = StyleSheet.create({
  headerExtra: { gap: spacing.sm },
  backTypes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
  },
  backTypesText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.forest },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
});
