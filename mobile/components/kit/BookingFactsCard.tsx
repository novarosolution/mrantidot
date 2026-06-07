import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Phone } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
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
  audience = 'staff',
  onCallPhone,
}: {
  booking: Booking;
  showCustomer?: boolean;
  showTechnician?: boolean;
  showPayment?: boolean;
  showPhotos?: boolean;
  audience?: 'customer' | 'staff' | 'technician';
  onCallPhone?: (phone: string) => void;
}) {
  const bookingCopy = useBookingCopy();
  const forCustomer = audience === 'customer';
  const forTechnician = audience === 'technician';
  const showCustomerRow =
    (showCustomer && !forCustomer && !forTechnician) ||
    (forTechnician && booking.customer && typeof booking.customer === 'object');
  const showTechnicianRow =
    showTechnician && !forCustomer && bookingHasTechnician(booking);
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
      ? forCustomer
        ? 'Your technician'
        : 'Technician'
      : null;
  const personName = showCustomerRow
    ? bookingCustomerName(booking)
    : showTechnicianRow
      ? bookingTechnicianName(booking)
      : null;

  return (
    <Card variant="premium" style={styles.card}>
      <View style={styles.head}>
        <View style={styles.icon}>
          <ServiceIcon iconKey={iconKey} size={22} color={colors.lime} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.service}>{bookingServiceName(booking)}</Text>
          <Text style={styles.ref}>{bookingRef(booking.id)}</Text>
        </View>
        {booking.amount?.total ? (
          <Text style={styles.price}>₹{booking.amount.total}</Text>
        ) : null}
      </View>

      <View style={styles.divider} />

      <FactRow
        label="When"
        value={bookingScheduleDisplay(booking)}
        subtitle={
          audience !== 'customer' && isSchedulePending(booking)
            ? bookingCopy.pendingFactsSubtitle
            : undefined
        }
      />
      {booking.propertyType || booking.propertyTypeLabel ? (
        <FactRow
          label="Property"
          value={booking.propertyTypeLabel ?? propertyTypeLabel(booking.propertyType ?? '')}
        />
      ) : null}
      <FactRow label="Where" value={booking.address} />
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
              <Phone size={16} color={colors.secondaryDark} />
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {showPayment ? (
        <>
          <View style={styles.divider} />
          <FactRow label="Payment" value={paymentMethodLabel(booking.paymentMethod)} />
          {booking.couponCode ? <FactRow label="Coupon" value={booking.couponCode} /> : null}
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
    </Card>
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
  card: { marginBottom: spacing.sm, padding: spacing.md },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: {
    width: 48,
    height: 48,
    borderRadius: premium.radiusCard,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
  service: { fontFamily: fonts.display, fontSize: 15, color: colors.ink },
  ref: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 2 },
  price: { ...typography.price, fontSize: 17 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  fact: { marginTop: 8 },
  factLabel: { ...typography.overline, textTransform: 'none', letterSpacing: 0.3 },
  factValue: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ink, marginTop: 4 },
  factSubtitle: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 2 },
  personRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  callBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.secondarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photosBlock: { marginTop: spacing.sm },
  photos: { marginTop: 8 },
  thumb: { width: 64, height: 64, borderRadius: 12, marginRight: 8 },
});
