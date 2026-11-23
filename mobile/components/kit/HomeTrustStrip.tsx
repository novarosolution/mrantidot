import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BadgeCheck, Clock3, Leaf, type LucideIcon } from 'lucide-react-native';
import { HomeShieldArt } from '@/components/illustrations/HomeArt';
import { auroraPalette, fonts, ui } from '@/constants/theme';
import { fillCopy } from '@/constants/customerUiCopy';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';

/** Icons follow the badge order the admin sets (pros → timing → chemicals); extra badges reuse the tick. */
const BADGE_ICONS: LucideIcon[] = [BadgeCheck, Clock3, Leaf];

/** Brand promise card closing the home feed — shield art, guarantee headline, three benefit tiles. */
export function HomeTrustStrip({
  brandName,
  guaranteeText,
  badges,
}: {
  brandName?: string;
  guaranteeText?: string;
  badges?: string[];
}) {
  const copy = useCustomerUiCopy();
  const chipList = (badges ?? []).map((b) => b.trim()).filter(Boolean).slice(0, 3);
  const fallbackBadges = copy.homeTrustBadges.split(',').map((b) => b.trim()).filter(Boolean);
  const items = chipList.length > 0 ? chipList : fallbackBadges;
  const headline = guaranteeText?.split('·')[0]?.trim() || copy.homeTrustHeadline;

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={[auroraPalette.lightMid, auroraPalette.lightBottom]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={styles.ring} pointerEvents="none" />
      <View style={styles.top}>
        <View style={styles.text}>
          <Text style={styles.eyebrow}>{fillCopy(copy.profilePromiseEyebrow, { brand: brandName?.trim() || 'Mr Antidot' })}</Text>
          <Text style={styles.headline}>{headline}</Text>
        </View>
        <View style={styles.seal}>
          <HomeShieldArt size={82} />
        </View>
      </View>
      <View style={styles.benefits}>
        {items.map((label, i) => {
          const Icon = BADGE_ICONS[i] ?? BadgeCheck;
          return (
            <View key={label} style={styles.benefit}>
              <View style={styles.benefitIcon}>
                <Icon size={18} color={ui.brand} strokeWidth={2.1} />
              </View>
              <Text style={styles.benefitText} numberOfLines={2}>
                {label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(8,123,53,0.10)',
  },
  ring: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    right: -70,
    top: -90,
    borderWidth: 1.5,
    borderColor: 'rgba(8,123,53,0.08)',
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  text: { flex: 1, minWidth: 0 },
  eyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: ui.brand,
  },
  headline: {
    marginTop: 5,
    fontFamily: fonts.displayExtra,
    fontSize: 20,
    lineHeight: 25,
    letterSpacing: -0.5,
    color: ui.text,
  },
  seal: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  benefits: { flexDirection: 'row', gap: 8, marginTop: 18 },
  benefit: {
    flex: 1,
    alignItems: 'center',
    gap: 7,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.95)',
  },
  benefitIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: ui.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    lineHeight: 15,
    textAlign: 'center',
    color: ui.text,
  },
});
