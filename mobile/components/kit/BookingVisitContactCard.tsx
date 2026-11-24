import { Linking, StyleSheet, Text, View } from 'react-native';
import { Phone, Users } from 'lucide-react-native';
import { PressableScale } from '@/components/ui/PressableScale';
import { colors, fonts, radii, spacing, ui } from '@/constants/theme';
import { formatPhoneDisplay } from '@/lib/profile-display';

/**
 * "Visit contact" — shown when a booking is for someone other than the account holder: who will be at the
 * property and the number the technician calls. Tapping the phone pill opens the dialler.
 */
export function BookingVisitContactCard({
  name,
  phone,
  title,
  subtitle,
  canCall = true,
}: {
  name: string;
  phone: string;
  title: string;
  subtitle?: string;
  /** Hide the call button where calling makes no sense (e.g. the customer's own screen). */
  canCall?: boolean;
}) {
  const shown = formatPhoneDisplay(phone) ?? phone;
  return (
    <View style={styles.card}>
      <View style={styles.icon}>
        <Users size={20} color={ui.brand} strokeWidth={2.1} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.sub} numberOfLines={2}>
          {shown}
          {subtitle ? ` · ${subtitle}` : ''}
        </Text>
      </View>
      {canCall ? (
        <PressableScale
          style={styles.call}
          onPress={() => void Linking.openURL(`tel:${phone}`)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Call ${name}`}
        >
          <Phone size={16} color={colors.white} strokeWidth={2.4} />
        </PressableScale>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: 14,
    borderRadius: radii.card,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    ...ui.shadow,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ui.brandSoft,
  },
  body: { flex: 1, minWidth: 0 },
  title: {
    fontFamily: fonts.bodyBold,
    fontSize: 10.5,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: ui.textTertiary,
  },
  name: { marginTop: 2, fontFamily: fonts.display, fontSize: 15, lineHeight: 20, color: ui.text },
  sub: { marginTop: 2, fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 17, color: ui.textSecondary },
  call: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ui.brand,
  },
});
