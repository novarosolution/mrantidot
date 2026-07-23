import { LinearGradient } from 'expo-linear-gradient';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { colors, fonts, premium, premiumType, shadows, spacing, surfaces } from '@/constants/theme';
import { customerRoutes, appPush } from '@/lib/routes';

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
              <PremiumIcon icon={AppIcons.ui.phone} variant="mint" size={17} color={colors.forest} strokeWidth={2} boxSize={40} bg={colors.soft} />
              <Text style={styles.btnLabel}>Call</Text>
            </Pressable>
          ) : null}
          {wa ? (
            <Pressable
              style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
              onPress={() => Linking.openURL(`https://wa.me/${digits(wa)}`)}
            >
              <PremiumIcon icon={AppIcons.ui.message} variant="mint" size={17} color={colors.secondaryDark} strokeWidth={2} boxSize={40} bg={colors.secondarySoft} />
              <Text style={styles.btnLabel}>WhatsApp</Text>
            </Pressable>
          ) : null}
          <Pressable style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]} onPress={() => appPush(customerRoutes.faq)}>
            <PremiumIcon icon={AppIcons.ui.help} variant="mint" size={17} color={colors.blue} strokeWidth={2} boxSize={40} bg={colors.blueBg} />
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
    borderColor: surfaces.glassBorderStrong,
    backgroundColor: surfaces.glass,
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
    backgroundColor: surfaces.glass,
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
    backgroundColor: surfaces.glass,
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
  },
  btnPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  btnLabel: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.forest },
  hours: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
