import { LinearGradient } from 'expo-linear-gradient';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { GlassPanel } from '@/components/kit/GlassScreenKit';
import { AppIcons } from '@/constants/appIcons';
import { ServiceIcon } from '@/components/ServiceIcon';
import { ServiceTypeBadges } from '@/components/kit/ServiceTypeBadges';
import { ToggleSwitch } from '@/components/kit/ToggleSwitch';
import type { Service } from '@/types/api';
import { serviceDisplayRating, serviceRealRating } from '@/lib/ratings';
import { adminType, colors, customerType, spacing, surfaces } from '@/constants/theme';

function AdminServiceListCardComponent({
  service,
  onPress,
  onEdit,
  onToggleActive,
}: {
  service: Service;
  index: number;
  onPress: () => void;
  onEdit: () => void;
  onToggleActive: () => void;
}) {
  const inactive = service.active === false;
  const real = serviceRealRating(service.stats);
  const display = serviceDisplayRating(service);

  return (
    <GlassPanel style={[styles.shell, inactive && styles.inactive]} padded={false} tone="light" goldEdge intensity={38}>
      <View style={styles.row}>
        <Pressable style={({ pressed }) => [styles.main, pressed && styles.pressed]} onPress={onPress}>
          <LinearGradient
            colors={inactive ? ['rgba(243,244,242,0.9)', 'rgba(232,236,230,0.85)'] : ['rgba(238,248,230,0.92)', 'rgba(216,237,200,0.78)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.icon, inactive && styles.iconMuted]}
          >
            <ServiceIcon iconKey={service.iconKey} size={22} color={inactive ? colors.muted : colors.forest} />
          </LinearGradient>
          <View style={styles.body}>
            <View style={styles.titleRow}>
              <Text style={styles.name} numberOfLines={1}>
                {service.name}
              </Text>
              {inactive ? <Text style={styles.badgeOff}>Off</Text> : <Text style={styles.badgeOn}>Live</Text>}
            </View>
            <ServiceTypeBadges types={service.serviceTypes} max={3} />
            <View style={styles.metaRow}>
              <Text style={styles.price}>₹{service.basePrice}</Text>
              <Text style={styles.meta}>★ {display.toFixed(1)}</Text>
              {real != null ? <Text style={styles.metaReal}>{real.toFixed(1)} real</Text> : null}
              {service.stats ? <Text style={styles.meta}>{service.stats.bookingCount} booked</Text> : null}
            </View>
          </View>
        </Pressable>
        <View style={styles.actions}>
          <ToggleSwitch value={!inactive} onToggle={onToggleActive} />
          <Pressable style={styles.editBtn} onPress={onEdit} hitSlop={6} accessibilityLabel="Edit service">
            <PremiumIcon icon={AppIcons.ui.edit} variant="plain" size="sm" color={colors.forest} strokeWidth={2.2} />
          </Pressable>
          <PremiumIcon icon={AppIcons.ui.chevronRight} variant="chevron" size="sm" color={colors.muted} />
        </View>
      </View>
    </GlassPanel>
  );
}

export const AdminServiceListCard = memo(AdminServiceListCardComponent);

const styles = StyleSheet.create({
  shell: { marginBottom: spacing.sm, borderRadius: 20 },
  inactive: { opacity: 0.76 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: spacing.md, paddingTop: spacing.sm + 10 },
  main: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 12, minWidth: 0 },
  pressed: { opacity: 0.94 },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconMuted: { borderColor: 'rgba(226,230,224,0.85)' },
  body: { flex: 1, minWidth: 0, gap: 5 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { ...adminType.listTitle, flex: 1, fontSize: 15 },
  badgeOff: {
    ...customerType.pillLabel,
    color: colors.error,
    backgroundColor: 'rgba(251,231,225,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(192,73,46,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: 'hidden',
  },
  badgeOn: {
    ...customerType.pillLabel,
    color: colors.forest,
    backgroundColor: 'rgba(238,248,230,0.72)',
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: 'hidden',
  },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 3 },
  price: { ...adminType.listPrice },
  meta: { ...adminType.listMeta },
  metaReal: { ...adminType.chipText, ...adminType.listMeta, color: colors.forest },
  actions: { alignItems: 'flex-end', gap: 8, paddingTop: 2 },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(238,248,230,0.65)',
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
