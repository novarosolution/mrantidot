import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { GlassPanel } from '@/components/kit/GlassScreenKit';
import { homeShadow } from '@/components/kit/homeUi';
import { AppIcons } from '@/constants/appIcons';
import type { PaymentMethodRecord } from '@/types/api';
import { colors, fonts, premium, spacing, surfaces } from '@/constants/theme';

function PaymentMethodCardComponent({
  method,
  selected,
}: {
  method: PaymentMethodRecord;
  selected?: boolean;
}) {
  const icon = method.type === 'pay_after' ? AppIcons.payment.wallet : AppIcons.payment.card;

  return (
    <View style={styles.shell}>
      <GlassPanel
        style={[styles.card, selected && styles.cardSelected]}
        padded={false}
        tone={selected ? 'mint' : 'clear'}
        intensity={42}
        goldEdge
      >
        <View style={styles.inner}>
          <View style={[styles.radio, selected && styles.radioOn]}>
            {selected ? <View style={styles.radioDot} /> : null}
          </View>
          <PremiumIcon
            icon={icon}
            variant={selected ? 'premium' : 'mint'}
            size={20}
            color={selected ? '#FFFFFF' : colors.forest}
            boxSize={40}
          />
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
      </GlassPanel>
    </View>
  );
}

export const PaymentMethodCard = memo(PaymentMethodCardComponent);

const styles = StyleSheet.create({
  shell: {
    marginBottom: spacing.sm,
    borderRadius: premium.radiusCard,
    ...homeShadow.card,
  },
  card: {
    borderRadius: premium.radiusCard,
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: colors.forest,
  },
  inner: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    alignItems: 'center',
    minHeight: 72,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: surfaces.glassBorderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  radioOn: { borderColor: colors.forest },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.forest,
  },
  body: { flex: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontFamily: fonts.display, fontSize: 14, color: colors.ink },
  defaultTag: { fontFamily: fonts.bodySemi, fontSize: 10, color: colors.forest },
  meta: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
});
