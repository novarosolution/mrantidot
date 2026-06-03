import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MapPin } from 'lucide-react-native';
import type { SavedAddress } from '@/types/api';
import { colors, fonts, premium, spacing } from '@/constants/theme';

export function AddressCard({
  address,
  selected,
  onPress,
}: {
  address: SavedAddress;
  selected?: boolean;
  onPress?: () => void;
}) {
  const inner = (
    <View style={[styles.card, selected && styles.cardSelected]}>
      <View style={styles.icon}>
        <MapPin size={18} color={colors.green} />
      </View>
      <View style={styles.body}>
        <View style={styles.row}>
          <Text style={styles.label}>{address.label}</Text>
          {address.isDefault ? <Text style={styles.defaultTag}>Default</Text> : null}
        </View>
        <Text style={styles.line}>{address.line1}</Text>
        <Text style={styles.meta}>
          {address.city}
          {address.pincode ? ` · ${address.pincode}` : ''}
        </Text>
      </View>
    </View>
  );

  if (onPress) {
    return <Pressable onPress={onPress}>{inner}</Pressable>;
  }
  return inner;
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: premium.radiusCard,
    backgroundColor: colors.white,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...premium.shadowSoft,
  },
  cardSelected: { borderWidth: 2, borderColor: colors.forest, backgroundColor: colors.soft },
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
  line: { fontFamily: fonts.body, fontSize: 13, color: colors.ink, marginTop: 6 },
  meta: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 2 },
});
