import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { callPhone, openWhatsApp, sendEmail } from '@/lib/contact';
import { CustomerContentPage } from '@/components/kit/CustomerContentPage';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { Card } from '@/components/ui/Card';
import { AppIcons } from '@/constants/appIcons';
import { useAppContent } from '@/context/AppContentContext';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { colors, fonts, spacing, ui as themeUi } from '@/constants/theme';
import { customerRoutes, appPush } from '@/lib/routes';

export default function HelpScreen() {
  const { content } = useAppContent();
  const ui = useCustomerUiCopy();
  const { support } = content;
  const brandName = content.branding.name?.trim() || 'Mr Antidot';

  return (
    <CustomerContentPage
      title={ui.helpScreenTitle}
      subtitle={ui.helpSubtitle}
      sectionTitle={ui.helpContactTitle}
      sectionSubtitle={`Reach the ${brandName} team`}
    >
      <Pressable
        style={({ pressed }) => [styles.guideCard, pressed && styles.guidePressed]}
        onPress={() => appPush(customerRoutes.bookGuide)}
        accessibilityRole="button"
        accessibilityLabel="How to book a service"
      >
        <PremiumIcon icon={AppIcons.ui.listChecks} variant="mint" size={20} color={themeUi.brand} boxSize={44} />
        <View style={styles.guideBody}>
          <Text style={styles.guideTitle}>{ui.helpGuideTitle}</Text>
          <Text style={styles.guideSub}>5 easy steps · Start booking with confidence</Text>
        </View>
        <PremiumIcon icon={AppIcons.ui.chevronRight} variant="plain" size={18} color={themeUi.textTertiary} />
      </Pressable>

      <Card variant="premium" style={styles.card}>
        {support.phone ? (
          <ContactRow
            icon={AppIcons.ui.phone}
            label={ui.helpPhoneLabel}
            value={support.phone}
            onPress={() => callPhone(support.phone)}
          />
        ) : null}
        {support.whatsapp ? (
          <ContactRow
            icon={AppIcons.ui.message}
            label={ui.helpWhatsappLabel}
            value={support.whatsapp}
            onPress={() => openWhatsApp(support.whatsapp ?? '')}
          />
        ) : null}
        {support.email ? (
          <ContactRow
            icon={AppIcons.ui.mail}
            label={ui.helpEmailLabel}
            value={support.email}
            onPress={() => sendEmail(support.email)}
          />
        ) : null}
        {support.hours ? (
          <ContactRow icon={AppIcons.ui.clock} label={ui.helpHoursLabel} value={support.hours} />
        ) : null}
        {!support.phone && !support.whatsapp && !support.email && !support.hours ? (
          <Text style={styles.emptySupport}>Support details will appear here once configured in Content.</Text>
        ) : null}
      </Card>

      <View style={styles.resourcesHeader}>
        <Text style={styles.resourcesTitle}>{ui.helpResourcesTitle}</Text>
        <Text style={styles.resourcesSub}>{ui.helpResourcesSub}</Text>
      </View>
      <Card variant="glass" style={styles.card}>
        <LinkRow icon={AppIcons.ui.help} label={ui.profileMenuFaq} onPress={() => appPush(customerRoutes.faq)} />
        <LinkRow icon={AppIcons.ui.info} label={ui.profileMenuAbout} onPress={() => appPush(customerRoutes.about)} />
        <LinkRow icon={AppIcons.ui.terms} label={ui.profileMenuTerms} onPress={() => appPush(customerRoutes.terms)} />
        <LinkRow icon={AppIcons.ui.shield} label={ui.profileMenuPrivacy} onPress={() => appPush(customerRoutes.privacy)} last />
      </Card>
    </CustomerContentPage>
  );
}

function ContactRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  onPress?: () => void;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress} disabled={!onPress}>
      <PremiumIcon icon={icon} variant="mint" size={18} color={themeUi.brand} boxSize={36} />
      <View style={styles.rowBody}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
      {onPress ? <PremiumIcon icon={AppIcons.ui.chevronRight} variant="plain" size={18} color={themeUi.textTertiary} /> : null}
    </Pressable>
  );
}

function LinkRow({
  icon,
  label,
  onPress,
  last,
}: {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <Pressable style={[styles.row, !last && styles.rowBorder]} onPress={onPress}>
      <PremiumIcon icon={icon} variant="mint" size={18} color={themeUi.brand} boxSize={36} />
      <Text style={[styles.rowLabel, styles.linkLabel]}>{label}</Text>
      <PremiumIcon icon={AppIcons.ui.chevronRight} variant="plain" size={18} color={themeUi.textTertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  guideCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: 14,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: themeUi.hairline,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  guidePressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
  guideBody: { flex: 1, minWidth: 0 },
  guideTitle: {
    fontFamily: fonts.displaySemi,
    fontSize: 16,
    letterSpacing: -0.2,
    color: themeUi.text,
  },
  guideSub: {
    marginTop: 3,
    fontFamily: fonts.body,
    fontSize: 13,
    color: themeUi.textSecondary,
  },
  card: { marginHorizontal: spacing.md, padding: spacing.sm, marginBottom: spacing.md },
  emptySupport: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: themeUi.textSecondary,
    padding: spacing.md,
    lineHeight: 19,
  },
  resourcesHeader: { paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  resourcesTitle: { fontFamily: fonts.displayExtra, fontSize: 18, letterSpacing: -0.2, color: themeUi.text },
  resourcesSub: { marginTop: 2, fontFamily: fonts.body, fontSize: 13, color: themeUi.textSecondary },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 12,
    paddingHorizontal: spacing.sm,
  },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: themeUi.hairline },
  rowBody: { flex: 1, minWidth: 0 },
  rowLabel: { fontFamily: fonts.bodySemi, fontSize: 13, color: themeUi.textSecondary },
  linkLabel: { flex: 1, color: themeUi.text, fontSize: 15 },
  rowValue: { fontFamily: fonts.body, fontSize: 14, color: themeUi.text, marginTop: 2 },
});
