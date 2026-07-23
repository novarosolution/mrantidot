import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { HomeSectionTitle } from '@/components/kit/HomeSectionTitle';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { GlassPanel } from '@/components/kit/GlassScreenKit';
import { AppIcons } from '@/constants/appIcons';
import { SERVICE_TYPE_KEYS, type ServiceTypeKey } from '@/constants/serviceTypes';
import { SERVICE_TYPE_META } from '@/constants/serviceTypeMeta';
import { fonts } from '@/constants/theme';
import { customerRoutes, sharedRoutes, appPush } from '@/lib/routes';
import { homeShadow } from '@/components/kit/homeUi';

const FEATURED_TYPES: ServiceTypeKey[] = ['cockroach', 'mosquito', 'ant', 'termite'];

const COLS = 4;
const GAP = 10;
const H_PAD = 20;

function chipWidth() {
  return (Dimensions.get('window').width - H_PAD * 2 - GAP * (COLS - 1)) / COLS;
}

export function CustomerServiceTypeSection({
  title = 'Service types',
}: {
  title?: string;
  actionLabel?: string;
}) {
  const width = chipWidth();
  const more = Math.max(0, SERVICE_TYPE_KEYS.length - FEATURED_TYPES.length);

  return (
    <View style={styles.wrap}>
      <HomeSectionTitle title={title} onAction={() => appPush(customerRoutes.services)} />
      <View style={styles.grid}>
        {FEATURED_TYPES.map((key) => {
          const meta = SERVICE_TYPE_META[key];
          return (
            <Pressable
              key={key}
              style={({ pressed }) => [{ width }, pressed && styles.pressed]}
              onPress={() => appPush(sharedRoutes.browse(key))}
            >
              <GlassPanel style={styles.chip} padded={false} tone="mint" intensity={42}>
                <View style={styles.chipInner}>
                  <PremiumIcon icon={meta.icon} variant="glass" size={22} color={meta.color} boxSize={48} />
                  <Text style={styles.chipLabel} numberOfLines={1}>
                    {meta.label}
                  </Text>
                </View>
              </GlassPanel>
            </Pressable>
          );
        })}
      </View>
      {more > 0 ? (
        <Pressable
          style={({ pressed }) => [styles.moreRow, pressed && { opacity: 0.85 }]}
          onPress={() => appPush(customerRoutes.services)}
        >
          <Text style={styles.moreText}>View all {SERVICE_TYPE_KEYS.length} treatments</Text>
          <PremiumIcon icon={AppIcons.ui.arrowRight} variant="plain" size={14} color="#1A8734" strokeWidth={2.4} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingTop: 22 },
  grid: {
    flexDirection: 'row',
    paddingHorizontal: H_PAD,
    marginTop: 14,
    gap: GAP,
  },
  chip: {
    borderRadius: 20,
    ...homeShadow.soft,
  },
  chipInner: {
    alignItems: 'center',
    gap: 8,
    paddingTop: 14,
    paddingBottom: 12,
    paddingHorizontal: 4,
  },
  chipLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: '#2F3D31',
    maxWidth: '100%',
  },
  moreRow: {
    marginTop: 14,
    marginHorizontal: H_PAD,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  moreText: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: '#1A8734',
  },
  pressed: { transform: [{ scale: 0.94 }] },
});
