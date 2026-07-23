import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { GlassPanel } from '@/components/kit/GlassScreenKit';
import { adminShadow } from '@/components/kit/homeUi';
import { AppIcons } from '@/constants/appIcons';
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
import { adminType, colors, customerType, spacing, surfaces } from '@/constants/theme';

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
    <View style={styles.shell}>
      <GlassPanel style={styles.panel} padded={false} tone="light" goldEdge intensity={40}>
        <Pressable onPress={() => onOpen(item.id)} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
          <View style={styles.top}>
            <Text style={styles.ref}>{bookingRef(item.id)}</Text>
            <StatusPill status={item.status} />
          </View>
          <View style={styles.main}>
            <ServiceIcon iconKey={iconKey} size={20} variant="premium" boxSize={46} color="#FFFFFF" />
            <View style={styles.flex}>
              <Text style={styles.svc} numberOfLines={1}>
                {bookingServiceName(item)}
              </Text>
              <Text style={styles.meta} numberOfLines={1}>
                {bookingCustomerName(item)}
                {tech ? ` · ${bookingTechnicianName(item)}` : ''}
              </Text>
              <View style={styles.scheduleRow}>
                {isCustom ? (
                  <PremiumIcon icon={AppIcons.ui.clock} variant="plain" size="xs" color={colors.secondaryDark} />
                ) : (
                  <PremiumIcon icon={AppIcons.ui.calendar} variant="plain" size="xs" color={colors.muted} />
                )}
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
      </GlassPanel>
    </View>
  );
});

const styles = StyleSheet.create({
  shell: { marginBottom: spacing.sm, borderRadius: 20, ...adminShadow.card },
  panel: { borderRadius: 20 },
  card: { padding: spacing.md, paddingTop: spacing.sm + 8 },
  pressed: { opacity: 0.92 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ref: { ...adminType.listRef, color: colors.muted },
  main: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: spacing.sm },
  flex: { flex: 1, minWidth: 0 },
  svc: { ...adminType.listTitle, color: colors.ink },
  meta: { ...adminType.listMeta, marginTop: 2, color: colors.muted },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 5 },
  scheduleText: { ...adminType.listMeta, flex: 1, color: colors.muted },
  pendingBadge: {
    ...customerType.pillLabel,
    color: colors.forest,
    backgroundColor: 'rgba(238,248,230,0.92)',
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: 'hidden',
  },
  price: { ...adminType.listPrice, color: colors.forest },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: surfaces.glassBorderStrong,
  },
  unassigned: { flex: 1, ...adminType.listMeta, color: colors.muted },
  assignBtn: { width: 'auto', minHeight: 34, paddingVertical: 6, paddingHorizontal: 14 },
});
