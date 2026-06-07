import { Building2, Check, Factory, Home, Hotel, Store, Warehouse } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  PROPERTY_TYPE_GROUPS,
  PROPERTY_TYPE_LABELS,
  type PropertyTypeKey,
} from '@/constants/propertyTypes';
import { colors, fonts, premium, spacing } from '@/constants/theme';

const PROPERTY_ICONS: Record<PropertyTypeKey, typeof Home> = {
  '1bhk': Home,
  '2bhk': Home,
  '3bhk': Home,
  '4bhk': Home,
  bungalow: Home,
  office: Building2,
  cafe_restaurant: Store,
  hotel: Hotel,
  warehouse: Warehouse,
  factory: Factory,
};

export function PropertyTypePicker({
  value,
  onChange,
}: {
  value: PropertyTypeKey | null;
  onChange: (next: PropertyTypeKey) => void;
}) {
  return (
    <View style={styles.wrap}>
      {PROPERTY_TYPE_GROUPS.map((group) => (
        <View key={group.title} style={styles.group}>
          <Text style={styles.groupTitle}>{group.title}</Text>
          <View style={styles.grid}>
            {group.keys.map((key) => {
              const Icon = PROPERTY_ICONS[key];
              const selected = value === key;
              return (
                <Pressable
                  key={key}
                  style={({ pressed }) => [
                    styles.tile,
                    selected && styles.tileSelected,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => onChange(key)}
                >
                  <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
                    <Icon size={20} color={selected ? colors.forest : colors.secondaryDark} />
                  </View>
                  <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={2}>
                    {PROPERTY_TYPE_LABELS[key]}
                  </Text>
                  {selected ? (
                    <View style={styles.check}>
                      <Check size={12} color={colors.white} strokeWidth={3} />
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.lg },
  group: { gap: spacing.sm },
  groupTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: colors.forest,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: {
    width: '31%',
    minHeight: 96,
    padding: 12,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    position: 'relative',
    ...premium.shadowSoft,
  },
  tileSelected: {
    borderColor: colors.green,
    backgroundColor: '#F0FDF4',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconWrapSelected: { backgroundColor: colors.lime },
  label: {
    fontFamily: fonts.bodySemi,
    fontSize: 11.5,
    color: colors.ink,
    textAlign: 'center',
    lineHeight: 15,
  },
  labelSelected: { color: colors.forest },
  check: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.92 },
});
