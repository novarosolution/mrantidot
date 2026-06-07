import { StyleSheet, Text, View } from 'react-native';
import { ShieldCheck, Clock, Leaf } from 'lucide-react-native';
import { colors, fonts, spacing } from '@/constants/theme';

const BADGES = [
  { icon: ShieldCheck, label: 'Verified pros' },
  { icon: Clock, label: 'On-time' },
  { icon: Leaf, label: 'Eco-safe' },
];

export function HomeTrustStrip() {
  return (
    <View style={styles.row}>
      {BADGES.map(({ icon: Icon, label }) => (
        <View key={label} style={styles.chip}>
          <Icon size={12} color={colors.lime} strokeWidth={2.2} />
          <Text style={styles.text}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  text: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: 'rgba(255,255,255,0.92)',
  },
});
