import { memo } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { GlassPanel } from '@/components/kit/GlassScreenKit';
import { homeShadow } from '@/components/kit/homeUi';
import { AppIcons } from '@/constants/appIcons';
import { ServiceIcon } from '@/components/ServiceIcon';
import { StatusPill } from '@/components/ui/StatusPill';
import {
  bookingRef,
  bookingScheduleDisplay,
  bookingServiceIconKey,
  bookingServiceName,
  bookingCustomerName,
  isSchedulePending,
} from '@/lib/booking-helpers';
import type { Booking } from '@/types/api';
import { colors, customerType, fonts, statusColors } from '@/constants/theme';

const BORDER = 'rgba(180,220,165,0.95)';
const DEEP = '#0A6423';

function stepProgress(booking: Booking): number | null {
  const steps = booking.steps ?? [];
  if (steps.length === 0) return null;
  return steps.filter((s) => s.status === 'done').length / steps.length;
}

export const BookingListCard = memo(function BookingListCard({
  booking,
  onPress,
  showCustomer,
  hideAmount,
  hint,
  compact,
}: {
  booking: Booking;
  onPress?: () => void;
  showCustomer?: boolean;
  hideAmount?: boolean;
  hint?: string;
  compact?: boolean;
}) {
  const iconKey = bookingServiceIconKey(booking);
  const name = bookingServiceName(booking);
  const customer = showCustomer ? bookingCustomerName(booking) : null;
  const accent = statusColors[booking.status]?.text ?? colors.green;
  const accentBg = statusColors[booking.status]?.bg ?? colors.soft;
  const schedulePending = isSchedulePending(booking);
  const progress = stepProgress(booking);
  const isLive = booking.status === 'in_progress' || booking.status === 'awaiting_verification';

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}>
      <View style={styles.shell}>
        <GlassPanel style={styles.cardShell} padded={false} tone="clear" intensity={42}>
          <View style={styles.card}>
            {isLive ? (
              <View style={styles.iconLiveShell}>
                <LinearGradient
                  colors={['#8FD03C', '#1A8734', '#0A6423']}
                  start={{ x: 0.1, y: 0 }}
                  end={{ x: 0.9, y: 1 }}
                  style={styles.icon}
                >
                  <ServiceIcon iconKey={iconKey} size={22} color="#FFFFFF" strokeWidth={2.2} />
                  <View style={styles.liveDot} />
                </LinearGradient>
              </View>
            ) : (
              <View style={styles.iconPlain}>
                <ServiceIcon iconKey={iconKey} size={22} color={DEEP} variant="premium" boxSize={48} />
              </View>
            )}

            <View style={styles.body}>
              <View style={styles.titleRow}>
                <Text style={styles.name} numberOfLines={compact ? 1 : 2}>
                  {name}
                </Text>
                <StatusPill status={booking.status} />
              </View>

              {customer ? <Text style={styles.customer}>{customer}</Text> : null}

              <View style={styles.metaRow}>
                <PremiumIcon icon={AppIcons.ui.calendar} variant="plain" size={12} color={DEEP} strokeWidth={2.3} />
                <Text style={styles.meta} numberOfLines={1}>
                  {bookingScheduleDisplay(booking)}
                </Text>
              </View>

              {!compact ? (
                <View style={styles.metaRow}>
                  <PremiumIcon icon={AppIcons.ui.mapPin} variant="plain" size={12} color={colors.muted} strokeWidth={2.2} />
                  <Text style={styles.addr} numberOfLines={1}>
                    {booking.address}
                  </Text>
                </View>
              ) : null}

              {progress !== null && isLive ? (
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.round(progress * 100)}%`, backgroundColor: accent },
                    ]}
                  />
                </View>
              ) : null}

              {schedulePending ? (
                <View style={[styles.callout, { backgroundColor: accentBg }]}>
                  <Text style={[styles.calloutText, { color: accent }]}>Pending schedule</Text>
                </View>
              ) : null}
              {hint ? (
                <View style={[styles.callout, { backgroundColor: accentBg }]}>
                  <Text style={[styles.calloutText, { color: accent }]}>{hint}</Text>
                </View>
              ) : null}

              <View style={styles.footer}>
                <Text style={styles.ref}>{bookingRef(booking.id)}</Text>
                {!hideAmount && booking.amount ? (
                  <Text style={styles.total}>₹{booking.amount.total}</Text>
                ) : hideAmount && booking.techEarning != null ? (
                  <Text style={styles.total}>₹{booking.techEarning}</Text>
                ) : null}
              </View>
            </View>

            <PremiumIcon icon={AppIcons.ui.chevronRight} variant="chevron" size={14} color={DEEP} strokeWidth={2.4} />
          </View>
        </GlassPanel>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  wrap: { marginBottom: 10 },
  pressed: { opacity: 0.94, transform: [{ scale: 0.985 }] },
  shell: {
    borderRadius: 22,
    ...homeShadow.card,
  },
  cardShell: { borderRadius: 22 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  iconLiveShell: {
    borderRadius: 16,
    ...homeShadow.tile,
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  iconPlain: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C8F07A',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  body: { flex: 1, minWidth: 0 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  name: {
    flex: 1,
    ...customerType.cardTitle,
    color: colors.ink,
  },
  customer: {
    marginTop: 2,
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: colors.muted,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  meta: {
    flex: 1,
    ...customerType.listMeta,
    color: colors.ink,
  },
  addr: {
    flex: 1,
    ...customerType.listMetaMuted,
    color: colors.muted,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(232,244,218,0.95)',
    overflow: 'hidden',
    marginTop: 9,
  },
  progressFill: { height: '100%', borderRadius: 2 },
  callout: {
    marginTop: 7,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: BORDER,
  },
  calloutText: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 0.2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
  },
  ref: {
    ...customerType.listMetaMuted,
    fontSize: 11,
    color: colors.muted,
  },
  total: {
    ...customerType.listPrice,
    color: DEEP,
  },
});
