import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, Plus } from 'lucide-react-native';
import { AppIcons } from '@/constants/appIcons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SERVICE_TYPE_KEYS, type ServiceTypeKey } from '@/constants/serviceTypes';
import { SERVICE_TYPE_META } from '@/constants/serviceTypeMeta';
import type { Service } from '@/types/api';
import { colors, fonts, premium, spacing } from '@/constants/theme';

function countForType(services: Service[], type: ServiceTypeKey): number {
  return services.filter((s) => s.serviceTypes?.includes(type)).length;
}

export function AdminServiceTypeGrid({
  services,
  onSelectType,
  onAddService,
}: {
  services: Service[];
  onSelectType: (type: ServiceTypeKey | 'all') => void;
  onAddService: () => void;
}) {
  const activeCount = services.filter((s) => s.active !== false).length;

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={['#14532D', '#1A6B3C']} style={styles.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Text style={styles.heroKicker}>Service catalog</Text>
        <Text style={styles.heroTitle}>{activeCount} active services</Text>
        <Text style={styles.heroSub}>{services.length} total · tap a pest type</Text>
        <Pressable style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]} onPress={onAddService}>
          <Plus size={16} color={colors.forest} />
          <Text style={styles.addBtnText}>Add service</Text>
        </Pressable>
      </LinearGradient>

      <Pressable
        style={({ pressed }) => [styles.allTile, pressed && styles.pressed]}
        onPress={() => onSelectType('all')}
      >
        <View style={styles.allIcon}>
          <AppIcons.brand size={22} color={colors.forest} />
        </View>
        <View style={styles.allBody}>
          <Text style={styles.allTitle}>All services</Text>
          <Text style={styles.allCount}>{services.length} in catalog</Text>
        </View>
        <ChevronRight size={18} color={colors.muted} />
      </Pressable>

      <Text style={styles.sectionTitle}>Pest control types</Text>
      <View style={styles.grid}>
        {SERVICE_TYPE_KEYS.map((key) => {
          const meta = SERVICE_TYPE_META[key];
          const Icon = meta.icon;
          const count = countForType(services, key);
          return (
            <Pressable
              key={key}
              style={({ pressed }) => [styles.typeTile, pressed && styles.pressed]}
              onPress={() => onSelectType(key)}
            >
              <View style={[styles.typeIcon, { backgroundColor: meta.bg }]}>
                <Icon size={22} color={meta.color} strokeWidth={2.2} />
              </View>
              <Text style={styles.typeLabel} numberOfLines={2}>
                {meta.label}
              </Text>
              <Text style={styles.typeCount}>
                {count} service{count === 1 ? '' : 's'}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },
  hero: {
    borderRadius: 20,
    padding: spacing.lg,
    overflow: 'hidden',
    ...premium.shadowSoft,
  },
  heroKicker: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontFamily: fonts.displayExtra,
    fontSize: 24,
    color: colors.lime,
    marginTop: 6,
  },
  heroSub: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: spacing.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.lime,
  },
  addBtnText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.forest },
  pressed: { opacity: 0.92 },
  allTile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    ...premium.shadowSoft,
  },
  allIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allBody: { flex: 1 },
  allTitle: { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink },
  allCount: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 2 },
  sectionTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.forest,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    paddingHorizontal: 2,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  typeTile: {
    width: '31%',
    minHeight: 118,
    padding: 12,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    ...premium.shadowSoft,
  },
  typeIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  typeLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 11.5,
    color: colors.ink,
    textAlign: 'center',
    lineHeight: 15,
    minHeight: 30,
  },
  typeCount: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.muted,
    marginTop: 4,
    textAlign: 'center',
  },
});
