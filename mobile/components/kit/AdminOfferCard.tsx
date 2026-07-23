import { LinearGradient } from 'expo-linear-gradient';
import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { GlassPanel } from '@/components/kit/GlassScreenKit';
import { AppIcons } from '@/constants/appIcons';
import { ToggleSwitch } from '@/components/kit/ToggleSwitch';
import type { Offer } from '@/types/api';
import { adminType, colors, customerType, spacing, surfaces } from '@/constants/theme';

function formatExpiry(iso?: string) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return null;
  }
}

export const AdminOfferCard = memo(function AdminOfferCard({
  offer,
  onPress,
  onEdit,
  onToggle,
}: {
  offer: Offer;
  onPress: () => void;
  onEdit: () => void;
  onToggle: () => void;
}) {
  const inactive = !offer.active;
  const expired = offer.expiresAt ? new Date(offer.expiresAt) < new Date() : false;
  const maxed = offer.maxUses != null && offer.useCount != null && offer.useCount >= offer.maxUses;
  const discountLabel =
    offer.discountType === 'percent' ? `${offer.discount}% off` : `₹${offer.discount} off`;
  const expiryLabel = formatExpiry(offer.expiresAt);
  const usesLabel =
    offer.maxUses != null
      ? `${offer.useCount ?? 0}/${offer.maxUses} uses`
      : offer.useCount != null
        ? `${offer.useCount} uses`
        : null;

  const statusChips = useMemo(() => {
    const chips: { key: string; label: string; tone: 'ok' | 'warn' | 'off' }[] = [];
    if (inactive) chips.push({ key: 'off', label: 'Inactive', tone: 'off' });
    else chips.push({ key: 'on', label: 'Active', tone: 'ok' });
    if (expired) chips.push({ key: 'exp', label: 'Expired', tone: 'warn' });
    if (maxed) chips.push({ key: 'max', label: 'Maxed out', tone: 'warn' });
    return chips;
  }, [inactive, expired, maxed]);

  return (
    <GlassPanel style={[styles.shell, inactive && styles.inactive]} padded={false} tone="light" goldEdge intensity={38}>
      <View style={styles.row}>
        <Pressable style={styles.main} onPress={onPress}>
          <LinearGradient
            colors={inactive ? ['rgba(232,238,230,0.9)', 'rgba(221,230,216,0.82)'] : ['rgba(238,248,230,0.92)', 'rgba(216,237,200,0.78)']}
            style={styles.icon}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {offer.discountType === 'percent' ? (
              <PremiumIcon
                icon={AppIcons.ui.percent}
                variant="plain"
                size="md"
                color={inactive ? colors.muted : colors.forest}
                strokeWidth={2.2}
              />
            ) : (
              <PremiumIcon
                icon={AppIcons.ui.tag}
                variant="plain"
                size="md"
                color={inactive ? colors.muted : colors.forest}
                strokeWidth={2.2}
              />
            )}
          </LinearGradient>

          <View style={styles.body}>
            <View style={styles.codeRow}>
              <Text style={styles.code} numberOfLines={1}>
                {offer.code}
              </Text>
              <View style={styles.discountPill}>
                <Text style={styles.discount}>{discountLabel}</Text>
              </View>
            </View>

            {offer.description ? (
              <Text style={styles.desc} numberOfLines={2}>
                {offer.description}
              </Text>
            ) : null}

            <View style={styles.metaRow}>
              {statusChips.map((c) => (
                <View
                  key={c.key}
                  style={[
                    styles.chip,
                    c.tone === 'ok' && styles.chipOk,
                    c.tone === 'warn' && styles.chipWarn,
                    c.tone === 'off' && styles.chipOff,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      c.tone === 'ok' && styles.chipTextOk,
                      c.tone === 'warn' && styles.chipTextWarn,
                      c.tone === 'off' && styles.chipTextOff,
                    ]}
                  >
                    {c.label}
                  </Text>
                </View>
              ))}
              {expiryLabel ? (
                <Text style={styles.meta} numberOfLines={1}>
                  Exp {expiryLabel}
                </Text>
              ) : null}
              {usesLabel ? (
                <Text style={styles.meta} numberOfLines={1}>
                  {usesLabel}
                </Text>
              ) : null}
              {offer.minOrderAmount != null ? (
                <Text style={styles.meta} numberOfLines={1}>
                  Min ₹{offer.minOrderAmount}
                </Text>
              ) : null}
            </View>
          </View>
        </Pressable>

        <View style={styles.actions}>
          <ToggleSwitch value={offer.active} onToggle={onToggle} />
          <Pressable style={styles.editBtn} onPress={onEdit} hitSlop={8} accessibilityLabel="Edit offer">
            <PremiumIcon icon={AppIcons.ui.edit} variant="plain" size="sm" color={colors.forest} strokeWidth={2.2} />
          </Pressable>
        </View>
      </View>
    </GlassPanel>
  );
});

const styles = StyleSheet.create({
  shell: { marginBottom: spacing.sm, borderRadius: 20 },
  inactive: { opacity: 0.76 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    paddingTop: spacing.sm + 10,
  },
  main: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  icon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
  },
  body: { flex: 1, minWidth: 0 },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  code: {
    ...adminType.formTitle,
    fontSize: 17,
    letterSpacing: 0.45,
    flexShrink: 1,
  },
  discountPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(238,248,230,0.72)',
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
  },
  discount: {
    ...adminType.chipText,
    fontSize: 11,
  },
  desc: {
    ...adminType.sectionHint,
    marginTop: 5,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipOk: { backgroundColor: 'rgba(238,248,230,0.72)', borderColor: surfaces.glassBorderStrong },
  chipWarn: { backgroundColor: 'rgba(255,244,236,0.78)', borderColor: 'rgba(240,208,200,0.65)' },
  chipOff: { backgroundColor: 'rgba(243,244,242,0.72)', borderColor: 'rgba(226,230,224,0.85)' },
  chipText: { ...customerType.pillLabel },
  chipTextOk: { color: colors.forest },
  chipTextWarn: { color: '#9E3F1C' },
  chipTextOff: { color: colors.muted },
  meta: { ...adminType.listMeta },
  actions: { alignItems: 'flex-end', gap: 10, marginLeft: 8 },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(238,248,230,0.65)',
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
