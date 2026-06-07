import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, Edit } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ServiceIcon } from '@/components/ServiceIcon';
import { ServiceTypeBadges } from '@/components/kit/ServiceTypeBadges';
import { ToggleSwitch } from '@/components/kit/ToggleSwitch';
import type { Service } from '@/types/api';
import { colors, fonts, premium, spacing } from '@/constants/theme';

export function AdminServiceListCard({
  service,
  index,
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

  return (
    <View style={[styles.card, inactive && styles.inactive]}>
      <Pressable
        style={({ pressed }) => [styles.main, pressed && styles.pressed]}
        onPress={onPress}
      >
        <LinearGradient
          colors={index % 2 === 0 ? ['#14532D', '#1A6B3C'] : [colors.soft, colors.white]}
          style={styles.icon}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <ServiceIcon
            iconKey={service.iconKey}
            size={24}
            color={index % 2 === 0 ? colors.lime : colors.forest}
          />
        </LinearGradient>

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={styles.name} numberOfLines={1}>
              {service.name}
            </Text>
            {inactive ? <Text style={styles.badgeOff}>Inactive</Text> : null}
          </View>
          <Text style={styles.desc} numberOfLines={2}>
            {service.shortDesc}
          </Text>
          <ServiceTypeBadges types={service.serviceTypes} max={4} />
          <View style={styles.metaRow}>
            <Text style={styles.price}>₹{service.basePrice}</Text>
            <Text style={styles.meta}>★ {service.rating?.toFixed(1) ?? '4.8'}</Text>
            {service.stats ? <Text style={styles.meta}>{service.stats.bookingCount} bookings</Text> : null}
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
    padding: 14,
    marginBottom: 10,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    ...premium.shadowSoft,
  },
  inactive: { opacity: 0.72 },
  main: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 12, minWidth: 0 },
  pressed: { opacity: 0.94 },
  icon: {
    width: 52,
    height: 52,
    borderRadius: 16,
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
  desc: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, lineHeight: 17 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 4 },
  price: { fontFamily: fonts.displayExtra, fontSize: 15, color: colors.green },
  meta: { fontFamily: fonts.body, fontSize: 11, color: colors.muted },
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
