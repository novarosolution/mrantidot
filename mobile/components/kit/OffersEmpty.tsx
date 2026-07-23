import { StyleSheet, Text, View } from 'react-native';
import { GlassPanel } from '@/components/kit/GlassScreenKit';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { Button } from '@/components/ui/Button';
import { colors, customerType, premium, spacing } from '@/constants/theme';
import { customerRoutes, appPush } from '@/lib/routes';

export function OffersEmpty() {
  return (
    <View style={styles.wrap}>
      <GlassPanel style={styles.card} tone="clear" intensity={44} goldEdge padded={false}>
        <View style={styles.inner}>
          <PremiumIcon
            icon={AppIcons.quick.offers}
            variant="ring"
            size={28}
            color={colors.forest}
            strokeWidth={1.9}
            boxSize={72}
          />
          <Text style={styles.title}>No offers right now</Text>
          <Text style={styles.message}>
            New coupons and seasonal deals will show up here. Book a service anytime at regular pricing.
          </Text>
          <Button
            title="Browse services"
            variant="premium"
            onPress={() => appPush(customerRoutes.services)}
            style={styles.btn}
          />
        </View>
      </GlassPanel>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', padding: spacing.md, paddingTop: spacing.xl },
  card: {
    borderRadius: premium.radiusCard,
    maxWidth: 340,
    alignSelf: 'center',
    width: '100%',
  },
  inner: {
    padding: spacing.lg,
    alignItems: 'center',
    gap: 10,
  },
  title: { ...customerType.emptyTitle },
  message: {
    ...customerType.emptyBody,
    maxWidth: 280,
  },
  btn: { marginTop: spacing.sm, alignSelf: 'stretch' },
});
