import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { colors, fonts, spacing, ui } from '@/constants/theme';
import { customerRoutes, appPush } from '@/lib/routes';
import { callPhone, openWhatsApp } from '@/lib/contact';

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
      <View style={styles.header}>
        <Text style={styles.title}>Need help?</Text>
        <Text style={styles.subtitle}>Our team is here for you{hours ? ` · ${hours}` : ''}</Text>
      </View>
      <View style={styles.body}>
        <View style={styles.row}>
          {phone ? (
            <Pressable style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]} onPress={() => callPhone(phone)}>
              <PremiumIcon icon={AppIcons.ui.phone} variant="mint" size={17} color={colors.forest} strokeWidth={2} boxSize={40} bg={colors.soft} />
              <Text style={styles.btnLabel}>Call</Text>
            </Pressable>
          ) : null}
          {wa ? (
            <Pressable
              style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
              onPress={() => openWhatsApp(wa)}
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm + 4,
  },
  title: { fontFamily: fonts.displayExtra, fontSize: 17, letterSpacing: -0.3, color: ui.text },
  subtitle: { fontFamily: fonts.body, fontSize: 12.5, color: ui.textSecondary, marginTop: 2 },
  body: {
    padding: spacing.md,
    paddingTop: spacing.sm,
  },
  row: { flexDirection: 'row', gap: 10 },
  btn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: spacing.sm + 2,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.border,
  },
  btnPressed: { backgroundColor: ui.surfaceMuted },
  btnLabel: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: ui.text },
});
