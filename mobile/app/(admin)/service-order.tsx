import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ArrowDown, ArrowUp } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import {
  ADMIN_STICKY_FOOTER_PAD,
  AdminEntrance,
  AdminListShell,
  useListEntrance,
} from '@/components/kit/AdminListShell';
import { AdminTabHint } from '@/components/kit/AdminPageKit';
import { AdminListSkeleton } from '@/components/kit/AdminSkeletons';
import { ServiceThumb } from '@/components/kit/ServiceThumb';
import { ToggleSwitch } from '@/components/kit/ToggleSwitch';
import { TAB_BAR_SCROLL_PAD } from '@/components/kit/GlassScreenKit';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { StickyActionBar } from '@/components/ui/StickyActionBar';
import { api, screenLoadConfig } from '@/lib/api';
import { haptic } from '@/lib/motion';
import { adminRoutes } from '@/lib/routes';
import { useScreenLoad } from '@/lib/useScreenLoad';
import type { Service } from '@/types/api';
import { colors, fonts, spacing, ui } from '@/constants/theme';

/**
 * Admin: decide where each service shows in the customer app and in what order.
 * Order applies to every list (home, catalog, browse); the two switches control the home sections.
 */
export default function ServiceOrderScreen() {
  const { loading, error, refreshing, runLoad, reload, refresh } = useScreenLoad();
  const [services, setServices] = useState<Service[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const entrance = useListEntrance(!loading);

  const load = useCallback(async () => {
    const { data } = await api.get<{ services: Service[] }>('/services', {
      ...screenLoadConfig,
      params: { includeInactive: 1 },
    });
    setServices(data.services);
    setSavedIds(data.services.map((s) => s.id));
  }, []);

  useEffect(() => {
    void runLoad(load, 'Could not load services');
  }, [load, runLoad]);

  const dirty = useMemo(() => services.map((s) => s.id).join() !== savedIds.join(), [services, savedIds]);
  const pinnedCount = services.filter((s) => s.showInPopular && s.active !== false).length;

  function move(index: number, by: -1 | 1) {
    const to = index + by;
    if (to < 0 || to >= services.length) return;
    haptic('select');
    setServices((prev) => {
      const next = [...prev];
      [next[index], next[to]] = [next[to]!, next[index]!];
      return next;
    });
  }

  async function toggle(service: Service, field: 'showInPopular' | 'showOnHome') {
    const value = field === 'showOnHome' ? service.showOnHome === false : !service.showInPopular;
    setServices((prev) => prev.map((s) => (s.id === service.id ? { ...s, [field]: value } : s)));
    try {
      await api.patch(`/services/${service.id}`, { [field]: value });
    } catch {
      setServices((prev) => prev.map((s) => (s.id === service.id ? { ...s, [field]: !value } : s)));
      haptic('error');
    }
  }

  async function saveOrder() {
    setSaving(true);
    try {
      await api.put('/services/order', { ids: services.map((s) => s.id) });
      setSavedIds(services.map((s) => s.id));
      haptic('success');
      Toast.show({ type: 'success', text1: 'Order saved', text2: 'Customers see the new order right away.' });
    } catch {
      // interceptor shows the error
      haptic('error');
    } finally {
      setSaving(false);
    }
  }

  if (loading && services.length === 0) {
    return (
      <AdminListShell title="Arrange services" subtitle="Order & home placement" backFallback={adminRoutes.services}>
        <AdminListSkeleton variant="service" rows={5} />
      </AdminListShell>
    );
  }

  if (error && services.length === 0) {
    return (
      <AdminListShell title="Arrange services" subtitle="Could not load" backFallback={adminRoutes.services}>
        <ListEmptyRetry message={error} onRetry={() => void reload(load, error)} />
      </AdminListShell>
    );
  }

  return (
    <AdminListShell
      title="Arrange services"
      subtitle={`${services.length} services · order & home placement`}
      backFallback={adminRoutes.services}
      stickyFooter={
        dirty ? (
          <StickyActionBar row>
            <Button
              title="Undo"
              variant="secondary"
              fullWidth={false}
              style={styles.footerSecondary}
              onPress={() => setServices((prev) => savedIds.map((id) => prev.find((s) => s.id === id)!).filter(Boolean))}
            />
            <Button
              title="Save order"
              variant="premium"
              fullWidth={false}
              style={styles.footerPrimary}
              loading={saving}
              onPress={() => void saveOrder()}
            />
          </StickyActionBar>
        ) : undefined
      }
    >
      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: dirty ? ADMIN_STICKY_FOOTER_PAD : TAB_BAR_SCROLL_PAD }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh(load)} tintColor={ui.brand} />}
      >
        <FadeSlideIn slideFrom={14}>
          <View style={styles.hintWrap}>
            <AdminTabHint
              title="How this works"
              body={`Arrows set the order in every customer list. "Most booked" pins a service to that home row (${pinnedCount} pinned — none pinned uses booking counts). "On Home" shows it in the home All services list.`}
            />
          </View>
        </FadeSlideIn>

        {services.length === 0 ? (
          <EmptyState title="No services yet" message="Add services to the catalog to arrange them here." />
        ) : null}

        {services.map((s, i) => {
          const off = s.active === false;
          return (
            <AdminEntrance key={s.id} index={i + 1} play={entrance(i)}>
              <View style={[styles.card, off && styles.cardOff]}>
                <View style={styles.top}>
                  <Text style={styles.pos}>{i + 1}</Text>
                  <ServiceThumb service={s} width={46} radius={14} iconSize={24} />
                  <View style={styles.body}>
                    <Text style={styles.name} numberOfLines={1}>
                      {s.name}
                    </Text>
                    <Text style={styles.meta} numberOfLines={1}>
                      ₹{s.basePrice}
                      {off ? ' · Off (hidden from customers)' : ''}
                    </Text>
                  </View>
                  <View style={styles.arrows}>
                    <ArrowBtn up disabled={i === 0} onPress={() => move(i, -1)} label={`Move ${s.name} up`} />
                    <ArrowBtn disabled={i === services.length - 1} onPress={() => move(i, 1)} label={`Move ${s.name} down`} />
                  </View>
                </View>
                <View style={styles.switches}>
                  <View style={styles.switchCell}>
                    <Text style={styles.switchLabel}>Most booked</Text>
                    <ToggleSwitch
                      value={Boolean(s.showInPopular)}
                      onToggle={() => void toggle(s, 'showInPopular')}
                      accessibilityLabel={`Pin ${s.name} to Most booked`}
                    />
                  </View>
                  <View style={styles.switchDivider} />
                  <View style={styles.switchCell}>
                    <Text style={styles.switchLabel}>On Home</Text>
                    <ToggleSwitch
                      value={s.showOnHome !== false}
                      onToggle={() => void toggle(s, 'showOnHome')}
                      accessibilityLabel={`Show ${s.name} on home`}
                    />
                  </View>
                </View>
              </View>
            </AdminEntrance>
          );
        })}
      </ScrollView>
    </AdminListShell>
  );
}

function ArrowBtn({ up, disabled, onPress, label }: { up?: boolean; disabled: boolean; onPress: () => void; label: string }) {
  const Icon = up ? ArrowUp : ArrowDown;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={4}
      style={({ pressed }) => [styles.arrow, disabled && styles.arrowOff, pressed && styles.arrowPressed]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Icon size={16} color={disabled ? ui.textTertiary : ui.brand} strokeWidth={2.4} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.md, paddingTop: 0, gap: 10 },
  hintWrap: { marginHorizontal: -spacing.md },
  footerSecondary: { flex: 1 },
  footerPrimary: { flex: 1.8 },
  card: {
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    ...ui.shadow,
  },
  cardOff: { opacity: 0.6 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  pos: { width: 22, textAlign: 'center', fontFamily: fonts.displayExtra, fontSize: 15, color: ui.textTertiary },
  body: { flex: 1, minWidth: 0 },
  name: { fontFamily: fonts.bodyBold, fontSize: 15, color: ui.text },
  meta: { marginTop: 2, fontFamily: fonts.bodyMedium, fontSize: 12.5, color: ui.textSecondary },
  arrows: { flexDirection: 'row', gap: 6 },
  arrow: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowOff: { backgroundColor: ui.surfaceMuted, borderColor: ui.hairline },
  arrowPressed: { backgroundColor: ui.brandSoft },
  switches: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ui.border,
  },
  switchCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  switchDivider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: ui.border },
  switchLabel: { fontFamily: fonts.bodySemi, fontSize: 13, color: ui.text },
});
