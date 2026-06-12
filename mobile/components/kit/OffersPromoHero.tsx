import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { AppIcons } from '@/constants/appIcons';
import { colors, fonts, premium, shadows, spacing } from '@/constants/theme';

export function OffersPromoHero({ offerCount }: { offerCount: number }) {
  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={['#FFF8E8', '#FFFFFF']}
        style={styles.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.icon}>
          <AppIcons.quick.offers size={24} color={premium.accentGold} strokeWidth={2} />
        </View>
        <View style={styles.body}>
          <View style={styles.badgeRow}>
            <AppIcons.brand size={12} color={premium.accentGold} />
            <Text style={styles.badge}>Exclusive deals</Text>
          </View>
          <Text style={styles.title}>
            {offerCount > 0 ? `${offerCount} offer${offerCount === 1 ? '' : 's'} available` : 'Save on your next booking'}
          </Text>
          <Text style={styles.sub}>Apply a coupon at checkout — works on any service</Text>
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
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: premium.radiusCard,
    borderWidth: 1,
    borderColor: 'rgba(182,132,28,0.22)',
    ...shadows.card,
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(182,132,28,0.25)',
  },
  body: { flex: 1 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  badge: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    color: premium.accentGold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: colors.ink,
    marginTop: 4,
    lineHeight: 21,
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.muted,
    marginTop: 4,
    lineHeight: 17,
  },
});
