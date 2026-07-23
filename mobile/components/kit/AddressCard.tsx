import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { GlassPanel } from '@/components/kit/GlassScreenKit';
import { homeShadow } from '@/components/kit/homeUi';
import { AppIcons } from '@/constants/appIcons';
import type { SavedAddress } from '@/types/api';
import { colors, customerType, premium, spacing, surfaces } from '@/constants/theme';

function labelIcon(label: string): LucideIcon {
  const l = label.toLowerCase();
  if (l.includes('home') || l.includes('house')) return AppIcons.property.home;
  return AppIcons.ui.mapPin;
}

function AddressCardComponent({
  address,
  selected,
  onPress,
}: {
  address: SavedAddress;
  selected?: boolean;
  onPress?: () => void;
}) {
  const icon = labelIcon(address.label);

  const inner = (
    <View style={styles.shell}>
      <GlassPanel
        style={[styles.card, selected && styles.cardSelected]}
        padded={false}
        tone={selected ? 'mint' : 'clear'}
        intensity={42}
        goldEdge
      >
        <View style={styles.row}>
          <PremiumIcon
            icon={icon}
            variant={selected ? 'premium' : 'mint'}
            size={18}
            color={selected ? '#FFFFFF' : colors.forest}
            boxSize={44}
          />
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
            {selected ? (
              <PremiumIcon icon={AppIcons.ui.check} variant="plain" size={14} color={colors.white} strokeWidth={3} />
            ) : null}
          </View>
        </View>
      </GlassPanel>
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
  pressed: { opacity: 0.92, transform: [{ scale: 0.995 }] },
  shell: {
    borderRadius: premium.radiusCard,
    ...homeShadow.card,
  },
  card: {
    borderRadius: premium.radiusCard,
  },
  cardSelected: {
    borderWidth: 1.5,
    borderColor: 'rgba(48,184,79,0.55)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
  },
  body: { flex: 1, minWidth: 0 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { ...customerType.cardTitle, flex: 1, color: colors.ink },
  labelSelected: { color: colors.forest },
  defaultPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#EAF6E3',
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
  },
  defaultText: { ...customerType.pillLabel, color: colors.forest },
  line: { ...customerType.menuDesc, fontSize: 13, color: colors.ink, marginTop: 4, lineHeight: 18 },
  meta: { ...customerType.listMetaMuted, marginTop: 2, color: colors.muted },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: surfaces.glassBorderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  radioOn: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
});
