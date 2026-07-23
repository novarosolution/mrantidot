import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { homeShadow } from '@/components/kit/homeUi';
import { colors, customerType, fonts, gradients, premium, spacing } from '@/constants/theme';

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
      <View style={styles.shell}>
        <LinearGradient
          colors={['#27A747', '#0A6423', '#043813']}
          locations={[0, 0.55, 1]}
          style={styles.card}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.95, y: 1 }}
        >
          <View style={styles.orb} pointerEvents="none">
            <LinearGradient
              colors={['rgba(184,232,106,0.45)', 'rgba(143,208,60,0)']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0.2, y: 0.2 }}
              end={{ x: 1, y: 1 }}
            />
          </View>
          <LinearGradient
            colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0)']}
            style={styles.sheen}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            pointerEvents="none"
          />
          <LinearGradient colors={[...gradients.goldBar]} style={styles.accent} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
          <View style={styles.rim} pointerEvents="none" />

          <View style={styles.iconShell}>
            <LinearGradient colors={['#FFFFFF', '#EAF6E3']} style={styles.icon}>
              <PremiumIcon
                icon={AppIcons.quick.offers}
                variant="plain"
                size={22}
                color={colors.forest}
                strokeWidth={2.2}
                fill="rgba(10,100,35,0.18)"
              />
            </LinearGradient>
          </View>

          <View style={styles.body}>
            <View style={styles.badgeRow}>
              <PremiumIcon icon={AppIcons.brand} variant="plain" size={12} color="#C8F07A" fill="rgba(200,240,122,0.35)" />
              <Text style={styles.badge}>
                {fallbackTitle?.trim() || (brandName ? `${brandName} deals` : 'Exclusive deals')}
              </Text>
            </View>
            <Text style={styles.title}>
              {offerCount > 0
                ? `${offerCount} offer${offerCount === 1 ? '' : 's'} available`
                : fallbackSub || 'Save on your next booking'}
            </Text>
            <Text style={styles.sub}>
              {subtitle?.trim() || 'Apply a coupon at checkout — works on any service'}
            </Text>
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  shell: {
    borderRadius: premium.radiusCard,
    ...homeShadow.promo,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md + 2,
    paddingTop: spacing.md + 6,
    borderRadius: premium.radiusCard,
    overflow: 'hidden',
  },
  rim: {
    ...StyleSheet.absoluteFill,
    borderRadius: premium.radiusCard,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  orb: {
    position: 'absolute',
    top: -48,
    right: -28,
    width: 160,
    height: 160,
    borderRadius: 80,
    overflow: 'hidden',
  },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '55%',
  },
  accent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  iconShell: {
    borderRadius: 18,
    shadowColor: '#02180C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  icon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  body: { flex: 1, minWidth: 0 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badge: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.92)',
  },
  title: {
    ...customerType.promoTitle,
    color: '#FFFFFF',
    marginTop: 6,
  },
  sub: {
    ...customerType.menuDesc,
    color: 'rgba(255,255,255,0.86)',
    marginTop: 4,
  },
});
