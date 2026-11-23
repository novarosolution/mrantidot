import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CalendarCheck } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { useBookingCopy } from '@/lib/schedule-copy';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { colors, fonts, spacing, ui } from '@/constants/theme';
import { customerRoutes, appPush } from '@/lib/routes';

export function BookingsEmpty({ filter }: { filter: 'active' | 'completed' | 'cancelled' }) {
  const copy = useBookingCopy();
  const ui2 = useCustomerUiCopy();
  const hint =
    filter === 'active'
      ? ui2.bookingsEmptyHintActive
      : filter === 'completed'
        ? ui2.bookingsEmptyHintCompleted
        : ui2.bookingsEmptyHintCancelled;
  const title =
    filter === 'active'
      ? copy.listEmptyActive
      : filter === 'completed'
        ? copy.listEmptyCompleted
        : copy.listEmptyCancelled;

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <View style={styles.icon}>
          <CalendarCheck size={28} color={ui.brand} strokeWidth={1.9} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{hint}</Text>
        {filter === 'active' || filter === 'completed' ? (
          <Button
            title={filter === 'active' ? copy.listBookServiceButton : ui2.bookingsBookAgain}
            variant="premium"
            size="md"
            onPress={() => appPush(customerRoutes.services)}
            style={styles.btn}
          />
        ) : null}
        <Pressable
          onPress={() => appPush(customerRoutes.bookGuide)}
          accessibilityRole="button"
          accessibilityLabel={ui2.helpGuideTitle}
          style={({ pressed }) => [styles.guideLink, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.guideLinkText}>{ui2.bookingsHowToBook}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.md,
    paddingTop: spacing.lg,
  },
  card: {
    borderRadius: 22,
    maxWidth: 340,
    alignSelf: 'center',
    width: '100%',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    padding: spacing.lg,
    alignItems: 'center',
    gap: 10,
    ...ui.shadow,
  },
  icon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: ui.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  title: {
    fontFamily: fonts.displaySemi,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.3,
    textAlign: 'center',
    color: ui.text,
  },
  message: {
    fontFamily: fonts.body,
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: 'center',
    color: ui.textSecondary,
    maxWidth: 280,
  },
  btn: { marginTop: spacing.sm, minWidth: 200 },
  guideLink: { marginTop: 4, paddingVertical: 6, paddingHorizontal: 8 },
  guideLinkText: {
    fontFamily: fonts.bodySemi,
    fontSize: 13.5,
    color: ui.brand,
  },
});
