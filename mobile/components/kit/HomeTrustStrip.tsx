import { StyleSheet, Text, View } from 'react-native';
import { AppIcons } from '@/constants/appIcons';
import { colors, fonts, spacing } from '@/constants/theme';

const BADGES = [
  { icon: AppIcons.trust.verified, label: 'Verified pros' },
  { icon: AppIcons.trust.sameDay, label: 'Same-day slots' },
  { icon: AppIcons.trust.eco, label: 'Eco-safe' },
];

export function HomeTrustStrip() {
  return (
    <View style={styles.row}>
      {BADGES.map(({ icon: Icon, label }) => (
        <View key={label} style={styles.chip}>
          <View style={styles.iconWrap}>
            <Icon size={11} color={colors.lime} strokeWidth={2.4} />
          </View>
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
    justifyContent: 'flex-start',
    gap: 8,
    marginTop: spacing.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 12,
    paddingLeft: 4,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  iconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(168,224,78,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: 'rgba(255,255,255,0.94)',
  },
});
