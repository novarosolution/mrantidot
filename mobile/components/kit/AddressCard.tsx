import { memo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import type { SavedAddress } from '@/types/api';
import { colors, fonts, spacing, ui } from '@/constants/theme';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';

function labelIcon(label: string): LucideIcon {
  const l = label.toLowerCase();
  if (l.includes('home') || l.includes('house')) return AppIcons.property.home;
  return AppIcons.ui.mapPin;
}

function AddressCardComponent({
  address,
  selected,
  onPress,
  footer,
}: {
  address: SavedAddress;
  selected?: boolean;
  onPress?: () => void;
  /** Rendered inside the card under a divider (e.g. manage actions). */
  footer?: ReactNode;
}) {
  const copy = useCustomerUiCopy();
  const icon = labelIcon(address.label);

  const inner = (
    <View style={[styles.shell, selected && styles.cardSelected]}>
    <View style={styles.card}>
      <View style={[styles.iconBox, selected && styles.iconBoxOn]}>
        <PremiumIcon
          icon={icon}
          variant="plain"
          size={18}
          color={selected ? colors.white : ui.brand}
        />
      </View>
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={styles.label} numberOfLines={1}>
            {address.label}
          </Text>
          {address.isDefault ? (
            <View style={styles.defaultPill}>
              <Text style={styles.defaultText}>{copy.addressesDefaultBadge}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.line} numberOfLines={2}>
          {address.line1}
        </Text>
        <Text style={styles.meta}>
          {address.city}
          {address.pincode ? ` · ${address.pincode}` : ''}
        </Text>
      </View>
      {onPress ? (
        <View style={[styles.radio, selected && styles.radioOn]}>
          {selected ? (
            <PremiumIcon icon={AppIcons.ui.check} variant="plain" size={13} color={colors.white} strokeWidth={3} />
          ) : null}
        </View>
      ) : null}
    </View>
    {footer}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}>
        {inner}
      </Pressable>
    );
  }
  return <View style={styles.pressable}>{inner}</View>;
}

export const AddressCard = memo(AddressCardComponent);

const styles = StyleSheet.create({
  pressable: { marginBottom: spacing.sm },
  pressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
  shell: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardSelected: {
    borderColor: ui.brand,
    backgroundColor: ui.brandSoft,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: ui.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxOn: { backgroundColor: ui.brand },
  body: { flex: 1, minWidth: 0 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: {
    flex: 1,
    fontFamily: fonts.displaySemi,
    fontSize: 15,
    letterSpacing: -0.2,
    color: ui.text,
  },
  defaultPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
  },
  defaultText: { fontFamily: fonts.bodyBold, fontSize: 10, color: ui.brand },
  line: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: ui.text,
    marginTop: 3,
    lineHeight: 18,
  },
  meta: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: ui.textSecondary,
    marginTop: 2,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: ui.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  radioOn: {
    backgroundColor: ui.brand,
    borderColor: ui.brand,
  },
});
