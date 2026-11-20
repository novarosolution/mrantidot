import { LinearGradient } from 'expo-linear-gradient';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { PestImage } from '@/components/kit/ServiceThumb';
import { AppIcons } from '@/constants/appIcons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { PressableScale } from '@/components/ui/PressableScale';
import { TAB_BAR_SCROLL_PAD } from '@/components/kit/GlassScreenKit';
import { stagger } from '@/lib/motion';
import { SERVICE_TYPE_KEYS, type ServiceTypeKey } from '@/constants/serviceTypes';
import { SERVICE_TYPE_META } from '@/constants/serviceTypeMeta';
import type { Service } from '@/types/api';
import { colors, fonts, spacing, ui } from '@/constants/theme';

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
      <FadeSlideIn delay={stagger(0)} slideFrom={14}>
        <LinearGradient
          colors={[colors.headerGreen, colors.forest, colors.forestDeep]}
          locations={[0, 0.55, 1]}
          style={styles.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.heroKicker}>Service catalog</Text>
          <Text style={styles.heroTitle} numberOfLines={1}>
            {activeCount} active services
          </Text>
          <Text style={styles.heroSub} numberOfLines={1}>
            {services.length} total · tap a pest type
          </Text>
          <Pressable
            style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
            onPress={onAddService}
            accessibilityRole="button"
          >
            <PremiumIcon icon={AppIcons.ui.plus} variant="plain" size="sm" color={colors.forest} />
            <Text style={styles.addBtnText}>Add service</Text>
          </Pressable>
        </LinearGradient>
      </FadeSlideIn>

      <FadeSlideIn delay={stagger(1)} slideFrom={14}>
        <PressableScale
          style={styles.allTile}
          onPress={() => onSelectType('all')}
          accessibilityRole="button"
          accessibilityLabel={`All services, ${services.length} in catalog`}
        >
          <View style={styles.allIcon}>
            <PremiumIcon icon={AppIcons.brand} variant="mint" size="lg" color={colors.forest} boxSize={46} />
          </View>
          <View style={styles.allBody}>
            <Text style={styles.allTitle} numberOfLines={1}>
              All services
            </Text>
            <Text style={styles.allCount} numberOfLines={1}>
              {services.length} in catalog
            </Text>
          </View>
          <PremiumIcon icon={AppIcons.ui.chevronRight} variant="chevron" size="md" color={colors.muted} />
        </PressableScale>
      </FadeSlideIn>

      <FadeSlideIn delay={stagger(2)} slideFrom={14}>
        <Text style={styles.sectionTitle}>Pest control types</Text>
        <View style={styles.grid}>
          {SERVICE_TYPE_KEYS.map((key) => {
            const meta = SERVICE_TYPE_META[key];
            const count = countForType(services, key);
            return (
              <PressableScale
                key={key}
                containerStyle={styles.typeCell}
                style={styles.typeTile}
                onPress={() => onSelectType(key)}
                accessibilityRole="button"
                accessibilityLabel={`${meta.label}, ${count} service${count === 1 ? '' : 's'}`}
              >
                <View style={[styles.typeIcon, { backgroundColor: meta.bg }]}>
                  <PestImage source={meta.image} size={28} />
                </View>
                <Text style={styles.typeLabel} numberOfLines={2}>
                  {meta.label}
                </Text>
                <Text style={styles.typeCount} numberOfLines={1}>
                  {count} service{count === 1 ? '' : 's'}
                </Text>
              </PressableScale>
            );
          })}
        </View>
      </FadeSlideIn>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { padding: spacing.md, paddingBottom: TAB_BAR_SCROLL_PAD, gap: spacing.md },
  hero: {
    borderRadius: 20,
    padding: spacing.lg,
    overflow: 'hidden',
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
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    ...ui.shadow,
  },
  allIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allBody: { flex: 1, minWidth: 0 },
  allTitle: { fontFamily: fonts.bodySemi, fontSize: 15, color: ui.text },
  allCount: { fontFamily: fonts.body, fontSize: 12, color: ui.textSecondary, marginTop: 2 },
  sectionTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: colors.forest,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    paddingHorizontal: 2,
    marginBottom: spacing.sm,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  typeCell: { width: '31%' },
  typeTile: {
    flexGrow: 1,
    minHeight: 118,
    padding: 12,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    alignItems: 'center',
    ...ui.shadow,
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
    color: ui.text,
    textAlign: 'center',
    lineHeight: 15,
    minHeight: 30,
  },
  typeCount: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: ui.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
});
