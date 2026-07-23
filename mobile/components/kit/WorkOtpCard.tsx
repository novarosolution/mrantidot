import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { GlassPanel } from '@/components/kit/GlassScreenKit';
import { AppIcons } from '@/constants/appIcons';
import { appToast } from '@/lib/toast';
import { Button } from '@/components/ui/Button';
import type { WorkOtpView } from '@/types/api';
import { adminType, colors, gradients, premium, spacing, surfaces } from '@/constants/theme';

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
    <GlassPanel style={styles.shell} padded={false} tone="light" goldEdge intensity={40}>
      <View style={styles.card}>
        <View style={styles.head}>
          <LinearGradient colors={[...gradients.headerDark]} style={styles.iconWrap} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <PremiumIcon icon={AppIcons.ui.key} variant="plain" size="md" color={colors.lime} />
          </LinearGradient>
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
            <PremiumIcon icon={AppIcons.ui.copy} variant="plain" size="sm" color={colors.forest} />
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
      </View>
    </GlassPanel>
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
  shell: { marginBottom: spacing.md, borderRadius: 20 },
  card: { padding: spacing.md, paddingTop: spacing.sm + 10 },
  head: { flexDirection: 'row', gap: 12, marginBottom: spacing.md },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  headText: { flex: 1, gap: 2 },
  title: { ...adminType.formTitle, fontSize: 16 },
  subtitle: { ...adminType.formSub, marginTop: 0 },
  codeRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: spacing.sm },
  digitBox: {
    width: 44,
    height: 52,
    borderRadius: 14,
    backgroundColor: surfaces.glassSoft,
    borderWidth: 1.5,
    borderColor: surfaces.glassBorderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    ...premium.shadowSoft,
  },
  digit: { ...adminType.statValue, fontSize: 22, letterSpacing: 1 },
  timer: {
    textAlign: 'center',
    ...adminType.formSub,
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
    borderRadius: 16,
    backgroundColor: 'rgba(238,248,230,0.65)',
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
  },
  copyText: { ...adminType.chipText },
  regenBtn: { flex: 1 },
});
