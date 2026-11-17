import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ArrowRight, BadgeCheck, Info, Star, Tag, type LucideIcon } from 'lucide-react-native';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { PressableScale } from '@/components/ui/PressableScale';
import { ServiceThumb } from '@/components/kit/ServiceThumb';
import { FocusStatusBar } from '@/components/ui/FocusStatusBar';
import { serviceDisplayRating } from '@/lib/ratings';
import type { BookingAmount, Offer, Service } from '@/types/api';
import { colors, fonts, spacing, ui } from '@/constants/theme';

/** ₹1,179 — Indian digit grouping, used everywhere in the booking flow. */
export function rupee(n: number): string {
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

/* ─── Header ───────────────────────────────────────────────────────── */

/** Urban-style checkout header — back arrow, step title, service line, segmented progress. */
export function BookFlowHeader({
  title,
  subtitle,
  step,
  totalSteps,
  stepLabels,
  onBack,
  onStepPress,
}: {
  title: string;
  subtitle?: string;
  step: number;
  totalSteps: number;
  stepLabels: readonly string[];
  onBack: () => void;
  /** Jump back to an earlier (completed) step. */
  onStepPress?: (index: number) => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
      <FocusStatusBar style="dark" />
      <View style={styles.headerRow}>
        <PressableScale
          scaleTo={0.92}
          onPress={onBack}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <GlassSurface style={styles.backBtn} intensity={30} tintOpacity={0.8}>
            <ArrowLeft size={20} color={ui.text} strokeWidth={2.2} />
          </GlassSurface>
        </PressableScale>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.headerSub} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <Text style={styles.stepCount}>
          {step + 1}/{totalSteps}
        </Text>
      </View>
      <View style={styles.segments} accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: totalSteps, now: step + 1 }}>
        {Array.from({ length: totalSteps }, (_, i) => {
          const done = i < step;
          const current = i === step;
          return (
            <Pressable
              key={i}
              style={styles.segmentHit}
              disabled={!done || !onStepPress}
              onPress={() => onStepPress?.(i)}
              accessibilityRole="button"
              accessibilityLabel={`${stepLabels[i] ?? `Step ${i + 1}`}${done ? ', completed' : current ? ', current' : ''}`}
            >
              <View style={[styles.segment, (done || current) && styles.segmentOn]} />
              <Text style={[styles.segmentLabel, current && styles.segmentLabelOn, done && styles.segmentLabelDone]} numberOfLines={1}>
                {stepLabels[i]}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/* ─── Sections ─────────────────────────────────────────────────────── */

/** Flat full-width white section — the building block of every step. */
export function BookSection({
  title,
  subtitle,
  right,
  children,
  flush,
}: {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
  /** No horizontal padding — for edge-to-edge rails. */
  flush?: boolean;
}) {
  return (
    <View style={[styles.section, flush && styles.sectionFlush]}>
      {title ? (
        <View style={[styles.sectionHead, flush && styles.sectionHeadFlush]}>
          <View style={styles.sectionTitles}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {subtitle ? <Text style={styles.sectionSub}>{subtitle}</Text> : null}
          </View>
          {right}
        </View>
      ) : null}
      {children}
    </View>
  );
}

/** Service the customer is booking — thumbnail, name, duration, rating, price. */
export function BookServiceSummary({ service, durationLabel }: { service: Service; durationLabel: string }) {
  const rating = serviceDisplayRating(service);
  return (
    <View style={styles.serviceRow}>
      <ServiceThumb service={service} width={64} radius={16} iconSize={32} />
      <View style={styles.serviceText}>
        <Text style={styles.serviceName} numberOfLines={2}>
          {service.name}
        </Text>
        <View style={styles.serviceMetaRow}>
          {rating > 0 ? (
            <>
              <Star size={12} color={ui.star} fill={ui.star} strokeWidth={1.5} />
              <Text style={styles.serviceMeta}>{rating.toFixed(1)}</Text>
              <Text style={styles.serviceDot}>·</Text>
            </>
          ) : null}
          <Text style={styles.serviceMeta}>{durationLabel}</Text>
        </View>
      </View>
      <Text style={styles.servicePrice}>{rupee(service.basePrice)}</Text>
    </View>
  );
}

/* ─── Payment ──────────────────────────────────────────────────────── */

function offerValue(o: Offer): string {
  return o.discountType === 'percent' ? `${o.discount}% off` : `${rupee(o.discount)} off`;
}

/** Coupons as a tappable list with Apply / Remove — Urban "Coupons and offers". */
export function BookOfferList({
  offers,
  appliedCode,
  onApply,
}: {
  offers: Offer[];
  appliedCode: string;
  onApply: (code: string) => void;
}) {
  const applied = appliedCode.trim().toUpperCase();
  return (
    <View style={styles.offerList}>
      {offers.map((o, i) => {
        const on = applied === o.code.toUpperCase();
        return (
          <Pressable
            key={o.id}
            onPress={() => onApply(on ? '' : o.code)}
            style={({ pressed }) => [styles.offerRow, i > 0 && styles.offerDivider, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`${o.code}, ${offerValue(o)}. ${on ? 'Applied, tap to remove' : 'Tap to apply'}`}
          >
            <View style={[styles.offerIcon, on && styles.offerIconOn]}>
              {on ? (
                <BadgeCheck size={18} color={colors.white} strokeWidth={2.2} />
              ) : (
                <Tag size={17} color={ui.brand} strokeWidth={2.1} />
              )}
            </View>
            <View style={styles.offerText}>
              <Text style={styles.offerTitle}>
                {offerValue(o)} <Text style={styles.offerCode}>· {o.code}</Text>
              </Text>
              {o.description ? (
                <Text style={styles.offerDesc} numberOfLines={1}>
                  {o.description}
                </Text>
              ) : null}
            </View>
            <Text style={[styles.offerAction, on && styles.offerActionOn]}>{on ? 'Remove' : 'Apply'}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Itemised bill — item total, taxes, discount, amount to pay, savings ribbon. */
export function BookBillSummary({
  amount,
  totalLabel = 'Amount to pay',
}: {
  amount: Pick<BookingAmount, 'base' | 'gst' | 'coupon' | 'total'>;
  totalLabel?: string;
}) {
  return (
    <View>
      <BillRow label="Item total" value={rupee(amount.base)} />
      <BillRow label="Taxes (GST 18%)" value={rupee(amount.gst)} />
      {amount.coupon > 0 ? <BillRow label="Coupon discount" value={`−${rupee(amount.coupon)}`} accent /> : null}
      <View style={styles.billDivider} />
      <View style={styles.billTotalRow}>
        <Text style={styles.billTotalLabel}>{totalLabel}</Text>
        <Text style={styles.billTotal}>{rupee(amount.total)}</Text>
      </View>
      {amount.coupon > 0 ? (
        <View style={styles.saveRibbon}>
          <BadgeCheck size={16} color={ui.brand} strokeWidth={2.2} />
          <Text style={styles.saveText}>You're saving {rupee(amount.coupon)} on this booking</Text>
        </View>
      ) : null}
    </View>
  );
}

function BillRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={styles.billRow}>
      <Text style={styles.billLabel}>{label}</Text>
      <Text style={[styles.billValue, accent && styles.billAccent]}>{value}</Text>
    </View>
  );
}

/* ─── Review ───────────────────────────────────────────────────────── */

/** Review row — icon, label, value, and a "Change" link back to the step that set it. */
export function BookReviewRow({
  icon: Icon,
  label,
  value,
  onChange,
  last,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  onChange?: () => void;
  last?: boolean;
}) {
  return (
    <View style={[styles.reviewRow, !last && styles.reviewDivider]}>
      <View style={styles.reviewIcon}>
        <Icon size={17} color={ui.textSecondary} strokeWidth={2} />
      </View>
      <View style={styles.reviewText}>
        <Text style={styles.reviewLabel}>{label}</Text>
        <Text style={styles.reviewValue}>{value}</Text>
      </View>
      {onChange ? (
        <Pressable onPress={onChange} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Change ${label}`}>
          <Text style={styles.reviewChange}>Change</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Quiet info note (policy / what happens next). */
export function BookInfoNote({ title, children }: { title: string; children: string }) {
  return (
    <View style={styles.note}>
      <Info size={16} color={ui.textSecondary} strokeWidth={2} />
      <View style={styles.noteText}>
        <Text style={styles.noteTitle}>{title}</Text>
        <Text style={styles.noteBody}>{children}</Text>
      </View>
    </View>
  );
}

/* ─── Bottom bar ───────────────────────────────────────────────────── */

/** Checkout dock — total on the left, primary action on the right (Urban cart bar). */
export function BookCheckoutBar({
  total,
  savings,
  caption,
  actionTitle,
  onAction,
  loading,
  disabled,
}: {
  total: number;
  savings?: number;
  caption?: string;
  actionTitle: string;
  onAction: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(enter, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [enter]);

  const blocked = disabled || loading;

  return (
    <Animated.View
      style={[
        styles.bar,
        {
          paddingBottom: Math.max(insets.bottom, spacing.sm) + 4,
          opacity: enter,
          transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
        },
      ]}
    >
      <View style={styles.barPrice}>
        <Text style={styles.barTotal}>{rupee(total)}</Text>
        {savings && savings > 0 ? (
          <Text style={styles.barSaving}>Saving {rupee(savings)}</Text>
        ) : (
          <Text style={styles.barCaption}>{caption ?? 'incl. taxes'}</Text>
        )}
      </View>
      <PressableScale
        onPress={onAction}
        disabled={blocked}
        containerStyle={styles.barBtnWrap}
        style={[styles.barBtn, blocked && styles.barBtnDisabled]}
        accessibilityRole="button"
        accessibilityState={{ disabled: blocked, busy: loading }}
      >
        <Text style={styles.barBtnText}>{loading ? 'Please wait…' : actionTitle}</Text>
        {!loading ? (
          <View style={styles.barArrow}>
            <ArrowRight size={15} color={blocked ? '#8A938D' : ui.brand} strokeWidth={2.6} />
          </View>
        ) : null}
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.75 },

  header: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ui.border,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: ui.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1, minWidth: 0 },
  headerTitle: { fontFamily: fonts.displayExtra, fontSize: 18, lineHeight: 23, letterSpacing: -0.3, color: ui.text },
  headerSub: { marginTop: 1, fontFamily: fonts.body, fontSize: 12.5, color: ui.textSecondary },
  stepCount: { fontFamily: fonts.bodyBold, fontSize: 12.5, color: ui.textTertiary },
  segments: { flexDirection: 'row', gap: 6, marginTop: 10 },
  segmentHit: { flex: 1 },
  segment: { height: 4, borderRadius: 2, backgroundColor: ui.surfaceMuted },
  segmentOn: { backgroundColor: ui.brand },
  segmentLabel: {
    marginTop: 6,
    fontFamily: fonts.bodySemi,
    fontSize: 10.5,
    color: ui.textTertiary,
  },
  segmentLabelOn: { color: ui.text },
  segmentLabelDone: { color: ui.brand },

  section: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: 18,
    marginBottom: 8,
  },
  sectionFlush: { paddingHorizontal: 0 },
  sectionHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  sectionHeadFlush: { paddingHorizontal: spacing.md },
  sectionTitles: { flex: 1, minWidth: 0 },
  sectionTitle: { fontFamily: fonts.displayExtra, fontSize: 17, lineHeight: 22, letterSpacing: -0.35, color: ui.text },
  sectionSub: { marginTop: 3, fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: ui.textSecondary },

  serviceRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  serviceText: { flex: 1, minWidth: 0 },
  serviceName: { fontFamily: fonts.display, fontSize: 16, lineHeight: 21, letterSpacing: -0.2, color: ui.text },
  serviceMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  serviceMeta: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: ui.textSecondary },
  serviceDot: { fontFamily: fonts.body, fontSize: 12.5, color: ui.textTertiary },
  servicePrice: { fontFamily: fonts.displayExtra, fontSize: 17, color: ui.text },

  offerList: {
    borderWidth: 1,
    borderColor: ui.border,
    borderRadius: 16,
    overflow: 'hidden',
  },
  offerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 13 },
  offerDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: ui.border },
  offerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: ui.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offerIconOn: { backgroundColor: ui.brand },
  offerText: { flex: 1, minWidth: 0 },
  offerTitle: { fontFamily: fonts.bodyBold, fontSize: 14, color: ui.text },
  offerCode: { fontFamily: fonts.bodySemi, fontSize: 13, color: ui.textSecondary, letterSpacing: 0.4 },
  offerDesc: { marginTop: 2, fontFamily: fonts.body, fontSize: 12.5, color: ui.textSecondary },
  offerAction: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: ui.brand },
  offerActionOn: { color: colors.error },

  billRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  billLabel: { fontFamily: fonts.body, fontSize: 14, color: ui.textSecondary },
  billValue: { fontFamily: fonts.bodySemi, fontSize: 14, color: ui.text },
  billAccent: { color: ui.brand },
  billDivider: {
    marginVertical: 10,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: ui.border,
  },
  billTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  billTotalLabel: { fontFamily: fonts.bodyBold, fontSize: 15, color: ui.text },
  billTotal: { fontFamily: fonts.displayExtra, fontSize: 19, letterSpacing: -0.3, color: ui.text },
  saveRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: ui.brandSoft,
  },
  saveText: { flex: 1, fontFamily: fonts.bodySemi, fontSize: 13, color: ui.brand },

  reviewRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 13 },
  reviewDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: ui.border },
  reviewIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: ui.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewText: { flex: 1, minWidth: 0 },
  reviewLabel: { fontFamily: fonts.bodySemi, fontSize: 12, color: ui.textTertiary },
  reviewValue: { marginTop: 2, fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 20, color: ui.text },
  reviewChange: { paddingTop: 8, fontFamily: fonts.bodyBold, fontSize: 13, color: ui.brand },

  note: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    backgroundColor: ui.surfaceMuted,
  },
  noteText: { flex: 1 },
  noteTitle: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: ui.text },
  noteBody: { marginTop: 3, fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, color: ui.textSecondary },

  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: spacing.md,
    paddingTop: 12,
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ui.border,
    shadowColor: '#0B140F',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 12,
  },
  barPrice: { minWidth: 0, flexShrink: 1 },
  barTotal: { fontFamily: fonts.displayExtra, fontSize: 20, letterSpacing: -0.4, color: ui.text },
  barCaption: { marginTop: 1, fontFamily: fonts.bodyMedium, fontSize: 12, color: ui.textSecondary },
  barSaving: { marginTop: 1, fontFamily: fonts.bodyBold, fontSize: 12, color: ui.brand },
  barBtnWrap: { flex: 1 },
  barBtn: {
    height: 54,
    paddingLeft: 22,
    paddingRight: 8,
    borderRadius: 27,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: ui.brand,
    ...ui.shadowFloat,
  },
  barArrow: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barBtnDisabled: { backgroundColor: '#B9C4BD' },
  barBtnText: { fontFamily: fonts.bodyBold, fontSize: 15.5, color: colors.white },
});
