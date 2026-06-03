import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Calendar, Clock } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
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
import { colors, fonts } from '@/constants/theme';

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
  const otpHint =
    item.otpRequired === 'start'
      ? 'Awaiting start OTP'
      : item.otpRequired === 'end'
        ? 'Awaiting end OTP'
        : null;

  return (
    <Card variant="premium" style={styles.card}>
      <Pressable onPress={() => onOpen(item.id)}>
        <View style={styles.top}>
          <Text style={styles.ref}>{bookingRef(item.id)}</Text>
          <View style={styles.topRight}>
            {otpHint ? <Text style={styles.otpBadge}>{otpHint}</Text> : null}
            <StatusPill status={item.status} />
          </View>
        </View>
        <View style={styles.main}>
          <View style={styles.icon}>
            <ServiceIcon iconKey={iconKey} size={20} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.svc}>{bookingServiceName(item)}</Text>
            <Text style={styles.meta} numberOfLines={1}>
              {bookingCustomerName(item)} · {bookingTechnicianName(item)}
            </Text>
            <View style={styles.scheduleRow}>
              {isCustom ? (
                <Clock size={12} color={colors.secondaryDark} />
              ) : (
                <Calendar size={12} color={colors.muted} />
              )}
              <Text style={styles.scheduleText} numberOfLines={1}>
                {scheduleLabel}
              </Text>
              {isPending ? <Text style={styles.pendingBadge}>Awaiting confirm</Text> : null}
            </View>
          </View>
          <Text style={styles.price}>₹{item.amount.total}</Text>
        </View>
      </Pressable>
      <View style={styles.footer}>
        {canAssign ? (
          <>
            <Text style={styles.unassigned}>{tech ? (tech as User).name : 'Unassigned'}</Text>
            <Button
              title={tech ? 'Reassign' : 'Assign Tech'}
              onPress={() => onAssign(item)}
              style={styles.assignBtn}
            />
          </>
        ) : tech ? (
          <>
            <View style={styles.techDot}>
              <Text style={styles.techInit}>
                {(tech as User).name
                  .split(' ')
                  .map((w) => w[0])
                  .join('')
                  .slice(0, 2)}
              </Text>
            </View>
            <Text style={styles.techName}>{(tech as User).name}</Text>
            <Pressable onPress={() => onOpen(item.id)}>
              <Text style={styles.details}>Details</Text>
            </Pressable>
          </>
        ) : (
          <Pressable onPress={() => onOpen(item.id)} style={styles.flex}>
            <Text style={styles.details}>View details</Text>
          </Pressable>
        )}
      </View>
    </Card>
  );
});

const styles = StyleSheet.create({
  card: { marginBottom: 12, padding: 14 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  otpBadge: {
    fontFamily: fonts.bodySemi,
    fontSize: 9,
    color: colors.amberInk,
    backgroundColor: colors.amberBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: 'hidden',
  },
  ref: { fontFamily: fonts.displayExtra, fontSize: 12, color: colors.green },
  main: { flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 11 },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1, minWidth: 0 },
  svc: { fontFamily: fonts.display, fontSize: 13.5, color: colors.ink },
  meta: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 2 },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  scheduleText: { fontFamily: fonts.bodySemi, fontSize: 11.5, color: colors.forest, flex: 1 },
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
  price: { fontFamily: fonts.displayExtra, fontSize: 14, color: colors.green },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  unassigned: { flex: 1, fontFamily: fonts.body, fontSize: 11.5, color: colors.muted },
  assignBtn: { width: 'auto', minHeight: 36, paddingVertical: 7, paddingHorizontal: 16 },
  techDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  techInit: { fontFamily: fonts.displayExtra, fontSize: 9, color: colors.green },
  techName: { flex: 1, fontFamily: fonts.bodySemi, fontSize: 11.5, color: colors.ink },
  details: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: colors.green },
});
