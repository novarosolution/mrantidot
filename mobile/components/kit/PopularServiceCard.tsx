import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Plus } from 'lucide-react-native';
import { ServiceIcon } from '@/components/ServiceIcon';
import { formatSocialProof } from '@/lib/display';
import type { Service } from '@/types/api';
import { colors, fonts, premium, shadows, spacing, typography } from '@/constants/theme';

export function PopularServiceCard({
  service,
  bookingCount,
  onPress,
}: {
  service: Service;
  bookingCount?: number;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.wrap}>
      <View style={styles.card}>
        <View style={styles.icon}>
          <ServiceIcon iconKey={service.iconKey} size={28} color={colors.lime} />
        </View>
        <View style={styles.body}>
          <Text style={styles.name}>{service.name}</Text>
          {formatSocialProof(bookingCount, service.rating) ? (
            <Text style={styles.rating}>{formatSocialProof(bookingCount, service.rating)}</Text>
          ) : null}
          <Text style={styles.price}>
            ₹{service.basePrice}{' '}
            <Text style={styles.per}>/ starting</Text>
          </Text>
        </View>
        <View style={styles.plus}>
          <Plus size={20} color={colors.green} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { marginHorizontal: spacing.md, marginBottom: spacing.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    backgroundColor: colors.white,
    borderRadius: premium.radiusCard,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.floating,
  },
  icon: {
    width: 66,
    height: 66,
    borderRadius: 16,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  name: { fontFamily: fonts.display, fontSize: 14, color: colors.ink },
  rating: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 3 },
  star: { color: colors.amber },
  price: { ...typography.price, fontSize: 17, marginTop: 6 },
  per: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, fontWeight: '500' },
  plus: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
