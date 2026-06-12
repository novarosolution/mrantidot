import { ChevronRight, Edit } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ServiceIcon } from '@/components/ServiceIcon';
import { ServiceTypeBadges } from '@/components/kit/ServiceTypeBadges';
import { ToggleSwitch } from '@/components/kit/ToggleSwitch';
import type { Service } from '@/types/api';
import { serviceDisplayRating, serviceRealRating } from '@/lib/ratings';
import { colors, fonts, premium, shadows, spacing } from '@/constants/theme';

export function AdminServiceListCard({
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
    <View style={[styles.card, inactive && styles.inactive]}>
      <Pressable style={({ pressed }) => [styles.main, pressed && styles.pressed]} onPress={onPress}>
        <View style={styles.icon}>
          <ServiceIcon iconKey={service.iconKey} size={22} color={colors.forest} />
        </View>
        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={styles.name} numberOfLines={1}>
              {service.name}
            </Text>
            {inactive ? <Text style={styles.badgeOff}>Off</Text> : null}
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
        <Pressable style={styles.editBtn} onPress={onEdit} hitSlop={6}>
          <Edit size={15} color={colors.forest} />
        </Pressable>
        <ChevronRight size={16} color={colors.muted} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: premium.radiusCard,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.07)',
    ...shadows.card,
  },
  inactive: { opacity: 0.72 },
  main: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 12, minWidth: 0 },
  pressed: { opacity: 0.94 },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, minWidth: 0, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontFamily: fonts.display, fontSize: 15, color: colors.ink, flex: 1 },
  badgeOff: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    color: colors.error,
    backgroundColor: colors.errorBg,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 4 },
  price: { fontFamily: fonts.displayExtra, fontSize: 15, color: colors.green },
  meta: { fontFamily: fonts.body, fontSize: 11, color: colors.muted },
  metaReal: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.forest },
  actions: { alignItems: 'flex-end', gap: 8, paddingTop: 2 },
  editBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
