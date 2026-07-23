import type { LucideIcon } from 'lucide-react-native';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { CustomerContentPage } from '@/components/kit/CustomerContentPage';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { Card } from '@/components/ui/Card';
import { AppIcons } from '@/constants/appIcons';
import { useAppContent } from '@/context/AppContentContext';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { colors, fonts, spacing } from '@/constants/theme';
import { customerRoutes, appPush } from '@/lib/routes';

export default function HelpScreen() {
  const { content } = useAppContent();
  const ui = useCustomerUiCopy();
  const { support } = content;
  const brandName = content.branding.name?.trim() || 'Mr Antidot';

  const digits = (v: string) => v.replace(/[^\d+]/g, '');

  return (
    <CustomerContentPage
      title={ui.helpScreenTitle}
      subtitle="We're here for you"
      sectionTitle={ui.helpContactTitle}
      sectionSubtitle={`Reach the ${brandName} team`}
    >
      <Card variant="premium" style={styles.card}>
        {support.phone ? (
          <ContactRow
            icon={AppIcons.ui.phone}
            label={ui.helpPhoneLabel}
            value={support.phone}
            onPress={() => Linking.openURL(`tel:${digits(support.phone)}`)}
          />
        ) : null}
        {support.whatsapp ? (
          <ContactRow
            icon={AppIcons.ui.message}
            label={ui.helpWhatsappLabel}
            value={support.whatsapp}
            onPress={() => Linking.openURL(`https://wa.me/${digits(support.whatsapp ?? '')}`)}
          />
        ) : null}
        {support.email ? (
          <ContactRow
            icon={AppIcons.ui.mail}
            label={ui.helpEmailLabel}
            value={support.email}
            onPress={() => Linking.openURL(`mailto:${support.email}`)}
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
        <View style={styles.rule}>
          <View style={styles.ruleAccent} />
          <View style={styles.ruleLine} />
        </View>
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
      <PremiumIcon icon={icon} variant="mint" size={18} color={colors.green} boxSize={36} />
      <View style={styles.rowBody}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
      {onPress ? <PremiumIcon icon={AppIcons.ui.chevronRight} variant="plain" size={18} color={colors.muted} /> : null}
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
      <PremiumIcon icon={icon} variant="mint" size={18} color={colors.green} boxSize={36} />
      <Text style={[styles.rowLabel, styles.linkLabel]}>{label}</Text>
      <PremiumIcon icon={AppIcons.ui.chevronRight} variant="plain" size={18} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: spacing.md, padding: spacing.sm, marginBottom: spacing.md },
  emptySupport: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.muted,
    padding: spacing.md,
    lineHeight: 19,
  },
  resourcesHeader: { paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  resourcesTitle: { fontFamily: fonts.displayExtra, fontSize: 16, color: colors.ink },
  rule: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, gap: spacing.sm },
  ruleAccent: { width: 24, height: 2, borderRadius: 2, backgroundColor: '#8FD03C' },
  ruleLine: { flex: 1, height: 1, backgroundColor: colors.border },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 12,
    paddingHorizontal: spacing.sm,
  },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  rowBody: { flex: 1, minWidth: 0 },
  rowLabel: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.muted },
  linkLabel: { flex: 1, color: colors.ink, fontSize: 15 },
  rowValue: { fontFamily: fonts.body, fontSize: 14, color: colors.ink, marginTop: 2 },
});
