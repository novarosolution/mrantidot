import { StyleSheet, Text, View } from 'react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { PressableScale } from '@/components/ui/PressableScale';
import { AppIcons } from '@/constants/appIcons';
import { colors, radii, spacing, typeScale, ui } from '@/constants/theme';
import { customerRoutes, appPush } from '@/lib/routes';
import { callPhone, openWhatsApp } from '@/lib/contact';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';

/** "Need help?" — one-tap call / WhatsApp / FAQ; channels the admin hasn't set are left out. */
export function ProfileSupportCard({
  phone,
  whatsapp,
  hours,
}: {
  phone?: string;
  whatsapp?: string;
  hours?: string;
}) {
  const copy = useCustomerUiCopy();
  const wa = whatsapp || phone;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          {copy.profileSupportTitle}
        </Text>
        <Text style={styles.subtitle}>
          {copy.profileSupportSub}
          {hours ? ` · ${hours}` : ''}
        </Text>
      </View>
      <View style={styles.row}>
        {phone ? (
          <PressableScale containerStyle={styles.btnWrap} style={styles.btn} haptic="tap" onPress={() => callPhone(phone, copy)} accessibilityRole="button">
            <PremiumIcon icon={AppIcons.ui.phone} variant="mint" size={17} color={colors.forest} strokeWidth={2} boxSize={40} bg={colors.soft} />
            <Text style={styles.btnLabel}>{copy.profileSupportCall}</Text>
          </PressableScale>
        ) : null}
        {wa ? (
          <PressableScale containerStyle={styles.btnWrap} style={styles.btn} haptic="tap" onPress={() => openWhatsApp(wa, copy)} accessibilityRole="button">
            <PremiumIcon icon={AppIcons.ui.message} variant="mint" size={17} color={colors.secondaryDark} strokeWidth={2} boxSize={40} bg={colors.secondarySoft} />
            <Text style={styles.btnLabel}>{copy.profileSupportWhatsapp}</Text>
          </PressableScale>
        ) : null}
        <PressableScale containerStyle={styles.btnWrap} style={styles.btn} onPress={() => appPush(customerRoutes.faq)} accessibilityRole="button">
          <PremiumIcon icon={AppIcons.ui.help} variant="mint" size={17} color={colors.blue} strokeWidth={2} boxSize={40} bg={colors.blueBg} />
          <Text style={styles.btnLabel}>{copy.profileSupportFaq}</Text>
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radii.card,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    ...ui.shadow,
  },
  header: { marginBottom: spacing.sm + 4 },
  title: { ...typeScale.section, fontSize: 17, lineHeight: 23, color: ui.text },
  subtitle: { ...typeScale.caption, fontSize: 12.5, color: ui.textSecondary, marginTop: 2 },
  row: { flexDirection: 'row', gap: 10 },
  btnWrap: { flex: 1 },
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 84,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.control,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.border,
  },
  btnLabel: { ...typeScale.captionStrong, fontSize: 12.5, color: ui.text },
});
