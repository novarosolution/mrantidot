import { LinearGradient } from 'expo-linear-gradient';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { ServiceIcon } from '@/components/ServiceIcon';
import { serviceDisplayRating } from '@/lib/ratings';
import type { Service } from '@/types/api';
import { colors, customerType, premium, spacing, surfaces } from '@/constants/theme';

const COLS = 2;
const GAP = 10;

export function catalogCardWidth() {
  const pad = spacing.md * 2;
  return (Dimensions.get('window').width - pad - GAP * (COLS - 1)) / COLS;
}

function durationLabel(service: Service): string {
  const steps = service.stepTemplate?.length ?? 0;
  return steps > 0 ? `~${Math.max(30, steps * 15)}m` : '~45m';
}

export function ServiceCatalogCard({
  service,
  width,
  onPress,
  onBook,
}: {
  service: Service;
  width?: number;
  onPress: () => void;
  onBook: () => void;
}) {
  const rating = serviceDisplayRating(service);
  const w = width ?? catalogCardWidth();

  return (
    <Pressable
      style={({ pressed }) => [styles.card, { width: w }, pressed && styles.pressed]}
      onPress={onPress}
    >
      <LinearGradient colors={['#8FD03C', '#27A747']} style={styles.goldBar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
      <View style={styles.iconWrap}>
        <ServiceIcon iconKey={service.iconKey} size={22} variant="premium" boxSize={52} color={colors.forest} strokeWidth={2.2} />
      </View>
      <Text style={styles.name} numberOfLines={2}>
        {service.name}
      </Text>
      <View style={styles.metaRow}>
        <View style={styles.metaChip}>
          <PremiumIcon icon={AppIcons.ui.clock} variant="plain" size={10} color={colors.forest} />
          <Text style={styles.metaText}>{durationLabel(service)}</Text>
        </View>
        {rating > 0 ? (
          <View style={styles.metaChip}>
            <PremiumIcon icon={AppIcons.ui.star} variant="plain" size={10} color={premium.accentGold} fill={premium.accentGold} />
            <Text style={styles.metaText}>{rating.toFixed(1)}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.footer}>
        <Text style={styles.price}>₹{service.basePrice}</Text>
        <Pressable
          style={({ pressed }) => [styles.bookBtn, pressed && styles.bookPressed]}
          onPress={onBook}
          hitSlop={6}
        >
          <Text style={styles.bookText}>Book</Text>
          <PremiumIcon icon={AppIcons.ui.arrowRight} variant="plain" size={12} color={colors.white} strokeWidth={2.5} />
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: surfaces.glass,
    borderRadius: premium.radiusCard,
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
    padding: spacing.sm + 2,
    marginBottom: GAP,
    overflow: 'hidden',
    ...premium.shadowSoft,
  },
  pressed: { opacity: 0.92, transform: [{ scale: 0.98 }] },
  goldBar: {
    height: 3,
    marginHorizontal: -(spacing.sm + 2),
    marginTop: -(spacing.sm + 2),
    marginBottom: spacing.sm,
  },
  iconWrap: {
    marginBottom: spacing.sm,
    alignItems: 'flex-start',
  },
  name: {
    ...customerType.serviceGridTitle,
    minHeight: 34,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: surfaces.glassSoft,
    borderWidth: 1,
    borderColor: surfaces.glassBorder,
  },
  metaText: { ...customerType.kicker, fontSize: 10, color: colors.forest },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: surfaces.glassBorderStrong,
  },
  price: { ...customerType.listPrice },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: colors.forest,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  bookPressed: { opacity: 0.88 },
  bookText: { ...customerType.pillLabel, fontSize: 10, color: colors.white },
});
