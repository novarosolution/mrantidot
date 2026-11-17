import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { TicketPercent } from 'lucide-react-native';
import { colors, fonts, spacing } from '@/constants/theme';

/**
 * Compact brand banner that opens the Offers list. It carries the promise (and a code / guarantee line),
 * while the coupon count lives on the list's own section title. Horizontal padding comes from the parent.
 */
export function OffersPromoHero({
  brandName,
  subtitle,
  fallbackTitle,
  fallbackSub,
}: {
  brandName?: string;
  subtitle?: string;
  fallbackTitle?: string;
  fallbackSub?: string;
}) {
  const sub = subtitle?.trim();
  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={['#169A4A', '#087B35', '#075C2B']}
        locations={[0, 0.55, 1]}
        style={styles.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.orb} pointerEvents="none" />
        <View style={styles.icon}>
          <TicketPercent size={24} color={colors.white} strokeWidth={2} />
        </View>
        <View style={styles.body}>
          <Text style={styles.badge}>
            {fallbackTitle?.trim() || (brandName ? `${brandName} deals` : 'Exclusive deals')}
          </Text>
          <Text style={styles.title}>{fallbackSub?.trim() || 'Save on your next booking'}</Text>
          {sub ? <Text style={styles.sub}>{sub}</Text> : null}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingBottom: spacing.xs },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#075C2B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 6,
  },
  orb: {
    position: 'absolute',
    right: -46,
    bottom: -70,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  body: { flex: 1, minWidth: 0 },
  badge: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.limeOnDark,
  },
  title: {
    marginTop: 4,
    fontFamily: fonts.displayExtra,
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.35,
    color: colors.white,
  },
  sub: {
    marginTop: 3,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.82)',
  },
});
