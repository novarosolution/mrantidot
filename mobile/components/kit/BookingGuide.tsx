import { StyleSheet, Text, View } from 'react-native';
import {
  Calendar,
  CalendarClock,
  CheckCircle2,
  Clock,
  Home,
  MapPin,
  ShieldCheck,
  Sparkles,
} from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { colors, fonts, spacing, ui } from '@/constants/theme';
import { customerRoutes, appPush } from '@/lib/routes';

const STEPS = [
  {
    icon: Sparkles,
    title: 'Pick a service',
    body: 'Browse pest types on Home or Services, then open the service you need.',
  },
  {
    icon: CalendarClock,
    title: 'Choose date & book time',
    body: 'Pick a visit day, then choose how you want to book the time (see options below).',
  },
  {
    icon: Home,
    title: 'Add property details',
    body: 'Tell us your property type so the technician brings the right treatment.',
  },
  {
    icon: MapPin,
    title: 'Add your address',
    body: 'GPS or saved place, then house/flat, optional landmark, and save as Home / Other.',
  },
  {
    icon: CheckCircle2,
    title: 'Pay & confirm',
    body: 'Apply a coupon if you have one, choose payment, and place the booking.',
  },
] as const;

const TIME_OPTIONS = [
  {
    icon: Calendar,
    title: 'Standard window',
    body: '2-hour slots · available 24/7 — pick a ready-made visit window.',
  },
  {
    icon: Clock,
    title: 'Custom time',
    body: 'Any time · 24/7 — set the exact hour that works best for you.',
  },
] as const;

/** Step-by-step guide that helps customers book a service. */
export function BookingGuide({
  showCta = true,
  compact = false,
}: {
  showCta?: boolean;
  compact?: boolean;
}) {
  return (
    <View style={styles.wrap}>
      {!compact ? (
        <View style={styles.intro}>
          <View style={styles.introIcon}>
            <ShieldCheck size={26} color={ui.brand} strokeWidth={1.9} />
          </View>
          <Text style={styles.introTitle}>Book in 5 easy steps</Text>
          <Text style={styles.introBody}>
            Follow this quick guide — pick a service, book your time, and confirm.
          </Text>
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
        <Text style={styles.timeKicker}>BOOK TIME OPTIONS</Text>
        <Text style={styles.timeHeading}>How do you want to schedule?</Text>
        <Text style={styles.timeSub}>
          On the date & time step you can use either option — both work day or night.
        </Text>
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
        <Button
          title="Start booking"
          variant="premium"
          onPress={() => appPush(customerRoutes.services)}
          style={styles.cta}
        />
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
  cta: { marginHorizontal: spacing.md, marginTop: 4 },
});
