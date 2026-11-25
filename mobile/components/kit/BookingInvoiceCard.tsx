import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Share, StyleSheet, Text, View } from 'react-native';
import { PressableScale } from '@/components/ui/PressableScale';
import { fillCopy } from '@/constants/customerUiCopy';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { useBusinessSettings } from '@/lib/businessSettings';
import { gstLabel } from '@/lib/settingsLabels';
import { haptic } from '@/lib/motion';
import Toast from 'react-native-toast-message';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { Button } from '@/components/ui/Button';
import { AppIcons } from '@/constants/appIcons';
import { api, getApiErrorMessage, screenLoadConfig } from '@/lib/api';
import { colors, fonts, premium, radii, shadows, spacing, surfaces, typeScale, ui } from '@/constants/theme';
import { formatScheduleLabel } from '@/lib/dates';
import { getReducedMotion, useAmbientLoop } from '@/lib/a11yPrefs';
import { motion } from '@/lib/motion';
import type { BookingInvoice } from '@/types/api';

function rupee(n: number): string {
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

export function BookingInvoiceCard({
  bookingId,
  refreshKey,
  compact,
  autoLoad = true,
  summaryOnly,
}: {
  bookingId: string;
  /** Change it (e.g. status + schedule) to drop the cached invoice and fetch a fresh one. */
  refreshKey?: string;
  compact?: boolean;
  /** Prefetch invoice preview on mount. */
  autoLoad?: boolean;
  /**
   * Compact receipt row (number, amount, download / copy / share) — for screens that already
   * show the service, visit and charges, so the invoice doesn't repeat them.
   */
  summaryOnly?: boolean;
}) {
  const copy = useCustomerUiCopy();
  const settings = useBusinessSettings();
  /** Seller details for the invoice (Business settings → Invoice); lines only show once set. */
  const legal = settings.invoice;
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
    if (getReducedMotion()) {
      enter.setValue(1);
      return;
    }
    const anim = Animated.timing(enter, {
      toValue: 1,
      duration: motion.duration.slow,
      easing: motion.easing.out,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [enter]);

  // Decorative sheen — stops when the screen is hidden, the app is in the background or Reduce Motion is on.
  useAmbientLoop(
    () =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(sheen, { toValue: 1, duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(sheen, { toValue: 0, duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      ),
    [sheen],
  );

  const lastRefreshKey = useRef(refreshKey);
  useEffect(() => {
    if (lastRefreshKey.current === refreshKey) return;
    lastRefreshKey.current = refreshKey;
    setInvoice(null);
  }, [refreshKey]);

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
      Toast.show({ type: 'success', text1: copy.invoiceReadyToast });
    } catch (err) {
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, copy.invoiceDownloadFailed) });
    } finally {
      setBusy(null);
    }
  }

  async function copyInvoice() {
    setBusy('copy');
    try {
      const inv = await ensureInvoice();
      await Clipboard.setStringAsync(inv.text);
      haptic('success');
      Toast.show({ type: 'success', text1: copy.invoiceCopied });
    } catch (err) {
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, copy.invoiceCopyFailed) });
    } finally {
      setBusy(null);
    }
  }

  const isPaid = invoice?.booking.status === 'completed';
  const totalLabel = isPaid ? copy.invoiceTotalPaid : copy.invoiceAmountDue;
  // Seller details: the invoice's own copy (frozen when it was issued) wins over today's settings.
  const seller = {
    legalName: invoice?.seller?.legalName?.trim() || legal.legalName?.trim() || '',
    gstin: invoice?.seller?.gstin?.trim() || legal.gstin?.trim() || '',
    address: invoice?.seller?.address?.trim() || legal.address?.trim() || '',
  };
  const legalLines = [seller.legalName, seller.gstin ? fillCopy(copy.invoiceGstin, { gstin: seller.gstin }) : '', seller.address].filter(
    (l): l is string => Boolean(l),
  );
  const footerLine = invoice?.footer?.trim() || legal.footer?.trim() || '';
  const taxLabel = invoice?.tax?.label?.trim() || gstLabel(copy.billGst, settings, invoice?.tax?.gstPercent);
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
            <Text style={styles.summaryTitle}>{copy.invoiceTaxTitle}</Text>
            {/* The amount is shown once, in the charges above — the receipt row only names the invoice. */}
            <Text style={styles.summaryMeta} numberOfLines={1}>
              {invoice ? invoice.invoiceNumber : loading ? copy.invoicePreparing : copy.invoiceItemised}
            </Text>
            {legalLines.map((line) => (
              <Text key={line} style={styles.summaryLegal} numberOfLines={2}>
                {line}
              </Text>
            ))}
            {invoice && footerLine ? (
              <Text style={styles.summaryLegal} numberOfLines={2}>
                {footerLine}
              </Text>
            ) : null}
          </View>
        </View>
        <View style={styles.summaryActions}>
          <PressableScale
            containerStyle={styles.summaryPrimaryWrap}
            style={styles.summaryPrimary}
            onPress={() => void downloadInvoice()}
            disabled={busy === 'share' || loading}
            haptic="tap"
            accessibilityRole="button"
            accessibilityLabel={invoice ? copy.invoiceDownloadA11y : copy.invoiceGenerateA11y}
          >
            <PremiumIcon icon={AppIcons.ui.download} variant="plain" size={15} color={colors.forest} strokeWidth={2.3} fill="none" />
            <Text style={styles.summaryPrimaryText}>
              {busy === 'share' ? copy.invoiceOpening : invoice ? copy.invoiceDownload : copy.invoiceGenerate}
            </Text>
          </PressableScale>
          {invoice ? (
            <PressableScale
              style={styles.summaryIconBtn}
              onPress={() => void copyInvoice()}
              disabled={busy === 'copy'}
              accessibilityRole="button"
              accessibilityLabel={copy.invoiceCopyA11y}
            >
              <PremiumIcon icon={AppIcons.ui.copy} variant="plain" size={16} color={colors.ink} strokeWidth={2.1} fill="none" />
            </PressableScale>
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
            <Text style={styles.badgeText}>{copy.invoiceBadge}</Text>
          </View>
          <Text style={styles.invNo}>{invoice?.invoiceNumber ?? '••••••••'}</Text>
        </View>

        <Text style={styles.brand}>{seller.legalName || invoice?.brand.name || 'Mr Antidot'}</Text>
        <Text style={styles.heroTitle}>{copy.invoiceReceiptTitle}</Text>
        <Text style={styles.heroSub}>{invoice?.brand.tagline || copy.invoiceReceiptSub}</Text>
        {legalLines.slice(1).map((line) => (
          <Text key={line} style={styles.heroLegal}>
            {line}
          </Text>
        ))}

        {invoice ? (
          <View style={styles.amountPill}>
            <Text style={styles.amountLabel}>{totalLabel.toUpperCase()}</Text>
            <Text style={styles.amountValue}>{rupee(invoice.amount.total)}</Text>
          </View>
        ) : (
          <View style={styles.amountPillIdle}>
            <Text style={styles.amountIdleText}>
              {loading ? copy.invoicePreparing : copy.invoiceTapToGenerate}
            </Text>
          </View>
        )}
      </LinearGradient>

      <View style={styles.body}>
        {invoice ? (
          <>
            <View style={styles.serviceHead}>
              <Text style={styles.kicker}>{copy.invoiceServiceKicker}</Text>
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
              <Fact icon={AppIcons.ui.calendar} label={copy.invoiceFactVisit} value={scheduleLabel || invoice.booking.scheduleLabel} />
              {invoice.booking.propertyTypeLabel ? (
                <Fact icon={AppIcons.ui.mapPinned} label={copy.invoiceFactProperty} value={invoice.booking.propertyTypeLabel} />
              ) : null}
              <Fact icon={AppIcons.ui.pay} label={copy.invoiceFactPayment} value={invoice.booking.paymentMethodLabel} />
              {invoice.technician ? (
                <Fact icon={AppIcons.ui.user} label={copy.invoiceFactTechnician} value={invoice.technician.name} />
              ) : null}
            </View>

            <View style={styles.chargeBox}>
              <View style={styles.chargeTopRule} />
              <Text style={styles.chargeHeading}>{copy.invoiceCharges}</Text>
              <ChargeRow label={copy.invoiceChargeService} value={rupee(invoice.amount.base)} />
              {invoice.amount.coupon > 0 ? (
                <ChargeRow label={copy.invoiceChargeCoupon} value={`−${rupee(invoice.amount.coupon)}`} accent />
              ) : null}
              {(invoice.adjustments ?? []).map((line, i) => (
                <ChargeRow
                  key={`${line.label}-${i}`}
                  label={line.label}
                  value={line.amount < 0 ? `−${rupee(Math.abs(line.amount))}` : rupee(line.amount)}
                  accent={line.amount < 0}
                />
              ))}
              <ChargeRow label={taxLabel} value={rupee(invoice.amount.gst)} />
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>{totalLabel}</Text>
                <Text style={styles.totalValue}>{rupee(invoice.amount.total)}</Text>
              </View>
            </View>

            {invoice.steps.length > 0 ? (
              <View style={styles.stepsBlock}>
                <Text style={styles.stepsTitle}>{copy.invoiceTreatment}</Text>
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
            {footerLine ? <Text style={styles.footerLine}>{footerLine}</Text> : null}
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
            <Text style={styles.idleTitle}>{copy.invoicePremiumTitle}</Text>
            <Text style={styles.placeholder}>{copy.invoicePremiumBody}</Text>
          </View>
        )}

        <Button
          title={invoice ? copy.invoiceDownloadA11y : copy.invoiceGenerateA11y}
          variant="premium"
          loading={loading || busy === 'share'}
          onPress={() => void downloadInvoice()}
        />

        {invoice ? (
          <View style={styles.secondaryRow}>
            <PressableScale
              containerStyle={styles.secondaryWrap}
              style={styles.secondaryBtn}
              onPress={() => void copyInvoice()}
              disabled={busy === 'copy'}
              accessibilityRole="button"
              accessibilityLabel={copy.invoiceCopyA11y}
            >
              <PremiumIcon
                icon={AppIcons.ui.copy}
                variant="plain"
                size={14}
                color={colors.forest}
                strokeWidth={2.2}
              />
              <Text style={styles.secondaryText}>{busy === 'copy' ? copy.invoiceCopying : copy.invoiceCopy}</Text>
            </PressableScale>
            <PressableScale
              containerStyle={styles.secondaryWrap}
              style={styles.secondaryBtn}
              onPress={() => void downloadInvoice()}
              disabled={busy === 'share'}
              accessibilityRole="button"
              accessibilityLabel={copy.invoiceShareA11y}
            >
              <PremiumIcon
                icon={AppIcons.ui.share}
                variant="plain"
                size={14}
                color={colors.forest}
                strokeWidth={2.2}
              />
              <Text style={styles.secondaryText}>{copy.invoiceShare}</Text>
            </PressableScale>
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
      <Text style={[styles.chargeLabel, styles.chargeLabelFlex]}>{label}</Text>
      <Text style={[styles.chargeValue, accent && styles.chargeAccent]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  summary: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radii.card,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    gap: 14,
  },
  summaryLegal: { ...typeScale.caption, fontSize: 12, marginTop: 2, color: ui.textTertiary },
  footerLine: { ...typeScale.caption, marginTop: spacing.md, textAlign: 'center', color: ui.textSecondary },
  summaryPrimaryWrap: { flex: 1 },
  secondaryWrap: { flex: 1 },
  heroLegal: { ...typeScale.caption, fontSize: 12, marginTop: 2, color: 'rgba(255,255,255,0.78)' },
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
  summaryTitle: { ...typeScale.rowTitle, fontFamily: fonts.display, color: ui.text },
  summaryMeta: { ...typeScale.caption, fontSize: 12.5, marginTop: 2, color: ui.textSecondary },
  summaryActions: { flexDirection: 'row', gap: 10 },
  summaryPrimary: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: colors.white,
  },
  summaryPrimaryText: { fontFamily: fonts.bodyBold, fontSize: 14, color: ui.brand },
  summaryIconBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.control,
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
    gap: 12,
  },
  chargeLabel: { fontFamily: fonts.body, fontSize: 13.5, color: colors.muted },
  /** Long admin-written lines wrap instead of pushing the amount off the edge. */
  chargeLabelFlex: { flex: 1, minWidth: 0 },
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    minHeight: 44,
    borderRadius: radii.control,
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
