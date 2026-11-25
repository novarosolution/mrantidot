import { StyleSheet, Text, View } from 'react-native';
import { TicketPercent } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { colors, fonts, radii, spacing, ui } from '@/constants/theme';
import { customerRoutes, appPush } from '@/lib/routes';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';

export function OffersEmpty({ hint }: { hint?: string }) {
  const copy = useCustomerUiCopy();
  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <View style={styles.icon}>
          <TicketPercent size={28} color={ui.brand} strokeWidth={1.9} />
        </View>
        <Text style={styles.title} accessibilityRole="header">
          {copy.offersEmptyTitle}
        </Text>
        <Text style={styles.message}>{hint?.trim() || copy.offersEmptyMessage}</Text>
        <Button
          title={copy.offersBrowseLabel}
          variant="premium"
          onPress={() => appPush(customerRoutes.services)}
          style={styles.btn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', padding: spacing.md, paddingTop: spacing.xl },
  card: {
    borderRadius: radii.card,
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
  btn: { marginTop: spacing.sm, alignSelf: 'stretch' },
});
