import { memo, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { homeShadow } from '@/components/kit/homeUi';
import { AppIcons } from '@/constants/appIcons';
import type { PaymentMethodRecord } from '@/types/api';
import { colors, fonts, premium, spacing, ui } from '@/constants/theme';

const TYPE_LABEL: Record<PaymentMethodRecord['type'], string> = {
  upi_card: 'UPI / Card at the visit',
  pay_after: 'Cash after the service',
};

function PaymentMethodCardComponent({ method, footer }: { method: PaymentMethodRecord; footer?: ReactNode }) {
  const isCash = method.type === 'pay_after';
  return (
    <View style={styles.card}>
      <View style={styles.inner}>
        <PremiumIcon
          icon={isCash ? AppIcons.payment.wallet : AppIcons.payment.card}
          variant="mint"
          size={20}
          color={colors.forest}
          boxSize={44}
        />
        <View style={styles.body}>
          <View style={styles.row}>
            <Text style={styles.label} numberOfLines={1}>
              {method.label}
            </Text>
            {method.isDefault ? (
              <View style={styles.defaultPill}>
                <Text style={styles.defaultText}>Default</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.meta} numberOfLines={1}>
            {TYPE_LABEL[method.type] ?? method.type}
            {method.details ? ` · ${method.details}` : ''}
          </Text>
        </View>
      </View>
      {footer}
    </View>
  );
}

export const PaymentMethodCard = memo(PaymentMethodCardComponent);

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
    padding: 14,
    borderRadius: premium.radiusCard,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    ...homeShadow.card,
  },
  inner: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  body: { flex: 1, minWidth: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { flexShrink: 1, fontFamily: fonts.displaySemi, fontSize: 15, letterSpacing: -0.2, color: ui.text },
  defaultPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: ui.brandSoft,
  },
  defaultText: { fontFamily: fonts.bodyBold, fontSize: 10, color: ui.brand },
  meta: { fontFamily: fonts.body, fontSize: 12.5, color: ui.textSecondary, marginTop: 3 },
});
