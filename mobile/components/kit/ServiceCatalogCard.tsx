import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Clock, Star } from 'lucide-react-native';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { ServiceIcon } from '@/components/ServiceIcon';
import { serviceDisplayRating } from '@/lib/ratings';
import type { Service } from '@/types/api';
import { colors, fonts, premium, shadows, spacing } from '@/constants/theme';

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
      <LinearGradient colors={['#D4A017', '#B6841C']} style={styles.goldBar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
      <View style={styles.iconWrap}>
        <ServiceIcon iconKey={service.iconKey} size={26} color={colors.forest} strokeWidth={2.2} />
      </View>
      <Text style={styles.name} numberOfLines={2}>
        {service.name}
      </Text>
      <View style={styles.metaRow}>
        <View style={styles.metaChip}>
          <Clock size={10} color={colors.forest} />
          <Text style={styles.metaText}>{durationLabel(service)}</Text>
        </View>
        {rating > 0 ? (
          <View style={styles.metaChip}>
            <Star size={10} color={premium.accentGold} fill={premium.accentGold} />
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
          <ArrowRight size={12} color={colors.white} strokeWidth={2.5} />
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.07)',
    padding: spacing.sm + 2,
    marginBottom: GAP,
    overflow: 'hidden',
    ...shadows.card,
  },
  pressed: { opacity: 0.92, transform: [{ scale: 0.98 }] },
  goldBar: {
    height: 3,
    marginHorizontal: -(spacing.sm + 2),
    marginTop: -(spacing.sm + 2),
    marginBottom: spacing.sm,
  },
  iconWrap: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  name: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    lineHeight: 17,
    color: colors.ink,
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
    backgroundColor: colors.soft,
  },
  metaText: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    color: colors.forest,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  price: {
    fontFamily: fonts.displayExtra,
    fontSize: 17,
    color: premium.accentGold,
    letterSpacing: -0.3,
  },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: colors.forest,
  },
  bookPressed: { opacity: 0.88 },
  bookText: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});
