import { LinearGradient } from 'expo-linear-gradient';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { HelpCircle, MessageCircle, Phone } from 'lucide-react-native';
import { router } from 'expo-router';
import { colors, fonts, premium, premiumType, shadows, spacing } from '@/constants/theme';

function digits(v: string) {
  return v.replace(/[^\d+]/g, '');
}

export function ProfileSupportCard({
  phone,
  whatsapp,
  hours,
}: {
  phone?: string;
  whatsapp?: string;
  hours?: string;
}) {
  const wa = whatsapp || phone;

  return (
    <View style={styles.wrap}>
      <LinearGradient colors={['#14532D', '#0E3A20']} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Text style={styles.title}>Need help?</Text>
        <Text style={styles.subtitle}>Our team is here for you</Text>
      </LinearGradient>
      <View style={styles.body}>
        <View style={styles.row}>
          {phone ? (
            <Pressable style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]} onPress={() => Linking.openURL(`tel:${digits(phone)}`)}>
              <View style={[styles.btnIcon, { backgroundColor: colors.soft }]}>
                <Phone size={17} color={colors.forest} strokeWidth={2} />
              </View>
              <Text style={styles.btnLabel}>Call</Text>
            </Pressable>
          ) : null}
          {wa ? (
            <Pressable
              style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
              onPress={() => Linking.openURL(`https://wa.me/${digits(wa)}`)}
            >
              <View style={[styles.btnIcon, { backgroundColor: colors.secondarySoft }]}>
                <MessageCircle size={17} color={colors.secondaryDark} strokeWidth={2} />
              </View>
              <Text style={styles.btnLabel}>WhatsApp</Text>
            </Pressable>
          ) : null}
          <Pressable style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]} onPress={() => router.push('/(customer)/faq')}>
            <View style={[styles.btnIcon, { backgroundColor: colors.blueBg }]}>
              <HelpCircle size={17} color={colors.blue} strokeWidth={2} />
            </View>
            <Text style={styles.btnLabel}>FAQ</Text>
          </Pressable>
        </View>
        {hours ? <Text style={styles.hours}>{hours}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: premium.radiusCard,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.08)',
    ...shadows.card,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm + 4,
  },
  title: { ...premiumType.brandSub, fontSize: 18, color: colors.white },
  subtitle: { fontFamily: fonts.body, fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  body: {
    backgroundColor: colors.white,
    padding: spacing.md,
    paddingTop: spacing.sm + 4,
  },
  row: { flexDirection: 'row', gap: 10 },
  btn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: spacing.sm + 2,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  btnIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnLabel: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.forest },
  hours: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
