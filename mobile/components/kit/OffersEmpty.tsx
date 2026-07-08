import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { AppIcons } from '@/constants/appIcons';
import { Button } from '@/components/ui/Button';
import { colors, customerType, premium, shadows, spacing } from '@/constants/theme';

export function OffersEmpty() {
  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <View style={styles.icon}>
          <AppIcons.quick.offers size={32} color={premium.accentGold} strokeWidth={1.8} />
        </View>
        <Text style={styles.title}>No offers right now</Text>
        <Text style={styles.message}>New coupons and seasonal deals will show up here. Book a service anytime at regular pricing.</Text>
        <Button title="Browse services" variant="premium" onPress={() => router.push('/(customer)/services')} style={styles.btn} />
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
    backgroundColor: premium.accentGoldBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(182,132,28,0.2)',
  },
  title: { ...customerType.emptyTitle },
  message: {
    ...customerType.emptyBody,
    marginTop: spacing.sm,
    maxWidth: 280,
  },
  btn: { marginTop: spacing.lg, alignSelf: 'stretch' },
});
