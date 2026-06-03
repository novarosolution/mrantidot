import { StyleSheet, Text, View } from 'react-native';
import { Check, Clock, KeyRound } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import type { WorkOtpAdminView } from '@/types/api';
import { colors, fonts, spacing } from '@/constants/theme';

function formatWhen(iso?: string): string {
  if (!iso) return 'Pending';
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function OtpRow({
  label,
  entry,
}: {
  label: string;
  entry?: { masked: string; verifiedAt?: string; expiresAt?: string };
}) {
  if (!entry) return null;
  const verified = Boolean(entry.verifiedAt);

  return (
    <View style={styles.row}>
      <View style={[styles.icon, verified && styles.iconDone]}>
        {verified ? <Check size={14} color={colors.white} /> : <KeyRound size={14} color={colors.green} />}
      </View>
      <View style={styles.body}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{verified ? 'Verified' : `Active · ${entry.masked}`}</Text>
        <Text style={styles.rowMeta}>
          {verified ? formatWhen(entry.verifiedAt) : `Expires ${formatWhen(entry.expiresAt)}`}
        </Text>
      </View>
      {!verified ? (
        <View style={styles.pendingBadge}>
          <Clock size={12} color={colors.amberInk} />
          <Text style={styles.pendingText}>Awaiting</Text>
        </View>
      ) : null}
    </View>
  );
}

export function OtpStatusCard({ workOtp }: { workOtp?: WorkOtpAdminView }) {
  if (!workOtp?.start && !workOtp?.end) return null;

  return (
    <Card variant="premium" style={styles.card}>
      <Text style={styles.title}>OTP status</Text>
      <OtpRow label="Start code" entry={workOtp.start} />
      <OtpRow label="End code" entry={workOtp.end} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: spacing.md, padding: spacing.md },
  title: { fontFamily: fonts.display, fontSize: 14, color: colors.ink, marginBottom: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconDone: { backgroundColor: colors.green },
  body: { flex: 1 },
  rowLabel: { fontFamily: fonts.body, fontSize: 11, color: colors.muted },
  rowValue: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ink, marginTop: 2 },
  rowMeta: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 2 },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.amberBg,
  },
  pendingText: { fontFamily: fonts.bodySemi, fontSize: 10, color: colors.amberInk },
});
