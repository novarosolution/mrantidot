import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Check, Home, MapPin } from 'lucide-react-native';
import type { SavedAddress } from '@/types/api';
import { colors, fonts, spacing } from '@/constants/theme';

function labelIcon(label: string) {
  const l = label.toLowerCase();
  if (l.includes('home') || l.includes('house')) return Home;
  return MapPin;
}

export function AddressCard({
  address,
  selected,
  onPress,
}: {
  address: SavedAddress;
  selected?: boolean;
  onPress?: () => void;
}) {
  const Icon = labelIcon(address.label);

  const inner = (
    <View style={[styles.card, selected && styles.cardSelected]}>
      <View style={[styles.icon, selected && styles.iconSelected]}>
        <Icon size={18} color={selected ? colors.forest : colors.green} strokeWidth={2.2} />
      </View>
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={1}>
            {address.label}
          </Text>
          {address.isDefault ? (
            <View style={styles.defaultPill}>
              <Text style={styles.defaultText}>Default</Text>
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
      <View style={[styles.radio, selected && styles.radioOn]}>
        {selected ? <Check size={14} color={colors.white} strokeWidth={3} /> : null}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}>
        {inner}
      </Pressable>
    );
  }
  return inner;
}

const styles = StyleSheet.create({
  pressable: { marginBottom: spacing.sm },
  pressed: { opacity: 0.92 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  cardSelected: {
    backgroundColor: colors.white,
    borderColor: colors.forest,
    shadowColor: '#0E3A20',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconSelected: {
    backgroundColor: colors.soft,
    borderColor: 'rgba(30,142,78,0.2)',
  },
  body: { flex: 1, minWidth: 0 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.ink, flex: 1 },
  labelSelected: { color: colors.forest },
  defaultPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: colors.soft,
  },
  defaultText: { fontFamily: fonts.bodySemi, fontSize: 9, color: colors.green },
  line: { fontFamily: fonts.body, fontSize: 13, color: colors.ink, marginTop: 4, lineHeight: 18 },
  meta: { fontFamily: fonts.body, fontSize: 11.5, color: colors.muted, marginTop: 2 },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  radioOn: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
});
