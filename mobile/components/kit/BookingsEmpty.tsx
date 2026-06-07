import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { CalendarCheck } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { colors, fonts, premium, shadows, spacing } from '@/constants/theme';

export function BookingsEmpty({ filter }: { filter: 'active' | 'completed' | 'cancelled' }) {
  const isActive = filter === 'active';

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <View style={styles.icon}>
          <CalendarCheck size={32} color={colors.forest} strokeWidth={1.8} />
        </View>
        <Text style={styles.title}>
          {isActive ? 'No active bookings' : filter === 'completed' ? 'No completed bookings' : 'No cancelled bookings'}
        </Text>
        <Text style={styles.message}>
          {isActive
            ? 'Book a trusted service and track every visit here.'
            : `You don't have any ${filter} bookings yet.`}
        </Text>
        {isActive ? (
          <Button title="Book a service" variant="premium" onPress={() => router.push('/(customer)/services')} style={styles.btn} />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', padding: spacing.md },
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
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.ink,
    textAlign: 'center',
  },
  message: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 19,
    maxWidth: 280,
  },
  btn: { marginTop: spacing.lg, alignSelf: 'stretch' },
});
