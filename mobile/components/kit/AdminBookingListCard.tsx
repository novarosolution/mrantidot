import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Calendar, Clock } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { StatusPill } from '@/components/ui/StatusPill';
import { ServiceIcon } from '@/components/ServiceIcon';
import { bookingRef } from '@/components/kit/format';
import {
  bookingCustomerName,
  bookingScheduleDisplay,
  bookingServiceName,
  bookingTechnicianName,
} from '@/lib/booking-helpers';
import type { Booking, Service, User } from '@/types/api';
import { colors, fonts, premium, shadows, spacing } from '@/constants/theme';

export const AdminBookingListCard = memo(function AdminBookingListCard({
  item,
  onOpen,
  onAssign,
}: {
  item: Booking;
  onOpen: (id: string) => void;
  onAssign: (booking: Booking) => void;
}) {
  const svc = typeof item.service === 'object' ? item.service : null;
  const iconKey = (svc as Service | null)?.iconKey ?? 'spray';
  const tech = typeof item.technician === 'object' ? item.technician : null;
  const canAssign = item.status === 'confirmed';
  const isPending = item.status === 'pending';
  const isCustom = item.scheduleMode === 'custom' || item.schedule?.slot === 'custom';
  const scheduleLabel = bookingScheduleDisplay(item);

  return (
    <View style={styles.card}>
      <Pressable onPress={() => onOpen(item.id)} style={({ pressed }) => pressed && styles.pressed}>
        <View style={styles.top}>
          <Text style={styles.ref}>{bookingRef(item.id)}</Text>
          <StatusPill status={item.status} />
        </View>
        <View style={styles.main}>
          <View style={styles.icon}>
            <ServiceIcon iconKey={iconKey} size={20} color={colors.lime} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.svc} numberOfLines={1}>
              {bookingServiceName(item)}
            </Text>
            <Text style={styles.meta} numberOfLines={1}>
              {bookingCustomerName(item)}
              {tech ? ` · ${bookingTechnicianName(item)}` : ''}
            </Text>
            <View style={styles.scheduleRow}>
              {isCustom ? <Clock size={12} color={colors.secondaryDark} /> : <Calendar size={12} color={colors.muted} />}
              <Text style={styles.scheduleText} numberOfLines={1}>
                {scheduleLabel}
              </Text>
              {isPending ? <Text style={styles.pendingBadge}>Confirm</Text> : null}
            </View>
          </View>
          <Text style={styles.price}>₹{item.amount.total}</Text>
        </View>
      </Pressable>
      {canAssign ? (
        <View style={styles.footer}>
          <Text style={styles.unassigned}>{tech ? (tech as User).name : 'Unassigned'}</Text>
          <Button
            title={tech ? 'Reassign' : 'Assign'}
            onPress={() => onAssign(item)}
            style={styles.assignBtn}
          />
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: premium.radiusCard,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.07)',
    ...shadows.card,
  },
  pressed: { opacity: 0.92 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ref: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.muted },
  main: { flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: spacing.sm },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1, minWidth: 0 },
  svc: { fontFamily: fonts.display, fontSize: 14, color: colors.ink },
  meta: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 2 },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  scheduleText: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.forest, flex: 1 },
  pendingBadge: {
    fontFamily: fonts.bodySemi,
    fontSize: 9,
    color: colors.amberInk,
    backgroundColor: colors.amberBg,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: 'hidden',
  },
  price: { fontFamily: fonts.displayExtra, fontSize: 15, color: colors.green },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  unassigned: { flex: 1, fontFamily: fonts.body, fontSize: 11, color: colors.muted },
  assignBtn: { width: 'auto', minHeight: 34, paddingVertical: 6, paddingHorizontal: 14 },
});
