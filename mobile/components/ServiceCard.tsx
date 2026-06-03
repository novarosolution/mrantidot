import { StyleSheet, Text, View } from 'react-native';
import { Plus } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { ServiceIcon } from '@/components/ServiceIcon';
import type { Service } from '@/types/api';
import { colors, fonts, premium, spacing } from '@/constants/theme';

export function ServiceCard({ service, onPress, compact }: { service: Service; onPress: () => void; compact?: boolean }) {
  return (
    <Card variant="premium" onPress={onPress} style={compact ? { ...styles.card, ...styles.compact } : styles.card}>
      <View style={styles.iconTile}>
        <ServiceIcon iconKey={service.iconKey} size={26} color={colors.lime} />
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>{service.name}</Text>
        {!compact ? <Text style={styles.desc} numberOfLines={2}>{service.shortDesc}</Text> : null}
        <View style={styles.row}>
          <Text style={styles.price}>₹{service.basePrice}</Text>
          <Text style={styles.rating}>★ {service.rating?.toFixed(1) ?? '4.8'}</Text>
        </View>
      </View>
      {!compact ? (
        <View style={styles.plus}>
          <Plus size={20} color={colors.green} />
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  compact: { width: '48%' },
  iconTile: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, minWidth: 0 },
  name: { fontFamily: fonts.display, fontSize: 14, color: colors.ink },
  desc: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 3 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, alignItems: 'center' },
  price: { fontFamily: fonts.displayExtra, fontSize: 15, color: premium.accentGold },
  rating: { fontFamily: fonts.body, fontSize: 11, color: colors.muted },
  plus: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
