import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { Button } from '@/components/ui/Button';
import { AppIcons } from '@/constants/appIcons';
import { api, getApiErrorMessage, screenLoadConfig } from '@/lib/api';
import { colors, fonts, premium, shadows, spacing, surfaces, ui } from '@/constants/theme';
import { formatScheduleLabel } from '@/lib/dates';
import type { BookingInvoice } from '@/types/api';

function rupee(n: number): string {
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

export function BookingInvoiceCard({
  bookingId,
  compact,
  autoLoad = true,
  summaryOnly,
}: {
  bookingId: string;
  compact?: boolean;
  /** Prefetch invoice preview on mount. */
  autoLoad?: boolean;
  /**
   * Compact receipt row (number, amount, download / copy / share) — for screens that already
   * show the service, visit and charges, so the invoice doesn't repeat them.
   */
  summaryOnly?: boolean;
}) {
  const [invoice, setInvoice] = useState<BookingInvoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<'share' | 'copy' | null>(null);
  const enter = useRef(new Animated.Value(0)).current;
  const sheen = useRef(new Animated.Value(0)).current;

  const ensureInvoice = useCallback(async (): Promise<BookingInvoice> => {
    if (invoice) return invoice;
    setLoading(true);
    try {
      const { data } = await api.get<{ invoice: BookingInvoice }>(
        `/bookings/${bookingId}/invoice`,
        screenLoadConfig,
      );
      setInvoice(data.invoice);
      return data.invoice;
    } finally {
      setLoading(false);
    }
  }, [bookingId, invoice]);

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(sheen, {
          toValue: 1,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(sheen, {
          toValue: 0,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [enter, sheen]);

  useEffect(() => {
    if (!autoLoad) return;
    void ensureInvoice().catch(() => {
      // preview stays in idle state until user taps download
    });
  }, [autoLoad, ensureInvoice]);

  async function downloadInvoice() {
    setBusy('share');
    try {
      const inv = await ensureInvoice();
      await Share.share({
        title: `${inv.invoiceNumber} · ${inv.brand.name}`,
        message: inv.text,
      });
      Toast.show({ type: 'success', text1: 'Invoice ready to save or share' });
    } catch (err) {
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Could not download invoice') });
    } finally {
      setBusy(null);
    }
  }

  async function copyInvoice() {
    setBusy('copy');
    try {
      const inv = await ensureInvoice();
      await Clipboard.setStringAsync(inv.text);
      Toast.show({ type: 'success', text1: 'Invoice copied' });
    } catch (err) {
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Could not copy invoice') });
    } finally {
      setBusy(null);
    }
  }

  const isPaid = invoice?.booking.status === 'completed';
  const totalLabel = isPaid ? 'Total paid' : 'Amount due';
  const scheduleLabel = invoice
    ? formatScheduleLabel(
        {
          date: invoice.booking.scheduleDate,
          slot: invoice.booking.scheduleSlot,
          time: invoice.booking.scheduleTime,
        },
        invoice.booking.scheduleTime ? 'custom' : 'standard',
      )
    : '';

  const enterStyle = {
    opacity: enter,
    transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
  };
  const sheenStyle = {
    opacity: sheen.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.08, 0.2, 0.08] }),
    transform: [
      { translateX: sheen.interpolate({ inputRange: [0, 1], outputRange: [-40, 60] }) },
      { rotate: '18deg' },
    ],
  };

  if (summaryOnly) {
    return (
      <Animated.View style={[styles.summary, enterStyle]}>
        <View style={styles.summaryTop}>
          <View style={styles.summaryIcon}>
            <PremiumIcon icon={AppIcons.ui.terms} variant="plain" size={20} color={colors.forest} strokeWidth={2} fill="none" />
          </View>
          <View style={styles.summaryText}>
            <Text style={styles.summaryTitle}>Tax invoice</Text>
            <Text style={styles.summaryMeta} numberOfLines={1}>
              {invoice
                ? `${invoice.invoiceNumber} · ${totalLabel} ${rupee(invoice.amount.total)}`
                : loading
                  ? 'Preparing invoice…'
                  : 'Itemised receipt for this visit'}
            </Text>
          </View>
        </View>
        <View style={styles.summaryActions}>
          <Pressable
            style={({ pressed }) => [styles.summaryPrimary, pressed && styles.pressed]}
            onPress={() => void downloadInvoice()}
            disabled={busy === 'share' || loading}
            accessibilityRole="button"
            accessibilityLabel={invoice ? 'Download invoice' : 'Generate invoice'}
          >
            <PremiumIcon icon={AppIcons.ui.download} variant="plain" size={15} color={colors.forest} strokeWidth={2.3} fill="none" />
            <Text style={styles.summaryPrimaryText}>
              {busy === 'share' ? 'Opening…' : invoice ? 'Download' : 'Generate'}
            </Text>
          </Pressable>
          {invoice ? (
            <Pressable
              style={({ pressed }) => [styles.summaryIconBtn, pressed && styles.pressed]}
              onPress={() => void copyInvoice()}
              disabled={busy === 'copy'}
              accessibilityRole="button"
              accessibilityLabel="Copy invoice"
            >
              <PremiumIcon icon={AppIcons.ui.copy} variant="plain" size={16} color={colors.ink} strokeWidth={2.1} fill="none" />
            </Pressable>
          ) : null}
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.shell, compact && styles.shellCompact, enterStyle]}>
      <LinearGradient
        colors={['#1A8A3C', colors.forest, '#043816']}
        locations={[0, 0.55, 1]}
        start={{ x: 0.12, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={styles.hero}
      >
        <Animated.View style={[styles.heroSheen, sheenStyle]} pointerEvents="none" />
        <View style={styles.heroGlow} pointerEvents="none" />

        <View style={styles.heroTop}>
          <View style={styles.badge}>
            <PremiumIcon
              icon={AppIcons.ui.terms}
              variant="plain"
              size={12}
              color={colors.lime}
              strokeWidth={2.4}
            />
            <Text style={styles.badgeText}>TAX INVOICE</Text>
          </View>
          <Text style={styles.invNo}>{invoice?.invoiceNumber ?? '••••••••'}</Text>
        </View>

        <Text style={styles.brand}>{invoice?.brand.name ?? 'Mr Antidot'}</Text>
        <Text style={styles.heroTitle}>Service receipt</Text>
        <Text style={styles.heroSub}>
          {invoice?.brand.tagline ?? 'Itemised charges, visit details & treatment summary'}
        </Text>

        {invoice ? (
          <View style={styles.amountPill}>
            <Text style={styles.amountLabel}>{totalLabel.toUpperCase()}</Text>
            <Text style={styles.amountValue}>{rupee(invoice.amount.total)}</Text>
          </View>
        ) : (
          <View style={styles.amountPillIdle}>
            <Text style={styles.amountIdleText}>
              {loading ? 'Preparing invoice…' : 'Tap below to generate'}
            </Text>
          </View>
        )}
      </LinearGradient>

      <View style={styles.body}>
        {invoice ? (
          <>
            <View style={styles.serviceHead}>
              <Text style={styles.kicker}>SERVICE</Text>
              <Text style={styles.serviceName}>{invoice.service.name}</Text>
              {invoice.service.shortDesc ? (
                <Text style={styles.serviceDesc} numberOfLines={2}>
                  {invoice.service.shortDesc}
                </Text>
              ) : null}
            </View>

            {invoice.service.serviceTypes.length > 0 ? (
              <View style={styles.chipRow}>
                {invoice.service.serviceTypes.slice(0, 4).map((t) => (
                  <View key={t} style={styles.chip}>
                    <Text style={styles.chipText}>{t.replace(/_/g, ' ')}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            <View style={styles.facts}>
              <Fact icon={AppIcons.ui.calendar} label="Visit" value={scheduleLabel || invoice.booking.scheduleLabel} />
              {invoice.booking.propertyTypeLabel ? (
                <Fact icon={AppIcons.ui.mapPinned} label="Property" value={invoice.booking.propertyTypeLabel} />
              ) : null}
              <Fact icon={AppIcons.ui.pay} label="Payment" value={invoice.booking.paymentMethodLabel} />
              {invoice.technician ? (
                <Fact icon={AppIcons.ui.user} label="Technician" value={invoice.technician.name} />
              ) : null}
            </View>

            <View style={styles.chargeBox}>
              <View style={styles.chargeTopRule} />
              <Text style={styles.chargeHeading}>Charges</Text>
              <ChargeRow label="Service" value={rupee(invoice.amount.base)} />
              {invoice.amount.coupon > 0 ? (
                <ChargeRow label="Coupon" value={`−${rupee(invoice.amount.coupon)}`} accent />
              ) : null}
              <ChargeRow label="GST (18%)" value={rupee(invoice.amount.gst)} />
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>{totalLabel}</Text>
                <Text style={styles.totalValue}>{rupee(invoice.amount.total)}</Text>
              </View>
            </View>

            {invoice.steps.length > 0 ? (
              <View style={styles.stepsBlock}>
                <Text style={styles.stepsTitle}>Treatment included</Text>
                {invoice.steps.map((step, i) => (
                  <View key={`${step.title}-${i}`} style={styles.stepRow}>
                    <View style={[styles.stepDot, step.status === 'done' && styles.stepDotDone]}>
                      {step.status === 'done' ? (
                        <PremiumIcon
                          icon={AppIcons.ui.check}
                          variant="plain"
                          size={9}
                          color={colors.white}
                          strokeWidth={3}
                        />
                      ) : null}
                    </View>
                    <Text style={styles.stepLine} numberOfLines={1}>
                      {step.title}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </>
        ) : (
          <View style={styles.idle}>
            <View style={styles.idleIcon}>
              <PremiumIcon
                icon={AppIcons.ui.download}
                variant="mint"
                size={22}
                color={colors.forest}
                boxSize={52}
              />
            </View>
            <Text style={styles.idleTitle}>Premium invoice</Text>
            <Text style={styles.placeholder}>
              Download a branded receipt with service coverage, visit details, and itemised charges.
            </Text>
          </View>
        )}

        <Button
          title={invoice ? 'Download invoice' : 'Generate invoice'}
          variant="premium"
          loading={loading || busy === 'share'}
          onPress={() => void downloadInvoice()}
        />

        {invoice ? (
          <View style={styles.secondaryRow}>
            <Pressable
              style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
              onPress={() => void copyInvoice()}
              disabled={busy === 'copy'}
              accessibilityRole="button"
              accessibilityLabel="Copy invoice"
            >
              <PremiumIcon
                icon={AppIcons.ui.copy}
                variant="plain"
                size={14}
                color={colors.forest}
                strokeWidth={2.2}
              />
              <Text style={styles.secondaryText}>{busy === 'copy' ? 'Copying…' : 'Copy'}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
              onPress={() => void downloadInvoice()}
              disabled={busy === 'share'}
              accessibilityRole="button"
              accessibilityLabel="Share invoice"
            >
              <PremiumIcon
                icon={AppIcons.ui.share}
                variant="plain"
                size={14}
                color={colors.forest}
                strokeWidth={2.2}
              />
              <Text style={styles.secondaryText}>Share</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </Animated.View>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof AppIcons.ui.calendar;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.fact}>
      <PremiumIcon icon={Icon} variant="plain" size={13} color={colors.forest} strokeWidth={2.2} />
      <View style={styles.factCopy}>
        <Text style={styles.factLabel}>{label}</Text>
        <Text style={styles.factValue} numberOfLines={2}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function ChargeRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={styles.chargeRow}>
      <Text style={styles.chargeLabel}>{label}</Text>
      <Text style={[styles.chargeValue, accent && styles.chargeAccent]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  summary: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    gap: 14,
  },
  summaryTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: ui.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryText: { flex: 1, minWidth: 0 },
  summaryTitle: { fontFamily: fonts.display, fontSize: 15.5, color: ui.text },
  summaryMeta: { marginTop: 2, fontFamily: fonts.bodyMedium, fontSize: 12.5, color: ui.textSecondary },
  summaryActions: { flexDirection: 'row', gap: 10 },
  summaryPrimary: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: colors.white,
  },
  summaryPrimaryText: { fontFamily: fonts.bodyBold, fontSize: 14, color: ui.brand },
  summaryIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ui.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shell: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(10,100,35,0.14)',
    backgroundColor: colors.white,
    ...shadows.elevated,
  },
  shellCompact: { marginHorizontal: 0 },
  hero: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg + 4,
    overflow: 'hidden',
  },
  heroSheen: {
    position: 'absolute',
    top: -20,
    left: '20%',
    width: 70,
    height: '140%',
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  heroGlow: {
    position: 'absolute',
    top: -48,
    right: -36,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(143,208,60,0.22)',
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(143,208,60,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(184,232,106,0.4)',
  },
  badgeText: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    letterSpacing: 1.2,
    color: colors.lime,
  },
  invNo: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    letterSpacing: 0.3,
    color: 'rgba(255,255,255,0.7)',
  },
  brand: {
    fontFamily: fonts.brand,
    fontSize: 13,
    letterSpacing: 0.4,
    color: 'rgba(255,255,255,0.78)',
    marginBottom: 4,
  },
  heroTitle: {
    fontFamily: fonts.displayExtra,
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: -0.7,
    color: colors.white,
  },
  heroSub: {
    marginTop: 8,
    fontFamily: fonts.body,
    fontSize: 13.5,
    lineHeight: 19,
    color: 'rgba(255,255,255,0.7)',
    maxWidth: 300,
  },
  amountPill: {
    marginTop: 16,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  amountLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 9.5,
    letterSpacing: 1.1,
    color: 'rgba(255,255,255,0.62)',
  },
  amountValue: {
    marginTop: 2,
    fontFamily: fonts.displayExtra,
    fontSize: 24,
    letterSpacing: -0.5,
    color: colors.white,
  },
  amountPillIdle: {
    marginTop: 16,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  amountIdleText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.72)',
  },
  body: {
    padding: spacing.lg - 2,
    gap: 14,
  },
  idle: { alignItems: 'center', paddingVertical: 6, gap: 8 },
  idleIcon: { marginBottom: 2 },
  idleTitle: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: colors.ink,
    letterSpacing: -0.2,
  },
  placeholder: {
    fontFamily: fonts.body,
    fontSize: 13.5,
    lineHeight: 20,
    color: colors.muted,
    textAlign: 'center',
    maxWidth: 280,
  },
  serviceHead: { gap: 4 },
  kicker: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    letterSpacing: 1.1,
    color: colors.forest,
  },
  serviceName: {
    fontFamily: fonts.displayExtra,
    fontSize: 18,
    letterSpacing: -0.35,
    color: colors.ink,
  },
  serviceDesc: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
  },
  chipText: {
    fontFamily: fonts.bodySemi,
    fontSize: 11.5,
    color: colors.forest,
    textTransform: 'capitalize',
  },
  facts: { gap: 10 },
  fact: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  factCopy: { flex: 1, minWidth: 0, gap: 1 },
  factLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 10.5,
    letterSpacing: 0.4,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  factValue: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    lineHeight: 19,
    color: colors.ink,
  },
  chargeBox: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: surfaces.glassInput,
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
    gap: 8,
    overflow: 'hidden',
  },
  chargeTopRule: {
    position: 'absolute',
    top: 0,
    left: 14,
    right: 14,
    height: 2,
    backgroundColor: premium.accentGold,
    opacity: 0.55,
    borderRadius: 1,
  },
  chargeHeading: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: colors.muted,
    marginBottom: 2,
  },
  chargeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chargeLabel: { fontFamily: fonts.body, fontSize: 13.5, color: colors.muted },
  chargeValue: { fontFamily: fonts.bodySemi, fontSize: 13.5, color: colors.ink },
  chargeAccent: { color: colors.green },
  totalRow: {
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: surfaces.glassBorder,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  totalLabel: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.ink },
  totalValue: {
    fontFamily: fonts.displayExtra,
    fontSize: 22,
    color: colors.forest,
    letterSpacing: -0.4,
  },
  stepsBlock: { gap: 8 },
  stepsTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: surfaces.glassBorderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  stepDotDone: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  stepLine: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 13.5,
    color: colors.ink,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
  },
  secondaryText: {
    fontFamily: fonts.bodySemi,
    fontSize: 13.5,
    color: colors.forest,
  },
  pressed: { opacity: 0.82, transform: [{ scale: 0.985 }] },
});
