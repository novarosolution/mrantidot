import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { PressableScale } from '@/components/ui/PressableScale';
import { fillCopy } from '@/constants/customerUiCopy';
import { callPhone, openWhatsApp, sendEmail } from '@/lib/contact';
import { CustomerContentPage } from '@/components/kit/CustomerContentPage';
import { ListFootnote, ListGroup, ListNavRow, ListSectionTitle } from '@/components/kit/ListGroup';
import { AppIcons } from '@/constants/appIcons';
import { useAppContent } from '@/context/AppContentContext';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { colors, radii, typeScale, ui as themeUi } from '@/constants/theme';
import { customerRoutes, appPush } from '@/lib/routes';

type Channel = { key: string; icon: LucideIcon; label: string; value: string; onPress: () => void };

export default function HelpScreen() {
  const { content } = useAppContent();
  const ui = useCustomerUiCopy();
  const { phone, whatsapp, email, hours } = content.support;

  // Only channels the admin has filled in get a tile.
  const channels: Channel[] = [];
  if (phone) {
    channels.push({ key: 'phone', icon: AppIcons.ui.phone, label: ui.helpPhoneLabel, value: phone, onPress: () => callPhone(phone, ui) });
  }
  if (whatsapp) {
    channels.push({ key: 'whatsapp', icon: AppIcons.ui.message, label: ui.helpWhatsappLabel, value: whatsapp, onPress: () => openWhatsApp(whatsapp, ui) });
  }
  if (email) {
    channels.push({ key: 'email', icon: AppIcons.ui.mail, label: ui.helpEmailLabel, value: email, onPress: () => sendEmail(email, ui) });
  }

  return (
    <CustomerContentPage title={ui.helpScreenTitle} subtitle={ui.helpSubtitle}>
      <ListSectionTitle title={ui.helpContactTitle} first />
      {channels.length > 0 ? (
        <View style={styles.tiles}>
          {channels.map((c) => (
            <ContactTile
              key={c.key}
              icon={c.icon}
              label={c.label}
              a11y={fillCopy(ui.helpContactA11y, { label: c.label, value: c.value })}
              onPress={c.onPress}
            />
          ))}
        </View>
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{ui.helpNoChannels}</Text>
        </View>
      )}
      {hours ? (
        <View style={styles.hours}>
          <AppIcons.ui.clock size={15} color={themeUi.textTertiary} strokeWidth={2.2} />
          <Text style={styles.hoursText}>
            <Text style={styles.hoursLabel}>{ui.helpHoursLabel}  </Text>
            {hours}
          </Text>
        </View>
      ) : null}

      <ListSectionTitle title={ui.helpResourcesTitle} />
      <ListGroup>
        <ListNavRow
          icon={AppIcons.ui.listChecks}
          title={ui.helpGuideTitle}
          subtitle={ui.helpGuideSub}
          onPress={() => appPush(customerRoutes.bookGuide)}
        />
        <ListNavRow
          icon={AppIcons.profile.faq}
          title={ui.profileMenuFaq}
          subtitle={ui.profileMenuFaqSub}
          onPress={() => appPush(customerRoutes.faq)}
        />
        <ListNavRow
          icon={AppIcons.ui.info}
          title={ui.profileMenuAbout}
          subtitle={ui.profileMenuAboutSub}
          onPress={() => appPush(customerRoutes.about)}
        />
        <ListNavRow
          icon={AppIcons.ui.terms}
          title={ui.profileMenuTerms}
          subtitle={ui.profileMenuTermsSub}
          onPress={() => appPush(customerRoutes.terms)}
        />
        <ListNavRow
          icon={AppIcons.ui.shield}
          title={ui.profileMenuPrivacy}
          subtitle={ui.profileMenuPrivacySub}
          onPress={() => appPush(customerRoutes.privacy)}
        />
      </ListGroup>
      <ListFootnote>{ui.helpResourcesSub}</ListFootnote>
    </CustomerContentPage>
  );
}

/** One-tap contact channel. The value is read out to screen readers; the dialer / mail app shows it on tap. */
function ContactTile({
  icon: Icon,
  label,
  a11y,
  onPress,
}: {
  icon: LucideIcon;
  label: string;
  a11y: string;
  onPress: () => void;
}) {
  return (
    <PressableScale containerStyle={styles.tileWrap} style={styles.tile} onPress={onPress} haptic="tap" accessibilityRole="button" accessibilityLabel={a11y}>
      <View style={styles.tileIcon}>
        <Icon size={22} color={themeUi.brand} strokeWidth={2.1} />
      </View>
      <Text style={styles.tileLabel} numberOfLines={1}>
        {label}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  tiles: { flexDirection: 'row', gap: 10 },
  tileWrap: { flex: 1 },
  tile: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: radii.card,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: themeUi.hairline,
    ...themeUi.shadow,
  },
  tileIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.control,
    backgroundColor: themeUi.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLabel: { ...typeScale.captionStrong, fontFamily: typeScale.button.fontFamily, color: themeUi.text },
  hours: { marginTop: 12, marginHorizontal: 4, flexDirection: 'row', alignItems: 'center', gap: 8 },
  hoursText: { ...typeScale.caption, flex: 1, lineHeight: 19, color: themeUi.text },
  hoursLabel: { fontFamily: typeScale.captionStrong.fontFamily, color: themeUi.textSecondary },
  empty: { padding: 16, borderRadius: radii.card, backgroundColor: themeUi.brandSoft },
  emptyText: { ...typeScale.caption, lineHeight: 19, color: themeUi.textSecondary },
});
