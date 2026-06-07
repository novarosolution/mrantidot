import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import { colors, fonts, premium, spacing } from '@/constants/theme';

export function ProfileTrustBanner({ guaranteeText, badges }: { guaranteeText: string; badges?: string[] }) {
  const chips = badges?.slice(0, 3) ?? [];

  return (
    <View style={styles.wrap}>
      <LinearGradient colors={['#E8F5EC', '#FFFFFF']} style={styles.card} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.icon}>
          <ShieldCheck size={22} color={colors.forest} strokeWidth={2} />
        </View>
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
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginHorizontal: spacing.md, marginBottom: spacing.md },
  card: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: premium.radiusCard,
    borderWidth: 1,
    borderColor: 'rgba(30,142,78,0.12)',
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  body: { flex: 1 },
  title: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.forest },
  text: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 4, lineHeight: 17 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.sm },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(30,142,78,0.08)',
  },
  chipText: { fontFamily: fonts.bodySemi, fontSize: 10, color: colors.forest },
});
