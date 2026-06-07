import * as Clipboard from 'expo-clipboard';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Copy, KeyRound } from 'lucide-react-native';
import { appToast } from '@/lib/toast';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { WorkOtpView } from '@/types/api';
import { colors, fonts, premium, spacing } from '@/constants/theme';

export function WorkOtpCard({
  title,
  subtitle,
  otp,
  onRegenerate,
  regenerating,
}: {
  title: string;
  subtitle?: string;
  otp: { code: string; expiresIn: number };
  onRegenerate?: () => void;
  regenerating?: boolean;
}) {
  const [secondsLeft, setSecondsLeft] = useState(otp.expiresIn);

  useEffect(() => {
    setSecondsLeft(otp.expiresIn);
  }, [otp.code, otp.expiresIn]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const expired = secondsLeft <= 0;
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  async function copyCode() {
    await Clipboard.setStringAsync(otp.code);
    appToast.success('Code copied');
  }

  return (
    <Card variant="premium" style={styles.card}>
      <View style={styles.head}>
        <View style={styles.iconWrap}>
          <KeyRound size={20} color={colors.white} />
        </View>
        <View style={styles.headText}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>

      <View style={styles.codeRow}>
        {otp.code.split('').map((digit, i) => (
          <View key={`${digit}-${i}`} style={styles.digitBox}>
            <Text style={styles.digit}>{digit}</Text>
          </View>
        ))}
      </View>

      <Text style={[styles.timer, expired && styles.timerExpired]}>
        {expired ? 'Code expired' : `Expires in ${mins}:${String(secs).padStart(2, '0')}`}
      </Text>

      <View style={styles.actions}>
        <Pressable style={styles.copyBtn} onPress={() => void copyCode()}>
          <Copy size={16} color={colors.green} />
          <Text style={styles.copyText}>Copy code</Text>
        </Pressable>
        {onRegenerate ? (
          <Button
            title={regenerating ? 'Refreshing…' : 'Get new code'}
            variant="secondary"
            onPress={onRegenerate}
            disabled={regenerating}
            style={styles.regenBtn}
          />
        ) : null}
      </View>
    </Card>
  );
}

export function getActiveCustomerOtp(
  workOtp: WorkOtpView | undefined,
  type: 'start' | 'end',
): { code: string; expiresIn: number } | undefined {
  const entry = workOtp?.[type];
  if (!entry?.code || entry.expiresIn <= 0) return undefined;
  return entry;
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  head: { flexDirection: 'row', gap: 12, marginBottom: spacing.md },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headText: { flex: 1 },
  title: { fontFamily: fonts.display, fontSize: 16, color: colors.ink },
  subtitle: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 4, lineHeight: 18 },
  codeRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: spacing.sm },
  digitBox: {
    width: 44,
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.soft,
    borderWidth: 1.5,
    borderColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    ...premium.shadowSoft,
  },
  digit: { fontFamily: fonts.displayExtra, fontSize: 22, color: colors.forest, letterSpacing: 1 },
  timer: {
    textAlign: 'center',
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: colors.muted,
    marginBottom: spacing.md,
  },
  timerExpired: { color: colors.error },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  copyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: colors.soft,
  },
  copyText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.green },
  regenBtn: { flex: 1 },
});
