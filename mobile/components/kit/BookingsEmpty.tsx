import { StyleSheet, Text, View } from 'react-native';
import { GlassPanel } from '@/components/kit/GlassScreenKit';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { Button } from '@/components/ui/Button';
import { useBookingCopy } from '@/lib/schedule-copy';
import { customerType, spacing } from '@/constants/theme';
import { customerRoutes, appPush } from '@/lib/routes';

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
      <GlassPanel style={styles.card} tone="clear" intensity={44} goldEdge padded={false}>
        <View style={styles.inner}>
          <PremiumIcon
            icon={AppIcons.quick.bookings}
            variant="ring"
            size={28}
            color="#0A6423"
            strokeWidth={1.9}
            boxSize={72}
          />
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{EMPTY_HINT[filter]}</Text>
          {filter === 'active' || filter === 'completed' ? (
            <Button
              title={filter === 'active' ? copy.listBookServiceButton : 'Book again'}
              variant="premium"
              size="md"
              onPress={() => appPush(customerRoutes.services)}
              style={styles.btn}
            />
          ) : null}
        </View>
      </GlassPanel>
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
    borderRadius: 24,
    maxWidth: 340,
    alignSelf: 'center',
    width: '100%',
  },
  inner: {
    padding: spacing.lg + 2,
    alignItems: 'center',
    gap: 10,
  },
  title: { ...customerType.emptyTitle },
  message: {
    ...customerType.emptyBody,
    maxWidth: 280,
  },
  btn: { marginTop: spacing.sm, minWidth: 200 },
});
