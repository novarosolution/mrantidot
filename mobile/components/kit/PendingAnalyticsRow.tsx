import { StyleSheet, Text, View } from 'react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { PressableScale } from '@/components/ui/PressableScale';
import { AppIcons } from '@/constants/appIcons';
import {
  bookingCustomerName,
  bookingScheduleDisplay,
  bookingServiceName,
} from '@/lib/booking-helpers';
import { formatTimeAgo } from '@/lib/time-ago';
import type { Booking } from '@/types/api';
import { colors, fonts, premium, spacing, ui } from '@/constants/theme';

export function PendingAnalyticsRow({
  booking,
  onPress,
}: {
  booking: Booking;
  onPress: () => void;
}) {
  const age = formatTimeAgo(booking.createdAt);

  return (
    <PressableScale
      style={styles.row}
      containerStyle={styles.rowWrap}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${bookingServiceName(booking)}, ${bookingCustomerName(booking)}, needs confirmation`}
    >
      <View style={styles.icon}>
        <PremiumIcon icon={AppIcons.ui.clock} variant="mint" size="sm" color={colors.forest} boxSize={40} />
      </View>
      <View style={styles.body}>
        <View style={styles.head}>
          <Text style={styles.service} numberOfLines={1}>
            {bookingServiceName(booking)}
          </Text>
          {age ? (
            <Text style={styles.age} numberOfLines={1}>
              {age}
            </Text>
          ) : null}
        </View>
        <Text style={styles.meta} numberOfLines={1}>
          {bookingCustomerName(booking)} · {bookingScheduleDisplay(booking)}
        </Text>
        <Text style={styles.badge}>Needs confirmation</Text>
      </View>
      <PremiumIcon icon={AppIcons.ui.chevronRight} variant="chevron" size="md" color={colors.muted} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  rowWrap: { marginBottom: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: premium.radiusCard,
    borderWidth: 1,
    borderColor: ui.hairline,
    ...ui.shadow,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.mint,
    borderWidth: 1,
    borderColor: ui.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, minWidth: 0 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  service: { fontFamily: fonts.displayExtra, fontSize: 14, color: ui.text, flex: 1, letterSpacing: -0.2 },
  age: { fontFamily: fonts.body, fontSize: 10, color: ui.textSecondary },
  meta: { fontFamily: fonts.body, fontSize: 12, color: ui.textSecondary, marginTop: 4 },
  badge: {
    alignSelf: 'flex-start',
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    color: colors.forest,
    backgroundColor: colors.mint,
    borderWidth: 1,
    borderColor: ui.brandSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginTop: 6,
    overflow: 'hidden',
  },
});
