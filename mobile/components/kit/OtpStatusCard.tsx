import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import Toast from 'react-native-toast-message';
import { Card } from '@/components/ui/Card';
import { api, getApiErrorMessage } from '@/lib/api';
import type { WorkOtpAdminView } from '@/types/api';
import { colors, fonts, spacing, surfaces } from '@/constants/theme';

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
  type,
  entry,
  bookingId,
  onUpdated,
  reveal,
  onToggleReveal,
  regenerating,
  onRegenerate,
}: {
  label: string;
  type: 'start' | 'end';
  entry?: { masked: string; code?: string; verifiedAt?: string; expiresAt?: string };
  bookingId: string;
  onUpdated?: () => Promise<void>;
  reveal: boolean;
  onToggleReveal: () => void;
  regenerating: boolean;
  onRegenerate: () => void;
}) {
  if (!entry) return null;
  const verified = Boolean(entry.verifiedAt);
  const display = !verified && reveal && entry.code ? entry.code : entry.masked;

  return (
    <View style={styles.row}>
      <View style={[styles.icon, verified && styles.iconDone]}>
        {verified ? (
          <PremiumIcon icon={AppIcons.ui.check} variant="plain" size="sm" color={colors.white} />
        ) : (
          <PremiumIcon icon={AppIcons.ui.key} variant="plain" size="sm" color={colors.green} />
        )}
      </View>
      <View style={styles.body}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{verified ? 'Verified' : display}</Text>
        <Text style={styles.rowMeta}>
          {verified ? formatWhen(entry.verifiedAt) : `Expires ${formatWhen(entry.expiresAt)}`}
        </Text>
      </View>
      {!verified ? (
        <View style={styles.actions}>
          {entry.code ? (
            <Pressable style={styles.iconBtn} onPress={onToggleReveal} hitSlop={8}>
              {reveal ? (
                <PremiumIcon icon={AppIcons.ui.eyeOff} variant="plain" size="sm" color={colors.forest} />
              ) : (
                <PremiumIcon icon={AppIcons.ui.eye} variant="plain" size="sm" color={colors.forest} />
              )}
            </Pressable>
          ) : (
            <View style={styles.pendingBadge}>
              <PremiumIcon icon={AppIcons.ui.clock} variant="plain" size="xs" color={colors.forest} />
              <Text style={styles.pendingText}>Awaiting</Text>
            </View>
          )}
          {onUpdated ? (
            <Pressable
              style={[styles.iconBtn, regenerating && styles.iconBtnBusy]}
              onPress={onRegenerate}
              disabled={regenerating}
              hitSlop={8}
            >
              <PremiumIcon icon={AppIcons.ui.refresh} variant="plain" size="sm" color={colors.forest} />
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export function OtpStatusCard({
  workOtp,
  bookingId,
  onUpdated,
}: {
  workOtp?: WorkOtpAdminView;
  bookingId?: string;
  onUpdated?: () => Promise<void>;
}) {
  const [revealStart, setRevealStart] = useState(false);
  const [revealEnd, setRevealEnd] = useState(false);
  const [regen, setRegen] = useState<'start' | 'end' | null>(null);

  if (!workOtp?.start && !workOtp?.end) return null;

  async function regenerate(type: 'start' | 'end') {
    if (!bookingId || !onUpdated) return;
    setRegen(type);
    try {
      await api.post(`/bookings/${bookingId}/regenerate-otp`, { type });
      Toast.show({ type: 'success', text1: `${type === 'start' ? 'Start' : 'End'} code regenerated` });
      await onUpdated();
    } catch (err) {
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Could not regenerate code') });
    } finally {
      setRegen(null);
    }
  }

  return (
    <Card variant="premium" style={styles.card}>
      <Text style={styles.title}>OTP control</Text>
      <Text style={styles.hint}>Reveal codes to help customers · regenerate if expired</Text>
      <OtpRow
        label="Start code"
        type="start"
        entry={workOtp.start}
        bookingId={bookingId ?? ''}
        onUpdated={onUpdated}
        reveal={revealStart}
        onToggleReveal={() => setRevealStart((v) => !v)}
        regenerating={regen === 'start'}
        onRegenerate={() => void regenerate('start')}
      />
      <OtpRow
        label="End code"
        type="end"
        entry={workOtp.end}
        bookingId={bookingId ?? ''}
        onUpdated={onUpdated}
        reveal={revealEnd}
        onToggleReveal={() => setRevealEnd((v) => !v)}
        regenerating={regen === 'end'}
        onRegenerate={() => void regenerate('end')}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: spacing.md, padding: spacing.md },
  title: { fontFamily: fonts.displayExtra, fontSize: 15, color: colors.ink },
  hint: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 4, marginBottom: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: surfaces.glassBorderStrong,
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
  rowValue: { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.ink, marginTop: 2, letterSpacing: 1 },
  rowMeta: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 2 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnBusy: { opacity: 0.5 },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#EEF8E6',
  },
  pendingText: { fontFamily: fonts.bodySemi, fontSize: 10, color: colors.forest },
});
