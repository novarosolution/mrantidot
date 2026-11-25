import type { LucideIcon } from 'lucide-react-native';
import { BriefcaseBusiness, LogOut, Sun, TreePalm, UserRoundX } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { fillCopy } from '@/constants/customerUiCopy';
import { Button } from '@/components/ui/Button';
import { LiveBadge } from '@/components/ui/LiveBadge';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { useTechCopy } from '@/lib/tech-copy';
import type { DutyState } from '@/lib/techLabels';
import { colors, fonts, radii, spacing, ui } from '@/constants/theme';

export type DutyAction = 'checkIn' | 'checkOut' | 'absent';

const LOOK: Record<DutyState, { icon: LucideIcon; bg: string; fg: string }> = {
  pending: { icon: Sun, bg: colors.amberBg, fg: colors.amberInk },
  on: { icon: BriefcaseBusiness, bg: ui.brandSoft, fg: ui.brand },
  checkedOut: { icon: LogOut, bg: ui.surfaceMuted, fg: ui.textSecondary },
  absent: { icon: UserRoundX, bg: colors.errorBg, fg: colors.error },
  leave: { icon: TreePalm, bg: colors.blueBg, fg: colors.blue },
};

function timeLabel(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}

/**
 * Today's attendance card on the jobs tab: check in, check out / mark absent, go back on duty,
 * or a quiet note when on approved leave. Check-out and mark-absent ask first (the parent shows the sheet).
 */
export function TechDutyCard({
  state,
  checkedInAt,
  busy,
  onCheckIn,
  onCheckOut,
  onMarkAbsent,
}: {
  state: DutyState;
  checkedInAt?: string;
  busy: DutyAction | null;
  onCheckIn: () => void;
  onCheckOut: () => void;
  onMarkAbsent: () => void;
}) {
  const booking = useTechCopy();
  const copy = useCustomerUiCopy();
  const look = LOOK[state];
  const Icon = look.icon;
  const since = timeLabel(checkedInAt);

  const text: Record<DutyState, { title: string; sub: string }> = {
    pending: { title: booking.techCheckInTitle, sub: booking.techCheckInSubtitle },
    on: { title: copy.techOnDutyTitle, sub: since ? fillCopy(copy.techOnDutySince, { time: since }) : copy.techDutyOn },
    checkedOut: { title: copy.techDutyCheckedOut, sub: copy.techCheckedOutHint },
    absent: { title: booking.techOffDutyBadge, sub: booking.techOffDutyHint },
    leave: { title: copy.techLeaveTodayTitle, sub: copy.techLeaveTodayHint },
  };
  const { title, sub } = text[state];
  const anyBusy = busy !== null;

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={[styles.icon, { backgroundColor: look.bg }]}>
          <Icon size={21} color={look.fg} strokeWidth={2.1} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.sub}>{sub}</Text>
        </View>
        {state === 'on' ? <LiveBadge label={copy.techLiveBadge} /> : null}
      </View>

      {state === 'pending' ? (
        <View style={styles.actions}>
          <Button
            title={booking.techOnDutyButton}
            onPress={onCheckIn}
            loading={busy === 'checkIn'}
            disabled={anyBusy}
            style={styles.action}
          />
          <Button
            title={booking.techOffDutyButton}
            variant="secondary"
            onPress={onMarkAbsent}
            disabled={anyBusy}
            style={styles.action}
          />
        </View>
      ) : state === 'on' ? (
        <View style={styles.actions}>
          <Button
            title={copy.techCheckOutButton}
            onPress={onCheckOut}
            loading={busy === 'checkOut'}
            disabled={anyBusy}
            style={styles.action}
          />
          <Button
            title={copy.techMarkAbsentButton}
            variant="secondary"
            onPress={onMarkAbsent}
            loading={busy === 'absent'}
            disabled={anyBusy}
            style={styles.action}
          />
        </View>
      ) : state === 'checkedOut' || state === 'absent' ? (
        <View style={styles.actions}>
          <Button
            title={booking.techBackOnDutyButton}
            onPress={onCheckIn}
            loading={busy === 'checkIn'}
            disabled={anyBusy}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    borderRadius: radii.card,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    ...ui.shadow,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 0 },
  title: { fontFamily: fonts.bodyBold, fontSize: 16, color: ui.text },
  sub: { marginTop: 2, fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: ui.textSecondary },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  action: { flex: 1 },
});
