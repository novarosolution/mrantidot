import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { formatDelta, isMeaningfulDelta } from '@/lib/display';
import { colors, fonts } from '@/constants/theme';

export function KpiCard({
  icon: Icon,
  value,
  label,
  delta,
  iconBg,
  iconColor,
  onPress,
}: {
  icon: React.ComponentType<{ color?: string; size?: number }>;
  value: string;
  label: string;
  delta?: string;
  iconBg: string;
  iconColor: string;
  onPress?: () => void;
}) {
  return (
    <Card variant="premium" style={styles.card} onPress={onPress}>
      <View style={[styles.icon, { backgroundColor: iconBg }]}>
        <Icon size={18} color={iconColor} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {isMeaningfulDelta(delta) ? (
        <Text style={[styles.delta, delta?.startsWith('-') && styles.deltaDown]}>
          {formatDelta(delta!)}
        </Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { width: '47%', padding: 14 },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  value: { fontFamily: fonts.displayExtra, fontSize: 20, color: colors.forest, letterSpacing: -0.3 },
  label: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 1 },
  delta: { fontFamily: fonts.bodySemi, fontSize: 10, color: colors.green, marginTop: 7 },
  deltaDown: { color: colors.error },
});
