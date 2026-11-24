import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppImage } from '@/components/ui/AppImage';
import { PhotoViewer } from '@/components/ui/PhotoViewer';
import { PressableScale } from '@/components/ui/PressableScale';
import { fillCopy } from '@/constants/customerUiCopy';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { callPhone } from '@/lib/contact';
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
import { formatRupeeFull } from '@/components/kit/format';
import { colors, fonts, premium, radii, spacing, typography, ui } from '@/constants/theme';

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
  hideSchedule,
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
  /** Skip the "When" row — use when a status card above already shows the visit time. */
  hideSchedule?: boolean;
}) {
  const bookingCopy = useBookingCopy();
  const copy = useCustomerUiCopy();
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
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
  const photos = (showPhotos !== false ? booking.problemPhotos ?? [] : []).map((p) => mediaUrl(p));

  const person =
    showCustomerRow && booking.customer && typeof booking.customer === 'object'
      ? (booking.customer as User)
      : showTechnicianRow && booking.technician && typeof booking.technician === 'object'
        ? (booking.technician as User)
        : null;

  const personLabel = showCustomerRow
    ? forTechnician
      ? copy.bookingFactCustomerContact
      : copy.bookingFactCustomer
    : showTechnicianRow
      ? bookingCopy.factLabelTechnician
      : null;
  const personName = showCustomerRow
    ? bookingCustomerName(booking)
    : showTechnicianRow
      ? bookingTechnicianName(booking)
      : null;
  const scheduleText = bookingScheduleDisplay(booking, copy);
  // "UPI / Card · Paid" once the admin marks the visit paid (or refunded).
  const paymentState =
    booking.paymentStatus === 'paid' ? copy.bookingPaymentPaid : booking.paymentStatus === 'refunded' ? copy.bookingPaymentRefunded : null;
  const paymentText = [paymentMethodLabel(booking.paymentMethod), paymentState].filter(Boolean).join(' · ');

  const body = (
    <>
      {!hideHead ? (
        <>
          <View style={styles.head}>
            <ServiceIcon iconKey={iconKey} size={22} variant="premium" boxSize={48} color={colors.white} />
            <View style={styles.flex}>
              <Text style={styles.service}>{bookingServiceName(booking, copy)}</Text>
              <Text style={styles.ref}>{bookingRef(booking.id)}</Text>
            </View>
            {booking.amount?.total ? (
              <Text style={styles.price}>{formatRupeeFull(booking.amount.total)}</Text>
            ) : null}
          </View>
          <View style={styles.divider} />
        </>
      ) : null}

      {!hideSchedule ? (
        <FactRow
          label={bookingCopy.factLabelWhen}
          value={scheduleText}
          subtitle={
            audience !== 'customer' && isSchedulePending(booking)
              ? bookingCopy.pendingFactsSubtitle
              : undefined
          }
        />
      ) : null}
      {booking.option?.label ? (
        <FactRow label={copy.bookingFactPackage} value={`${booking.option.label} · ${formatRupeeFull(booking.option.price)}`} />
      ) : null}
      {booking.propertyType || booking.propertyTypeLabel ? (
        <FactRow
          label={bookingCopy.factLabelProperty}
          value={booking.propertyTypeLabel ?? propertyTypeLabel(booking.propertyType ?? '')}
        />
      ) : null}
      <FactRow label={bookingCopy.factLabelWhere} value={booking.address} />
      {forTechnician && jobDetails ? <FactRow label={copy.bookingFactJob} value={jobDetails} /> : null}

      {person && personName && personLabel ? (
        <View style={styles.personRow}>
          <Text style={styles.factLabel}>{personLabel}</Text>
          <Text style={[styles.factValue, styles.factValueRight, styles.flex]} numberOfLines={1}>
            {personName}
          </Text>
          {person.phone ? (
            <PressableScale
              style={styles.callBtn}
              haptic="tap"
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={fillCopy(copy.bookingCallLabel, { name: personName })}
              onPress={() => {
                if (onCallPhone) onCallPhone(person.phone!);
                else callPhone(person.phone!, copy);
              }}
            >
              <PremiumIcon icon={AppIcons.ui.phone} variant="plain" size={16} color={colors.forest} />
            </PressableScale>
          ) : null}
        </View>
      ) : null}

      {showPayment && !embedded ? (
        <>
          <View style={styles.divider} />
          <FactRow label={bookingCopy.factLabelPayment} value={paymentText} />
          {booking.couponCode ? <FactRow label={bookingCopy.factLabelCoupon} value={booking.couponCode} /> : null}
        </>
      ) : null}

      {showPayment && embedded ? (
        <>
          <FactRow label={bookingCopy.factLabelPayment} value={paymentText} />
          {booking.couponCode ? <FactRow label={bookingCopy.factLabelCoupon} value={booking.couponCode} /> : null}
        </>
      ) : null}

      {photos.length > 0 ? (
        <View style={styles.photosBlock}>
          <Text style={styles.factLabel}>{fillCopy(copy.bookingProblemPhotos, { count: photos.length })}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photos}>
            {photos.map((uri, i) => (
              <PressableScale
                key={`${uri}-${i}`}
                onPress={() => setViewerIndex(i)}
                accessibilityRole="imagebutton"
                accessibilityLabel={fillCopy(copy.photoViewerLabel, { current: i + 1, total: photos.length })}
                accessibilityHint={copy.photoOpenHint}
                containerStyle={styles.thumbWrap}
              >
                <AppImage uri={uri} style={styles.thumb} recyclingKey={uri} />
              </PressableScale>
            ))}
          </ScrollView>
          <PhotoViewer photos={photos} index={viewerIndex} onClose={() => setViewerIndex(null)} />
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
      <View style={styles.factRight}>
        <Text style={[styles.factValue, styles.factValueRight]}>{value}</Text>
        {subtitle ? <Text style={[styles.factSubtitle, styles.factValueRight]}>{subtitle}</Text> : null}
      </View>
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
  fact: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, paddingVertical: 8 },
  factRight: { flex: 1, minWidth: 0 },
  factValueRight: { textAlign: 'right', marginTop: 0 },
  factLabel: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  factValue: { fontFamily: fonts.bodySemi, fontSize: 13.5, color: colors.ink, marginTop: 4 },
  factSubtitle: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 2 },
  personRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  callBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.mint,
    borderWidth: 1,
    borderColor: ui.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photosBlock: { marginTop: spacing.sm },
  photos: { marginTop: 8 },
  thumbWrap: { marginRight: 8 },
  thumb: { width: 72, height: 72, borderRadius: radii.thumb },
});
