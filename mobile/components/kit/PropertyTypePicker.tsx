import type { LucideIcon } from 'lucide-react-native';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import {
  PROPERTY_TYPE_GROUPS,
  PROPERTY_TYPE_LABELS,
  type PropertyTypeKey,
} from '@/constants/propertyTypes';
import { colors, fonts, premium, spacing } from '@/constants/theme';

const PROPERTY_ICONS: Record<PropertyTypeKey, LucideIcon> = {
  '1bhk': AppIcons.property.home,
  '2bhk': AppIcons.property.home,
  '3bhk': AppIcons.property.home,
  '4bhk': AppIcons.property.home,
  bungalow: AppIcons.property.home,
  office: AppIcons.property.apartment,
  cafe_restaurant: AppIcons.property.store,
  hotel: AppIcons.property.hotel,
  warehouse: AppIcons.property.warehouse,
  factory: AppIcons.property.factory,
};

const COLS = 3;
const GAP = 10;

function tileWidth(containerPad = 0) {
  const usable = Dimensions.get('window').width - containerPad - GAP * (COLS - 1);
  return Math.floor(usable / COLS);
}

export function PropertyTypePicker({
  value,
  onChange,
  /** Horizontal inset already applied by parent (panel padding). */
  contentInset = 48,
}: {
  value: PropertyTypeKey | null;
  onChange: (next: PropertyTypeKey) => void;
  contentInset?: number;
}) {
  const width = tileWidth(contentInset);

  return (
    <View style={styles.wrap}>
      {PROPERTY_TYPE_GROUPS.map((group) => (
        <View key={group.title} style={styles.group}>
          <Text style={styles.groupTitle}>{group.title}</Text>
          <View style={styles.grid}>
            {group.keys.map((key) => {
              const icon = PROPERTY_ICONS[key] ?? AppIcons.property.home;
              const selected = value === key;
              return (
                <Pressable
                  key={key}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  style={({ pressed }) => [
                    styles.tile,
                    { width },
                    selected && styles.tileSelected,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => onChange(key)}
                >
                  <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
                    <PremiumIcon
                      icon={icon}
                      variant="plain"
                      size={20}
                      color={selected ? colors.forest : colors.secondaryDark}
                    />
                  </View>
                  <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={2}>
                    {PROPERTY_TYPE_LABELS[key]}
                  </Text>
                  {selected ? (
                    <View style={styles.check}>
                      <PremiumIcon icon={AppIcons.ui.check} variant="plain" size={12} color={colors.white} strokeWidth={3} />
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
  wrap: { gap: spacing.lg, width: '100%' },
  group: { gap: spacing.sm, width: '100%' },
  groupTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: colors.forest,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
    width: '100%',
  },
  tile: {
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
