import { LinearGradient } from 'expo-linear-gradient';
import {
  Building2,
  Home,
  LayoutGrid,
  Search,
  Sparkles,
  SprayCan,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SERVICE_TYPE_LABELS, type ServiceTypeKey } from '@/constants/serviceTypes';
import { SERVICE_TYPE_META } from '@/constants/serviceTypeMeta';
import { colors, fonts, premium, shadows, spacing } from '@/constants/theme';
import { textInputDefaults } from '@/components/ui/textInputDefaults';

function categoryIcon(category?: string): LucideIcon {
  switch (category) {
    case 'residential':
      return Home;
    case 'commercial':
      return Building2;
    case 'cleaning':
      return Sparkles;
    default:
      return LayoutGrid;
  }
}

function FilterChip({
  label,
  icon: Icon,
  selected,
  onPress,
  tint,
  bg,
}: {
  label: string;
  icon: LucideIcon;
  selected: boolean;
  onPress: () => void;
  tint?: string;
  bg?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        chipStyles.chip,
        selected ? chipStyles.chipOn : chipStyles.chipOff,
        pressed && chipStyles.pressed,
      ]}
    >
      <View style={[chipStyles.iconBox, selected ? chipStyles.iconBoxOn : { backgroundColor: bg ?? colors.soft }]}>
        <Icon size={14} color={selected ? colors.white : tint ?? colors.forest} strokeWidth={2.2} />
      </View>
      <Text style={[chipStyles.chipLabel, selected && chipStyles.chipLabelOn]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Floating filter card — sits below the green hero, not inside it. */
export function ServicesFilterPanel({
  search,
  onSearchChange,
  searchPlaceholder,
  onSearchSubmit,
  categoryChips,
  categorySelected,
  onCategorySelect,
  pestTypes,
  pestSelected,
  onPestSelect,
  trustBadges,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder: string;
  onSearchSubmit?: () => void;
  categoryChips: { label: string; category?: string }[];
  categorySelected: string;
  onCategorySelect: (label: string) => void;
  pestTypes: ServiceTypeKey[];
  pestSelected: 'all' | ServiceTypeKey;
  onPestSelect: (key: 'all' | ServiceTypeKey) => void;
  trustBadges?: string[];
}) {
  const badges = trustBadges?.slice(0, 3) ?? [];

  return (
    <View style={panelStyles.outer}>
      <View style={panelStyles.card}>
        <LinearGradient colors={['#D4A017', '#B6841C']} style={panelStyles.goldBar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />

        <View style={panelStyles.searchRow}>
          <Search size={18} color={colors.forest} strokeWidth={2.2} />
          <TextInput
            style={panelStyles.searchInput}
            {...textInputDefaults}
            placeholder={searchPlaceholder}
            placeholderTextColor={colors.muted}
            value={search}
            onChangeText={onSearchChange}
            returnKeyType="search"
            onSubmitEditing={onSearchSubmit}
          />
          {search.length > 0 ? (
            <Pressable onPress={() => onSearchChange('')} hitSlop={8} style={panelStyles.clearBtn}>
              <X size={14} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>

        <Text style={panelStyles.sectionLabel}>Categories</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={panelStyles.chipRow}>
          {categoryChips.map((chip) => {
            const Icon = chip.category ? categoryIcon(chip.category) : SprayCan;
            const active = categorySelected === chip.label;
            return (
              <FilterChip
                key={chip.label}
                label={chip.label}
                icon={Icon}
                selected={active}
                onPress={() => onCategorySelect(chip.label)}
              />
            );
          })}
        </ScrollView>

        {pestTypes.length > 0 ? (
          <>
            <Text style={panelStyles.sectionLabel}>Pest types</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={panelStyles.chipRow}>
              <FilterChip
                label="All types"
                icon={LayoutGrid}
                selected={pestSelected === 'all'}
                onPress={() => onPestSelect('all')}
              />
              {pestTypes.map((t) => {
                const meta = SERVICE_TYPE_META[t];
                return (
                  <FilterChip
                    key={t}
                    label={SERVICE_TYPE_LABELS[t]}
                    icon={meta.icon}
                    selected={pestSelected === t}
                    onPress={() => onPestSelect(t)}
                    tint={meta.color}
                    bg={meta.bg}
                  />
                );
              })}
            </ScrollView>
          </>
        ) : null}

        {badges.length > 0 ? (
          <View style={panelStyles.trustRow}>
            {badges.map((b) => (
              <View key={b} style={panelStyles.trustChip}>
                <Text style={panelStyles.trustText}>{b}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

export function ServicesStatsStrip({
  total,
  topRated,
  categories,
}: {
  total: number;
  topRated: number;
  categories: number;
}) {
  return (
    <View style={stripStyles.wrap}>
      <LinearGradient colors={['#FFFFFF', '#F6FAF7']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />
      <LinearGradient colors={['#D4A017', '#B6841C']} style={stripStyles.goldBar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
      <View style={stripStyles.row}>
        <View style={stripStyles.cell}>
          <Text style={stripStyles.value}>{total}</Text>
          <Text style={stripStyles.label}>Services</Text>
        </View>
        <View style={[stripStyles.cell, stripStyles.border]}>
          <Text style={stripStyles.value}>{topRated}</Text>
          <Text style={stripStyles.label}>Top rated</Text>
        </View>
        <View style={stripStyles.cell}>
          <Text style={stripStyles.value}>{categories}</Text>
          <Text style={stripStyles.label}>Categories</Text>
        </View>
      </View>
    </View>
  );
}

export function ServicesSortBar({
  sort,
  onSort,
  countLabel,
}: {
  sort: 'popular' | 'rating' | 'price';
  onSort: (s: 'popular' | 'rating' | 'price') => void;
  countLabel: string;
}) {
  const sorts = [
    { key: 'popular' as const, label: 'Popular' },
    { key: 'rating' as const, label: 'Top rated' },
    { key: 'price' as const, label: 'Price' },
  ];
  return (
    <View style={sortStyles.wrap}>
      <Text style={sortStyles.count}>{countLabel}</Text>
      <View style={sortStyles.row}>
        {sorts.map((s) => {
          const active = sort === s.key;
          return (
            <Pressable
              key={s.key}
              onPress={() => onSort(s.key)}
              style={[sortStyles.chip, active && sortStyles.chipOn]}
            >
              <Text style={[sortStyles.chipText, active && sortStyles.chipTextOn]}>{s.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const panelStyles = StyleSheet.create({
  outer: {
    marginTop: -28,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    zIndex: 2,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: premium.radiusCard,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.07)',
    overflow: 'hidden',
    ...shadows.floating,
  },
  goldBar: {
    height: 3,
    marginHorizontal: -spacing.md,
    marginTop: -spacing.md,
    marginBottom: spacing.sm,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 48,
    paddingHorizontal: spacing.sm,
    borderRadius: 14,
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.08)',
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.ink,
    paddingVertical: 0,
  },
  clearBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.sm,
    marginBottom: 8,
  },
  chipRow: {
    gap: 8,
    paddingBottom: 2,
  },
  trustRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  trustChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: colors.soft,
  },
  trustText: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    color: colors.forest,
  },
});

const chipStyles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 12,
    paddingLeft: 4,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.1)',
    backgroundColor: colors.white,
    marginRight: 4,
  },
  chipOn: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  chipOff: {},
  pressed: { opacity: 0.9 },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxOn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  chipLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: colors.forest,
    maxWidth: 100,
  },
  chipLabelOn: {
    color: colors.white,
  },
});

const stripStyles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.sm,
    borderRadius: premium.radiusCard,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.07)',
    ...shadows.card,
  },
  goldBar: { height: 3, width: '100%' },
  row: { flexDirection: 'row', paddingVertical: spacing.md },
  cell: { flex: 1, alignItems: 'center' },
  border: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(20,83,45,0.1)',
  },
  value: {
    fontFamily: fonts.displayExtra,
    fontSize: 20,
    color: colors.forest,
    letterSpacing: -0.3,
  },
  label: {
    fontFamily: fonts.body,
    fontSize: 9,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
});

const sortStyles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  count: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: colors.muted,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.1)',
  },
  chipOn: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  chipText: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: colors.forest,
  },
  chipTextOn: {
    color: colors.white,
  },
});
