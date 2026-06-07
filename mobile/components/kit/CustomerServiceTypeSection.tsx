import { ChevronRight } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SERVICE_TYPE_KEYS, type ServiceTypeKey } from '@/constants/serviceTypes';
import { SERVICE_TYPE_META } from '@/constants/serviceTypeMeta';
import { colors, fonts, premium, spacing } from '@/constants/theme';

/** Primary pest types shown on home — matches mrantidot.com catalog focus. */
const FEATURED_TYPES: ServiceTypeKey[] = [
  'general',
  'cockroach',
  'mosquito',
  'rodent',
  'termite',
  'bed_bug',
  'fumigation',
  'deep_cleaning',
];

export function CustomerServiceTypeSection() {
  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text style={styles.title}>Browse by pest type</Text>
        <Pressable
          style={({ pressed }) => [styles.viewAll, pressed && styles.pressed]}
          onPress={() => router.push('/(customer)/services')}
        >
          <Text style={styles.viewAllText}>All types</Text>
          <ChevronRight size={16} color={colors.green} />
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {FEATURED_TYPES.map((key) => {
          const meta = SERVICE_TYPE_META[key];
          const Icon = meta.icon;
          return (
            <Pressable
              key={key}
              style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
              onPress={() => router.push(`/browse/${key}`)}
            >
              <View style={[styles.chipIcon, { backgroundColor: meta.bg }]}>
                <Icon size={18} color={meta.color} strokeWidth={2.2} />
              </View>
              <Text style={styles.chipLabel} numberOfLines={2}>
                {meta.label}
              </Text>
            </Pressable>
          );
        })}
        <Pressable
          style={({ pressed }) => [styles.chip, styles.moreChip, pressed && styles.pressed]}
          onPress={() => router.push('/(customer)/services')}
        >
          <Text style={styles.moreLabel}>+{SERVICE_TYPE_KEYS.length - FEATURED_TYPES.length} more</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.md, gap: spacing.sm },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  title: { fontFamily: fonts.displayExtra, fontSize: 17, color: colors.ink },
  viewAll: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewAllText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.green },
  row: { paddingHorizontal: spacing.md, gap: 10, paddingBottom: 4 },
  chip: {
    width: 92,
    minHeight: 96,
    padding: 10,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    ...premium.shadowSoft,
  },
  chipIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  chipLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: colors.ink,
    textAlign: 'center',
    lineHeight: 14,
  },
  moreChip: { justifyContent: 'center' },
  moreLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: colors.green,
    textAlign: 'center',
  },
  pressed: { opacity: 0.92 },
});
