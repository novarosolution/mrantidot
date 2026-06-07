import { LinearGradient } from 'expo-linear-gradient';
import { type LucideIcon } from 'lucide-react-native';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ShieldCheck, Sparkles } from 'lucide-react-native';
import type { BookingAmount } from '@/types/api';
import type { PickedImage } from '@/lib/upload';
import { colors, fonts, gradients, premium, spacing } from '@/constants/theme';

export type ConfirmDetailItem = {
  icon: LucideIcon;
  label: string;
  value: string;
};

export function ConfirmDetailsList({ items }: { items: ConfirmDetailItem[] }) {
  return (
    <View style={styles.list}>
      {items.map((item, index) => (
        <ConfirmDetailRow key={item.label} {...item} isLast={index === items.length - 1} />
      ))}
    </View>
  );
}

function ConfirmDetailRow({
  icon: Icon,
  label,
  value,
  isLast,
}: ConfirmDetailItem & { isLast?: boolean }) {
  return (
    <View style={[styles.row, !isLast && styles.rowBorder]}>
      <View style={styles.rowIcon}>
        <Icon size={18} color={colors.forest} strokeWidth={2.2} />
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
    </View>
  );
}

export function ConfirmPhotoStrip({ photos }: { photos: PickedImage[] }) {
  if (photos.length === 0) return null;

  return (
    <View style={styles.photoWrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRow}>
        {photos.map((photo, index) => (
          <View key={photo.uri} style={styles.photoTile}>
            <Image source={{ uri: photo.uri }} style={styles.photoImg} resizeMode="cover" />
            <View style={styles.photoBadge}>
              <Text style={styles.photoBadgeText}>{index + 1}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export function ConfirmTotalCard({
  amount,
  paymentLabel,
}: {
  amount: Pick<BookingAmount, 'base' | 'gst' | 'coupon' | 'total'>;
  paymentLabel: string;
}) {
  return (
    <LinearGradient
      colors={['#14532D', '#1A6B3C']}
      style={styles.totalCard}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.totalGlow} />
      <View style={styles.totalTop}>
        <View>
          <Text style={styles.totalKicker}>Estimated total</Text>
          <Text style={styles.totalAmount}>₹{amount.total}</Text>
        </View>
        {amount.coupon > 0 ? (
          <View style={styles.saveChip}>
            <Sparkles size={11} color={colors.lime} />
            <Text style={styles.saveChipText}>-₹{amount.coupon}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.totalMeta}>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Service + GST</Text>
          <Text style={styles.metaVal}>₹{amount.base + amount.gst}</Text>
        </View>
        <View style={styles.payPill}>
          <Text style={styles.payPillText}>{paymentLabel}</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

export function ConfirmTrustBanner({ message }: { message: string }) {
  return (
    <LinearGradient
      colors={['#E8F5EC', colors.white]}
      style={styles.trust}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <LinearGradient colors={[gradients.primary[0], gradients.primary[1]]} style={styles.trustIcon}>
        <ShieldCheck size={18} color={colors.white} strokeWidth={2.2} />
      </LinearGradient>
      <View style={styles.trustBody}>
        <Text style={styles.trustTitle}>You're almost done</Text>
        <Text style={styles.trustText}>{message}</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  list: {
    borderRadius: 16,
    backgroundColor: colors.bg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.06)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(20,83,45,0.07)',
  },
  rowIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(30,142,78,0.12)',
  },
  rowBody: { flex: 1, minWidth: 0, paddingTop: 2 },
  rowLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 10.5,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.45,
  },
  rowValue: {
    fontFamily: fonts.bodySemi,
    fontSize: 14.5,
    color: colors.ink,
    marginTop: 5,
    lineHeight: 21,
  },
  photoWrap: { gap: spacing.sm },
  photoRow: { gap: 10, paddingRight: 4 },
  photoTile: {
    width: 88,
    height: 88,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...premium.shadowSoft,
  },
  photoImg: { width: '100%', height: '100%' },
  photoBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(20,83,45,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoBadgeText: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.white },
  photoHint: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, paddingHorizontal: 2 },
  totalCard: {
    borderRadius: 18,
    padding: spacing.md,
    overflow: 'hidden',
    ...premium.shadowSoft,
  },
  totalGlow: {
    position: 'absolute',
    top: -24,
    right: -16,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(168,224,78,0.14)',
  },
  totalTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  totalKicker: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalAmount: {
    fontFamily: fonts.displayExtra,
    fontSize: 32,
    color: colors.lime,
    letterSpacing: -0.4,
    marginTop: 4,
  },
  saveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  saveChipText: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.lime },
  totalMeta: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
    gap: 10,
  },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaLabel: { fontFamily: fonts.body, fontSize: 12, color: 'rgba(255,255,255,0.65)' },
  metaVal: { fontFamily: fonts.bodySemi, fontSize: 12, color: 'rgba(255,255,255,0.9)' },
  payPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  payPillText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.lime },
  trust: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(30,142,78,0.18)',
  },
  trustIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustBody: { flex: 1, paddingTop: 2 },
  trustTitle: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.forest },
  trustText: { fontFamily: fonts.body, fontSize: 12.5, color: colors.muted, marginTop: 4, lineHeight: 18 },
});
