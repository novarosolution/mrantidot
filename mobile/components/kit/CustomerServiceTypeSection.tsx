import { ChevronRight } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { PremiumSectionHeader } from '@/components/ui/PremiumSectionHeader';
import { SERVICE_TYPE_KEYS, type ServiceTypeKey } from '@/constants/serviceTypes';
import { SERVICE_TYPE_META } from '@/constants/serviceTypeMeta';
import { colors, fonts, spacing } from '@/constants/theme';

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
      <PremiumSectionHeader
        title="Pest types"
        actionLabel="All"
        onAction={() => router.push('/(customer)/services')}
        compact
        showRule={false}
        style={styles.header}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
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
          <Text style={styles.moreCount}>+{SERVICE_TYPE_KEYS.length - FEATURED_TYPES.length}</Text>
          <ChevronRight size={14} color={colors.muted} />
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.xs },
  header: { marginTop: spacing.md, marginBottom: spacing.sm },
  row: { paddingHorizontal: spacing.md, gap: 10, paddingBottom: 2 },
  chip: {
    width: 76,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.07)',
  },
  chipIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  chipLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    color: colors.ink,
    textAlign: 'center',
    lineHeight: 13,
  },
  moreChip: {
    justifyContent: 'center',
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  moreCount: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: colors.forest,
    marginBottom: 2,
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
});
