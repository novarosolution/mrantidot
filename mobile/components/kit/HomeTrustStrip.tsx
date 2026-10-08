import { StyleSheet, Text, View } from 'react-native';
import { BadgeCheck, ShieldCheck } from 'lucide-react-native';
import { colors, fonts, ui } from '@/constants/theme';

const DEFAULT_HEADLINE = 'Satisfaction guaranteed';
const DEFAULT_BADGES = ['Verified pros', 'On-time service', 'Safe chemicals'];

/** Brand promise card closing the home feed. */
export function HomeTrustStrip({
  brandName,
  guaranteeText,
  badges,
}: {
  brandName?: string;
  guaranteeText?: string;
  badges?: string[];
}) {
  const chipList = (badges ?? []).map((b) => b.trim()).filter(Boolean).slice(0, 3);
  const items = chipList.length > 0 ? chipList : DEFAULT_BADGES;
  const headline = guaranteeText?.split('·')[0]?.trim() || DEFAULT_HEADLINE;

  return (
    <View style={styles.card}>
      <View style={styles.text}>
        <Text style={styles.eyebrow}>{(brandName?.trim() || 'Mr Antidot') + ' promise'}</Text>
        <Text style={styles.headline}>{headline}</Text>
        <View style={styles.list}>
          {items.map((label) => (
            <View key={label} style={styles.item}>
              <BadgeCheck size={17} color={ui.brand} strokeWidth={2} fill={ui.brandSoft} />
              <Text style={styles.itemText} numberOfLines={1}>
                {label}
              </Text>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.seal}>
        <ShieldCheck size={36} color={ui.brand} strokeWidth={1.6} fill={ui.brandSoft} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 22,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    ...ui.shadow,
  },
  text: { flex: 1, minWidth: 0 },
  eyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: ui.brand,
  },
  headline: {
    marginTop: 4,
    fontFamily: fonts.displayExtra,
    fontSize: 18,
    lineHeight: 23,
    letterSpacing: -0.4,
    color: ui.text,
  },
  list: { marginTop: 14, gap: 10 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemText: { flexShrink: 1, fontFamily: fonts.bodyMedium, fontSize: 13.5, color: ui.text },
  seal: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: ui.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
