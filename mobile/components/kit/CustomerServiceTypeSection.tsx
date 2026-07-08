import { ChevronRight } from 'lucide-react-native';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { PremiumSectionHeader } from '@/components/ui/PremiumSectionHeader';
import { SERVICE_TYPE_KEYS, type ServiceTypeKey } from '@/constants/serviceTypes';
import { SERVICE_TYPE_META } from '@/constants/serviceTypeMeta';
import { colors, customerType, spacing } from '@/constants/theme';

const FEATURED_TYPES: ServiceTypeKey[] = [
  'deep_cleaning',
  'cockroach',
  'mosquito',
  'rodent',
  'termite',
  'bed_bug',
  'fumigation',
];

const COLS = 4;
const GAP = 10;

function chipWidth() {
  const pad = spacing.md * 2;
  return (Dimensions.get('window').width - pad - GAP * (COLS - 1)) / COLS;
}

export function CustomerServiceTypeSection() {
  const width = chipWidth();

  return (
    <View style={styles.wrap}>
      <PremiumSectionHeader
        title="Service types"
        actionLabel="All"
        onAction={() => router.push('/(customer)/services')}
        compact
        showRule={false}
        style={styles.header}
      />
      <View style={styles.grid}>
        {FEATURED_TYPES.map((key) => {
          const meta = SERVICE_TYPE_META[key];
          const Icon = meta.icon;
          return (
            <Pressable
              key={key}
              style={({ pressed }) => [styles.chip, { width }, pressed && styles.pressed]}
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
          style={({ pressed }) => [styles.chip, styles.moreChip, { width }, pressed && styles.pressed]}
          onPress={() => router.push('/(customer)/services')}
        >
          <Text style={styles.moreCount}>+{SERVICE_TYPE_KEYS.length - FEATURED_TYPES.length}</Text>
          <ChevronRight size={14} color={colors.muted} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.xs },
  header: { marginTop: spacing.md, marginBottom: spacing.sm },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    gap: GAP,
  },
  chip: {
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
    ...customerType.kicker,
    fontSize: 10,
    lineHeight: 13,
    textTransform: 'none',
    letterSpacing: 0.05,
    color: colors.ink,
    textAlign: 'center',
  },
  moreChip: {
    justifyContent: 'center',
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  moreCount: {
    ...customerType.cardTitle,
    fontSize: 16,
    color: colors.forest,
    marginBottom: 2,
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
});
