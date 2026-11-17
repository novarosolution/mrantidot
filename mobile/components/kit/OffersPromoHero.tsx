import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { TicketPercent } from 'lucide-react-native';
import { colors, fonts, spacing } from '@/constants/theme';

export function OffersPromoHero({
  offerCount,
  brandName,
  subtitle,
  fallbackTitle,
  fallbackSub,
}: {
  offerCount: number;
  brandName?: string;
  subtitle?: string;
  fallbackTitle?: string;
  fallbackSub?: string;
}) {
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
        <View style={styles.ring} pointerEvents="none" />
        <View style={styles.icon}>
          <TicketPercent size={26} color={colors.white} strokeWidth={2} />
        </View>
        <View style={styles.body}>
          <Text style={styles.badge}>
            {fallbackTitle?.trim() || (brandName ? `${brandName} deals` : 'Exclusive deals')}
          </Text>
          <Text style={styles.title}>
            {offerCount > 0
              ? `${offerCount} offer${offerCount === 1 ? '' : 's'} available`
              : fallbackSub || 'Save on your next booking'}
          </Text>
          {offerCount > 0 || subtitle?.trim() ? (
            <Text style={styles.sub}>
              {subtitle?.trim() || 'Apply a coupon at checkout — works on any service'}
            </Text>
          ) : null}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: 18,
    borderRadius: 26,
    overflow: 'hidden',
    shadowColor: '#075C2B',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 22,
    elevation: 6,
  },
  ring: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    left: -110,
    top: -140,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.10)',
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
    width: 56,
    height: 56,
    borderRadius: 18,
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
    marginTop: 6,
    fontFamily: fonts.displayExtra,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.35,
    color: colors.white,
  },
  sub: {
    marginTop: 4,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.82)',
  },
});
