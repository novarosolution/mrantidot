import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { AppIcons } from '@/constants/appIcons';
import { Button } from '@/components/ui/Button';
import { useBookingCopy } from '@/lib/schedule-copy';
import { colors, fonts, spacing } from '@/constants/theme';

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
      <View style={styles.icon}>
        <AppIcons.quick.bookings size={28} color={colors.forest} strokeWidth={1.8} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {filter === 'active' ? (
        <Button
          title={copy.listBookServiceButton}
          variant="premium"
          onPress={() => router.push('/(customer)/services')}
          style={styles.btn}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 17,
    color: colors.ink,
    textAlign: 'center',
  },
  btn: { marginTop: spacing.lg, alignSelf: 'stretch', maxWidth: 280 },
});
