import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { formatDelta, isMeaningfulDelta } from '@/lib/display';
import { colors, fonts, premium, spacing } from '@/constants/theme';

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
    <Card variant="classic" style={styles.card} onPress={onPress}>
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
  card: { width: '47%', padding: spacing.md, paddingTop: spacing.md + 2 },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  value: {
    fontFamily: fonts.displayExtra,
    fontSize: 22,
    color: colors.forest,
    letterSpacing: -0.4,
  },
  label: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 2 },
  delta: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.green, marginTop: 6 },
  deltaDown: { color: colors.error },
});
