import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { GlassPanel } from '@/components/kit/GlassScreenKit';
import { homeShadow } from '@/components/kit/homeUi';
import { AppIcons } from '@/constants/appIcons';
import { ServiceIcon } from '@/components/ServiceIcon';
import {
  bookingCustomerName,
  bookingHasTechnician,
  bookingRef,
  bookingScheduleDisplay,
  bookingServiceIconKey,
  bookingServiceName,
  bookingTechnicianName,
  isSchedulePending,
  paymentMethodLabel,
} from '@/lib/booking-helpers';
import { useBookingCopy } from '@/lib/schedule-copy';
import { mediaUrl } from '@/lib/images';
import { propertyTypeLabel } from '@/constants/propertyTypes';
import type { Booking, User } from '@/types/api';
import { colors, fonts, premium, spacing, typography } from '@/constants/theme';

export function BookingFactsCard({
  booking,
  showCustomer,
  showTechnician,
  showPayment,
  showPhotos,
  hideHead,
  embedded,
  audience = 'staff',
  onCallPhone,
}: {
  booking: Booking;
  showCustomer?: boolean;
  showTechnician?: boolean;
  showPayment?: boolean;
  showPhotos?: boolean;
  /** Hide service icon, name, ref & price — use when hero already shows them. */
  hideHead?: boolean;
  /** Render without outer Card — for use inside BookingDetailSection. */
  embedded?: boolean;
  audience?: 'customer' | 'staff' | 'technician';
  onCallPhone?: (phone: string) => void;
}) {
  const bookingCopy = useBookingCopy();
  const forCustomer = audience === 'customer';
  const forTechnician = audience === 'technician';
  const showCustomerRow =
    (showCustomer && !forCustomer && !forTechnician) ||
    (forTechnician && booking.customer && typeof booking.customer === 'object');
  const showTechnicianRow = showTechnician && bookingHasTechnician(booking);
  const iconKey = bookingServiceIconKey(booking);
  const jobDetails =
    booking.service && typeof booking.service === 'object' && 'shortDesc' in booking.service
      ? String((booking.service as { shortDesc?: string }).shortDesc ?? '').trim()
      : '';
  const photos = showPhotos !== false ? booking.problemPhotos ?? [] : [];

  const person =
    showCustomerRow && booking.customer && typeof booking.customer === 'object'
      ? (booking.customer as User)
      : showTechnicianRow && booking.technician && typeof booking.technician === 'object'
        ? (booking.technician as User)
        : null;

  const personLabel = showCustomerRow
    ? forTechnician
      ? 'Customer contact'
      : 'Customer'
    : showTechnicianRow
      ? bookingCopy.factLabelTechnician
      : null;
  const personName = showCustomerRow
    ? bookingCustomerName(booking)
    : showTechnicianRow
      ? bookingTechnicianName(booking)
      : null;

  const body = (
    <>
      {!hideHead ? (
        <>
          <View style={styles.head}>
            <ServiceIcon iconKey={iconKey} size={22} variant="premium" boxSize={48} color="#FFFFFF" />
            <View style={styles.flex}>
              <Text style={styles.service}>{bookingServiceName(booking)}</Text>
              <Text style={styles.ref}>{bookingRef(booking.id)}</Text>
            </View>
            {booking.amount?.total ? (
              <Text style={styles.price}>₹{booking.amount.total}</Text>
            ) : null}
          </View>
          <View style={styles.divider} />
        </>
      ) : null}

      <FactRow
        label={bookingCopy.factLabelWhen}
        value={bookingScheduleDisplay(booking)}
        subtitle={
          audience !== 'customer' && isSchedulePending(booking)
            ? bookingCopy.pendingFactsSubtitle
            : undefined
        }
      />
      {booking.propertyType || booking.propertyTypeLabel ? (
        <FactRow
          label={bookingCopy.factLabelProperty}
          value={booking.propertyTypeLabel ?? propertyTypeLabel(booking.propertyType ?? '')}
        />
      ) : null}
      <FactRow label={bookingCopy.factLabelWhere} value={booking.address} />
      {forTechnician && jobDetails ? <FactRow label="Job" value={jobDetails} /> : null}

      {person && personName && personLabel ? (
        <View style={styles.personRow}>
          <View style={styles.flex}>
            <Text style={styles.factLabel}>{personLabel}</Text>
            <Text style={styles.factValue}>{personName}</Text>
          </View>
          {person.phone ? (
            <Pressable
              style={styles.callBtn}
              onPress={() => {
                if (onCallPhone) onCallPhone(person.phone!);
                else void Linking.openURL(`tel:${person.phone}`);
              }}
            >
              <PremiumIcon icon={AppIcons.ui.phone} variant="plain" size={16} color={colors.forest} />
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {showPayment && !embedded ? (
        <>
          <View style={styles.divider} />
          <FactRow label={bookingCopy.factLabelPayment} value={paymentMethodLabel(booking.paymentMethod)} />
          {booking.couponCode ? <FactRow label={bookingCopy.factLabelCoupon} value={booking.couponCode} /> : null}
        </>
      ) : null}

      {showPayment && embedded ? (
        <>
          <FactRow label={bookingCopy.factLabelPayment} value={paymentMethodLabel(booking.paymentMethod)} />
          {booking.couponCode ? <FactRow label={bookingCopy.factLabelCoupon} value={booking.couponCode} /> : null}
        </>
      ) : null}

      {photos.length > 0 ? (
        <View style={styles.photosBlock}>
          <Text style={styles.factLabel}>Problem photos ({photos.length})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photos}>
            {photos.map((uri) => (
              <Image key={uri} source={{ uri: mediaUrl(uri) }} style={styles.thumb} />
            ))}
          </ScrollView>
        </View>
      ) : null}
    </>
  );

  if (embedded) {
    return <View style={[styles.embedded, hideHead && styles.cardCompact]}>{body}</View>;
  }

  return (
    <View style={[styles.shell, hideHead && styles.shellCompact]}>
      <GlassPanel style={styles.panel} padded={false} tone="light" intensity={42} goldEdge>
        <View style={[styles.card, hideHead && styles.cardCompact]}>{body}</View>
      </GlassPanel>
    </View>
  );
}

function FactRow({ label, value, subtitle }: { label: string; value: string; subtitle?: string }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue}>{value}</Text>
      {subtitle ? <Text style={styles.factSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    marginBottom: spacing.sm,
    borderRadius: premium.radiusCard,
    ...homeShadow.card,
  },
  shellCompact: { marginBottom: 0 },
  panel: { borderRadius: premium.radiusCard },
  card: { padding: spacing.md },
  cardCompact: { marginBottom: 0, paddingVertical: spacing.sm },
  embedded: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1 },
  service: { fontFamily: fonts.display, fontSize: 15, color: colors.ink },
  ref: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 2 },
  price: { ...typography.price, fontSize: 17, color: colors.forest },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  fact: { marginTop: 8 },
  factLabel: { ...typography.overline, textTransform: 'none', letterSpacing: 0.3, color: colors.muted },
  factValue: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ink, marginTop: 4 },
  factSubtitle: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 2 },
  personRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  callBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EEF8E6',
    borderWidth: 1,
    borderColor: 'rgba(180,220,165,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photosBlock: { marginTop: spacing.sm },
  photos: { marginTop: 8 },
  thumb: { width: 64, height: 64, borderRadius: 12, marginRight: 8 },
});
