import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { AppIcons } from '@/constants/appIcons';
import { Button } from '@/components/ui/Button';
import { useBookingCopy } from '@/lib/schedule-copy';
import { colors, customerType, premium, shadows, spacing } from '@/constants/theme';

const EMPTY_HINT: Record<'active' | 'completed' | 'cancelled', string> = {
  active: 'Book a service and your upcoming visits will appear here with live status updates.',
  completed: 'Finished jobs show here with receipts and review options.',
  cancelled: 'Cancelled visits are kept here for your records.',
};

export function BookingsEmpty({ filter }: { filter: 'active' | 'completed' | 'cancelled' }) {
  const copy = useBookingCopy();
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
          <AppIcons.quick.bookings size={32} color={colors.forest} strokeWidth={1.8} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{EMPTY_HINT[filter]}</Text>
        {filter === 'active' ? (
          <Button
            title={copy.listBookServiceButton}
            variant="premium"
            onPress={() => router.push('/(customer)/services')}
            style={styles.btn}
          />
        ) : filter === 'completed' ? (
          <Button title="Book again" variant="outline" onPress={() => router.push('/(customer)/services')} style={styles.btn} />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', padding: spacing.md, paddingTop: spacing.xl },
  card: {
    backgroundColor: colors.white,
    borderRadius: premium.radiusCard,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.06)',
    ...shadows.floating,
  },
  icon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(30,142,78,0.12)',
  },
  title: { ...customerType.emptyTitle },
  message: {
    ...customerType.emptyBody,
    marginTop: spacing.sm,
    maxWidth: 280,
  },
  btn: { marginTop: spacing.lg, alignSelf: 'stretch', maxWidth: 280 },
});
