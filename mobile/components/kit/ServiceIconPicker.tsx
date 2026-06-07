import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ServiceIcon } from '@/components/ServiceIcon';
import { Chip } from '@/components/ui/Chip';
import {
  SERVICE_ICON_CATEGORIES,
  SERVICE_ICON_DEFS,
  type ServiceIconCategory,
  serviceIconLabel,
} from '@/constants/serviceIcons';
import { colors, fonts, premium, shadows, spacing } from '@/constants/theme';

export function ServiceIconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (key: string) => void;
}) {
  const [category, setCategory] = useState<ServiceIconCategory | 'all'>('all');

  const filtered = useMemo(() => {
    if (category === 'all') return SERVICE_ICON_DEFS;
    return SERVICE_ICON_DEFS.filter((d) => d.category === category);
  }, [category]);

  return (
    <View style={styles.wrap}>
      <LinearGradient colors={['#14532D', '#0E3A20']} style={styles.preview} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.previewIcon}>
          <ServiceIcon iconKey={value} size={36} color={colors.lime} strokeWidth={2} />
        </View>
        <View style={styles.previewText}>
          <Text style={styles.previewLabel}>Selected icon</Text>
          <Text style={styles.previewName}>{serviceIconLabel(value)}</Text>
          <Text style={styles.previewKey}>{value}</Text>
        </View>
      </LinearGradient>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {SERVICE_ICON_CATEGORIES.map((c) => (
          <Chip
            key={c.key}
            label={c.label}
            selected={category === c.key}
            onPress={() => setCategory(c.key)}
          />
        ))}
      </ScrollView>

      <View style={styles.grid}>
        {filtered.map((def) => {
          const selected = value === def.key;
          return (
            <Pressable
              key={def.key}
              onPress={() => onChange(def.key)}
              style={({ pressed }) => [
                styles.tile,
                selected && styles.tileSelected,
                pressed && styles.tilePressed,
              ]}
            >
              <View style={[styles.tileIcon, selected && styles.tileIconSelected]}>
                <ServiceIcon iconKey={def.key} size={22} color={selected ? colors.lime : colors.forest} strokeWidth={2} />
              </View>
              <Text style={[styles.tileLabel, selected && styles.tileLabelSelected]} numberOfLines={1}>
                {def.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const TILE = 76;

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: premium.radiusCard,
    ...shadows.card,
  },
  previewIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  previewText: { flex: 1 },
  previewLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  previewName: {
    fontFamily: fonts.display,
    fontSize: 17,
    color: colors.white,
    marginTop: 2,
  },
  previewKey: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.lime,
    marginTop: 2,
  },
  filters: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tile: {
    width: TILE,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: 4,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tileSelected: {
    borderColor: colors.forest,
    backgroundColor: colors.soft,
    ...premium.shadowSoft,
  },
  tilePressed: { opacity: 0.9 },
  tileIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  tileIconSelected: {
    backgroundColor: colors.forest,
  },
  tileLabel: {
    fontFamily: fonts.body,
    fontSize: 9,
    color: colors.muted,
    textAlign: 'center',
  },
  tileLabelSelected: {
    fontFamily: fonts.bodySemi,
    color: colors.forest,
  },
});
