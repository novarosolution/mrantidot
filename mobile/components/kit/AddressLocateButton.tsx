import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { colors, fonts, ui } from '@/constants/theme';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';

export function AddressLocateButton({
  loading,
  onPress,
}: {
  loading?: boolean;
  onPress: () => void;
}) {
  const copy = useCustomerUiCopy();
  return (
    <Pressable
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
      accessibilityLabel={loading ? copy.locateFinding : copy.locateUse}
      accessibilityState={{ busy: Boolean(loading), disabled: Boolean(loading) }}
    >
      <View style={styles.iconWrap}>
        {loading ? (
          <ActivityIndicator color={ui.brand} size="small" />
        ) : (
          <PremiumIcon icon={AppIcons.ui.locate} variant="plain" size={20} color={ui.brand} strokeWidth={2.2} fill="none" />
        )}
      </View>
      <View style={styles.textCol}>
        <Text style={styles.title}>{loading ? copy.locateFinding : copy.locateUse}</Text>
        <Text style={styles.sub}>{loading ? copy.locateFindingSub : copy.locateUseSub}</Text>
      </View>
      {!loading ? (
        <PremiumIcon icon={AppIcons.ui.chevronRight} variant="plain" size={18} color={ui.brand} strokeWidth={2.4} fill="none" />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.border,
  },
  pressed: { backgroundColor: ui.brandSoft },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ui.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: { flex: 1, minWidth: 0 },
  title: { fontFamily: fonts.bodyBold, fontSize: 15, color: ui.brand, letterSpacing: -0.2 },
  sub: {
    fontFamily: fonts.body,
    fontSize: 12.5,
    color: ui.textSecondary,
    marginTop: 2,
  },
});
