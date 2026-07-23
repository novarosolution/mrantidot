import { StyleSheet, Text, View } from 'react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { Card } from '@/components/ui/Card';
import type { BookingStatus } from '@/types/api';
import { colors, fonts, spacing, surfaces } from '@/constants/theme';

type StepKey = BookingStatus | 'dispatch';

const STEPS: { key: StepKey; label: string }[] = [
  { key: 'pending', label: 'Schedule' },
  { key: 'confirmed', label: 'Confirm' },
  { key: 'dispatch', label: 'Assign' },
  { key: 'in_progress', label: 'On site' },
  { key: 'awaiting_verification', label: 'Verify' },
  { key: 'completed', label: 'Done' },
];

const STATUS_ORDER: BookingStatus[] = [
  'pending',
  'confirmed',
  'in_progress',
  'awaiting_verification',
  'completed',
];

function stepState(
  status: BookingStatus,
  stepKey: StepKey,
  assigned: boolean,
): 'done' | 'current' | 'upcoming' | 'cancelled' {
  if (status === 'cancelled') return 'cancelled';

  const statusIdx = STATUS_ORDER.indexOf(status);
  if (statusIdx < 0) return 'upcoming';

  // Pipeline: Schedule → Confirm → Assign → On site → Verify → Done
  if (stepKey === 'pending') {
    if (statusIdx > 0) return 'done';
    return 'current';
  }
  if (stepKey === 'confirmed') {
    // Once booking is confirmed, Confirm is complete — Assign is the next stage.
    if (statusIdx >= 1) return 'done';
    return 'upcoming';
  }
  if (stepKey === 'dispatch') {
    if (statusIdx > 1 || (status === 'confirmed' && assigned)) return 'done';
    if (status === 'confirmed') return 'current';
    return 'upcoming';
  }
  if (stepKey === 'in_progress') {
    if (statusIdx > 2) return 'done';
    if (status === 'in_progress') return 'current';
    // Assigned but not started yet — On site is the next action.
    if (status === 'confirmed' && assigned) return 'current';
    return 'upcoming';
  }
  if (stepKey === 'awaiting_verification') {
    if (statusIdx > 3) return 'done';
    if (status === 'awaiting_verification') return 'current';
    return 'upcoming';
  }
  // completed
  if (status === 'completed') return 'done';
  return 'upcoming';
}

export function AdminProcessTracker({
  status,
  assigned = false,
}: {
  status: BookingStatus;
  /** True when a technician is already assigned (Confirm done → Assign current/done). */
  assigned?: boolean;
}) {
  return (
    <Card variant="premium" style={styles.card}>
      <Text style={styles.title}>Process tracker</Text>
      <Text style={styles.hint}>Full booking pipeline — track and update each stage</Text>
      <View style={styles.row}>
        {STEPS.map((step, i) => {
          const state = stepState(status, step.key, assigned);
          const isLast = i === STEPS.length - 1;
          return (
            <View key={`${step.key}-${i}`} style={styles.stepCol}>
              <View style={styles.rail}>
                <View
                  style={[
                    styles.dot,
                    state === 'done' && styles.dotDone,
                    state === 'current' && styles.dotCurrent,
                    state === 'cancelled' && styles.dotCancelled,
                  ]}
                >
                  {state === 'done' ? (
                    <PremiumIcon icon={AppIcons.ui.check} variant="plain" size="xs" color={colors.white} strokeWidth={3} />
                  ) : null}
                  {state === 'current' ? <View style={styles.dotInner} /> : null}
                </View>
                {!isLast ? (
                  <View style={[styles.line, (state === 'done' || state === 'current') && styles.lineOn]} />
                ) : null}
              </View>
              <Text
                style={[
                  styles.label,
                  state === 'current' && styles.labelCurrent,
                  state === 'done' && styles.labelDone,
                ]}
                numberOfLines={1}
              >
                {step.label}
              </Text>
            </View>
          );
        })}
      </View>
      {status === 'cancelled' ? (
        <Text style={styles.cancelledNote}>This booking was cancelled</Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.sm, padding: spacing.md },
  title: { fontFamily: fonts.displayExtra, fontSize: 15, color: colors.ink },
  hint: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 4, marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  stepCol: { flex: 1, minWidth: 0 },
  rail: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: surfaces.glass,
    borderWidth: 1.5,
    borderColor: surfaces.glassBorderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  dotDone: { backgroundColor: colors.forest, borderColor: colors.forest },
  dotCurrent: { backgroundColor: colors.soft, borderColor: '#8FD03C', borderWidth: 2 },
  dotCancelled: { backgroundColor: colors.errorBg, borderColor: colors.error },
  dotInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#8FD03C' },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: surfaces.glassBorderStrong,
    marginLeft: -1,
  },
  lineOn: { backgroundColor: '#8FD03C' },
  label: {
    fontFamily: fonts.body,
    fontSize: 9,
    color: colors.muted,
    textAlign: 'left',
  },
  labelCurrent: { fontFamily: fonts.bodySemi, color: colors.forest },
  labelDone: { color: colors.ink },
  cancelledNote: {
    marginTop: spacing.sm,
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: colors.error,
  },
});
