import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Star } from 'lucide-react-native';
import { ServiceIcon } from '@/components/ServiceIcon';
import { ServiceTypeBadges } from '@/components/kit/ServiceTypeBadges';
import { ToggleSwitch } from '@/components/kit/ToggleSwitch';
import { PressableScale } from '@/components/ui/PressableScale';
import type { Service } from '@/types/api';
import { serviceDisplayRating, serviceRealRating } from '@/lib/ratings';
import { adminType, colors, fonts, spacing, ui } from '@/constants/theme';

/** One catalog row — tap anywhere to edit, the switch takes the service live / off. */
function AdminServiceListCardComponent({
  service,
  onPress,
  onToggleActive,
}: {
  service: Service;
  index: number;
  onPress: () => void;
  /** @deprecated The whole card opens the editor now. */
  onEdit?: () => void;
  onToggleActive: () => void;
}) {
  const inactive = service.active === false;
  const real = serviceRealRating(service.stats);
  const display = serviceDisplayRating(service);
  const booked = service.stats?.bookingCount;

  return (
    <PressableScale
      style={styles.card}
      containerStyle={styles.cardWrap}
      scaleTo={0.98}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${service.name}, ${inactive ? 'off' : 'live'}. Edit service`}
    >
      <View style={[styles.icon, inactive && styles.iconOff]}>
        <ServiceIcon iconKey={service.iconKey} size={34} color={inactive ? ui.textTertiary : colors.forest} />
      </View>

      <View style={styles.body}>
        <Text style={[styles.name, inactive && styles.nameOff]} numberOfLines={1}>
          {service.name}
        </Text>
        <ServiceTypeBadges types={service.serviceTypes} max={2} />
        <View style={styles.metaRow}>
          <Text style={[styles.price, inactive && styles.nameOff]} numberOfLines={1}>
            ₹{service.basePrice}
          </Text>
          <View style={styles.dot} />
          <Star size={12} color={ui.text} fill={ui.text} strokeWidth={0} />
          <Text style={styles.meta}>{display.toFixed(1)}</Text>
          {booked != null ? (
            <>
              <View style={styles.dot} />
              <Text style={styles.meta} numberOfLines={1}>
                {booked} booked
              </Text>
            </>
          ) : null}
        </View>
        {real != null ? (
          <Text style={styles.real} numberOfLines={1}>
            Customer reviews average {real.toFixed(1)}
          </Text>
        ) : null}
      </View>

      <View style={styles.side}>
        <ToggleSwitch
          value={!inactive}
          onToggle={onToggleActive}
          accessibilityLabel={inactive ? `Make ${service.name} live` : `Turn off ${service.name}`}
        />
        <Text style={[styles.state, inactive ? styles.stateOff : styles.stateOn]}>{inactive ? 'Off' : 'Live'}</Text>
      </View>
    </PressableScale>
  );
}

export const AdminServiceListCard = memo(AdminServiceListCardComponent);

const styles = StyleSheet.create({
  cardWrap: { marginBottom: spacing.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    ...ui.shadow,
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: 15,
    backgroundColor: ui.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOff: { backgroundColor: ui.surfaceMuted },
  body: { flex: 1, minWidth: 0, gap: 5 },
  name: { ...adminType.listTitle, fontSize: 15, color: ui.text },
  nameOff: { color: ui.textTertiary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  price: { fontFamily: fonts.bodyBold, fontSize: 14.5, color: ui.text },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: ui.textTertiary, marginHorizontal: 2 },
  meta: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: ui.textSecondary },
  real: { fontFamily: fonts.bodyMedium, fontSize: 11.5, color: ui.brand },
  side: { alignItems: 'center', gap: 4 },
  state: { fontFamily: fonts.bodyBold, fontSize: 10.5, letterSpacing: 0.4 },
  stateOn: { color: ui.brand },
  stateOff: { color: ui.textTertiary },
});
