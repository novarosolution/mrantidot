import { StyleSheet, Text, View } from 'react-native';
import { CreditCard, Wallet } from 'lucide-react-native';
import type { PaymentMethodRecord } from '@/types/api';
import { colors, fonts, premium, spacing } from '@/constants/theme';

export function PaymentMethodCard({ method, selected }: { method: PaymentMethodRecord; selected?: boolean }) {
  const Icon = method.type === 'pay_after' ? Wallet : CreditCard;

  return (
    <View style={[styles.card, selected && styles.cardSelected]}>
      <View style={[styles.radio, selected && styles.radioOn]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
      <View style={styles.icon}>
        <Icon size={20} color={selected ? colors.forest : colors.green} />
      </View>
      <View style={styles.body}>
        <View style={styles.row}>
          <Text style={styles.label}>{method.label}</Text>
          {method.isDefault ? <Text style={styles.defaultTag}>Default</Text> : null}
        </View>
        <Text style={styles.meta}>
          {method.type.replace('_', ' ')}
          {method.details ? ` · ${method.details}` : ''}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: premium.radiusCard,
    backgroundColor: colors.white,
    marginBottom: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    minHeight: 72,
    ...premium.shadowSoft,
  },
  cardSelected: { borderWidth: 2, borderColor: colors.forest, backgroundColor: colors.soft },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: colors.green },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.green,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontFamily: fonts.display, fontSize: 14, color: colors.ink },
  defaultTag: { fontFamily: fonts.bodySemi, fontSize: 10, color: colors.green },
  meta: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.muted,
    marginTop: 6,
    textTransform: 'capitalize',
  },
});
