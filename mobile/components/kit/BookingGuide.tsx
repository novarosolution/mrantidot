import { StyleSheet, Text, View } from 'react-native';
import {
  Calendar,
  CalendarClock,
  CheckCircle2,
  Clock,
  Home,
  MapPin,
  Search,
  ShieldCheck,
} from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { colors, fonts, spacing, ui } from '@/constants/theme';
import { customerRoutes, appPush } from '@/lib/routes';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';

const STEP_ICONS = [Search, CalendarClock, Home, MapPin, CheckCircle2] as const;
const TIME_ICONS = [Calendar, Clock] as const;

/** Step-by-step guide that helps customers book a service. */
export function BookingGuide({
  showCta = true,
  compact = false,
}: {
  showCta?: boolean;
  compact?: boolean;
}) {
  const copy = useCustomerUiCopy();
  const STEPS = [
    { icon: STEP_ICONS[0], title: copy.guideStep1Title, body: copy.guideStep1Body },
    { icon: STEP_ICONS[1], title: copy.guideStep2Title, body: copy.guideStep2Body },
    { icon: STEP_ICONS[2], title: copy.guideStep3Title, body: copy.guideStep3Body },
    { icon: STEP_ICONS[3], title: copy.guideStep4Title, body: copy.guideStep4Body },
    { icon: STEP_ICONS[4], title: copy.guideStep5Title, body: copy.guideStep5Body },
  ];
  const TIME_OPTIONS = [
    { icon: TIME_ICONS[0], title: copy.guideStandardTitle, body: copy.guideStandardBody },
    { icon: TIME_ICONS[1], title: copy.guideCustomTitle, body: copy.guideCustomBody },
  ];
  return (
    <View style={styles.wrap}>
      {!compact ? (
        <View style={styles.intro}>
          <View style={styles.introIcon}>
            <ShieldCheck size={26} color={ui.brand} strokeWidth={1.9} />
          </View>
          <Text style={styles.introTitle} accessibilityRole="header">
            {copy.guideIntroTitle}
          </Text>
          <Text style={styles.introBody}>{copy.guideIntroBody}</Text>
        </View>
      ) : null}

      <View style={styles.list}>
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const last = i === STEPS.length - 1;
          return (
            <View key={step.title} style={styles.row}>
              <View style={styles.rail}>
                <View style={styles.num}>
                  <Text style={styles.numText}>{i + 1}</Text>
                </View>
                {!last ? <View style={styles.line} /> : null}
              </View>
              <View style={[styles.card, last && styles.cardLast]}>
                <View style={styles.iconBox}>
                  <Icon size={18} color={ui.brand} strokeWidth={2.1} />
                </View>
                <View style={styles.copy}>
                  <Text style={styles.title}>{step.title}</Text>
                  <Text style={styles.body}>{step.body}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.timeCard}>
        <Text style={styles.timeKicker}>{copy.guideTimeKicker}</Text>
        <Text style={styles.timeHeading}>{copy.guideTimeHeading}</Text>
        <Text style={styles.timeSub}>{copy.guideTimeSub}</Text>
        {TIME_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          return (
            <View key={opt.title} style={styles.timeRow}>
              <View style={styles.iconBox}>
                <Icon size={18} color={ui.brand} strokeWidth={2.1} />
              </View>
              <View style={styles.copy}>
                <Text style={styles.title}>{opt.title}</Text>
                <Text style={styles.body}>{opt.body}</Text>
              </View>
            </View>
          );
        })}
      </View>

      {showCta ? (
        // Padding on a wrapper, not margin on the button: the button is width: 100% and would overflow the screen.
        <View style={styles.cta}>
          <Button title={copy.guideStart} variant="premium" onPress={() => appPush(customerRoutes.services)} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  intro: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: 4,
  },
  introIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: ui.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  introTitle: {
    fontFamily: fonts.displayExtra,
    fontSize: 22,
    letterSpacing: -0.5,
    color: ui.text,
    textAlign: 'center',
  },
  introBody: {
    marginTop: 6,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: ui.textSecondary,
    textAlign: 'center',
    maxWidth: 300,
  },
  list: {
    marginHorizontal: spacing.md,
    backgroundColor: colors.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: ui.hairline,
    paddingTop: 16,
    paddingBottom: 8,
    paddingHorizontal: 14,
    ...ui.shadow,
  },
  row: { flexDirection: 'row', gap: 12 },
  rail: { width: 28, alignItems: 'center' },
  num: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: ui.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.white },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: ui.brandSoft,
    marginVertical: 4,
  },
  card: {
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 16,
  },
  cardLast: { paddingBottom: 8 },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: ui.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
  },
  copy: { flex: 1, minWidth: 0, paddingTop: 2 },
  title: {
    fontFamily: fonts.displaySemi,
    fontSize: 15,
    letterSpacing: -0.2,
    color: ui.text,
  },
  body: {
    marginTop: 3,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: ui.textSecondary,
  },
  timeCard: {
    marginHorizontal: spacing.md,
    backgroundColor: colors.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: ui.hairline,
    padding: 16,
    gap: 12,
    ...ui.shadow,
  },
  timeKicker: {
    fontFamily: fonts.bodyBold,
    fontSize: 10.5,
    letterSpacing: 1.1,
    color: ui.brand,
  },
  timeHeading: {
    fontFamily: fonts.displaySemi,
    fontSize: 17,
    letterSpacing: -0.3,
    color: ui.text,
    marginTop: -4,
  },
  timeSub: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: ui.textSecondary,
    marginTop: -4,
    marginBottom: 2,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ui.hairline,
  },
  cta: { paddingHorizontal: spacing.md, marginTop: 4 },
});
