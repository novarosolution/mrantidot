import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import {  colors, fonts, premium, premiumType, shadows, spacing , gradients } from '@/constants/theme';

export function ProfileTrustBanner({ guaranteeText, badges }: { guaranteeText: string; badges?: string[] }) {
  const chips = badges?.slice(0, 3) ?? [];

  return (
    <View style={styles.wrap}>
      <LinearGradient colors={['#FFFFFF', '#F4FAF6']} style={styles.card} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <LinearGradient colors={[...gradients.goldBar]} style={styles.goldBar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
        <View style={styles.row}>
          <PremiumIcon icon={AppIcons.ui.shieldCheck} variant="gradient" size={22} color={colors.white} strokeWidth={2} boxSize={48} />
          <View style={styles.body}>
            <Text style={styles.title}>Protected by our guarantee</Text>
            <Text style={styles.text}>{guaranteeText}</Text>
            {chips.length > 0 ? (
              <View style={styles.chips}>
                {chips.map((b) => (
                  <View key={b} style={styles.chip}>
                    <Text style={styles.chipText}>{b}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginHorizontal: spacing.md, marginBottom: spacing.md },
  card: {
    borderRadius: premium.radiusCard,
    borderWidth: 1,
    borderColor: 'rgba(30,142,78,0.12)',
    overflow: 'hidden',
    ...shadows.card,
  },
  goldBar: { height: 3, width: '100%' },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  title: { ...premiumType.cardTitle, color: colors.forest },
  text: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 5, lineHeight: 18 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.sm },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: 'rgba(30,142,78,0.12)',
  },
  chipText: { fontFamily: fonts.bodySemi, fontSize: 10, color: colors.forest },
});
