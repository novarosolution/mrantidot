import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { WebsitePhoto } from '@/components/kit/ImageField';
import { ReorderButtons } from '@/components/kit/ReorderButtons';
import { PressableScale } from '@/components/ui/PressableScale';
import { adminType, colors, fonts, spacing, ui } from '@/constants/theme';

export type WebsiteBadgeTone = 'live' | 'off' | 'draft' | 'new';

const BADGE: Record<WebsiteBadgeTone, { bg: string; fg: string }> = {
  live: { bg: ui.brandSoft, fg: ui.brand },
  off: { bg: ui.surfaceMuted, fg: ui.textTertiary },
  draft: { bg: colors.amberBg, fg: colors.amberInk },
  new: { bg: colors.errorBg, fg: colors.error },
};

export function WebsiteBadge({ label, tone }: { label: string; tone: WebsiteBadgeTone }) {
  const c = BADGE[tone];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/** Website list row — photo, title, subtitle, status badge; reorder mode swaps the chevron for ↑ ↓. */
export const WebsiteListCard = memo(function WebsiteListCard({
  photoUrl,
  photoShape = 'square',
  title,
  subtitle,
  meta,
  badge,
  dimmed = false,
  onPress,
  reorder,
}: {
  photoUrl?: string;
  photoShape?: 'square' | 'round' | 'wide';
  title: string;
  subtitle?: string;
  meta?: string;
  badge?: { label: string; tone: WebsiteBadgeTone };
  dimmed?: boolean;
  onPress: () => void;
  reorder?: { index: number; count: number; onMove: (from: number, to: number) => void };
}) {
  return (
    <PressableScale
      style={[styles.card, dimmed && styles.dimmed]}
      containerStyle={styles.cardWrap}
      scaleTo={0.98}
      onPress={onPress}
      disabled={Boolean(reorder)}
      accessibilityRole="button"
      accessibilityLabel={`${title}${badge ? `, ${badge.label}` : ''}`}
    >
      <WebsitePhoto
        url={photoUrl}
        compact
        style={[styles.photo, photoShape === 'round' && styles.round, photoShape === 'wide' && styles.wide]}
      />
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
        {badge || meta ? (
          <View style={styles.metaRow}>
            {badge ? <WebsiteBadge label={badge.label} tone={badge.tone} /> : null}
            {meta ? (
              <Text style={styles.meta} numberOfLines={1}>
                {meta}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
      {reorder ? (
        <ReorderButtons index={reorder.index} count={reorder.count} onMove={reorder.onMove} label={title} />
      ) : (
        <ChevronRight size={18} color={ui.textTertiary} strokeWidth={2.2} />
      )}
    </PressableScale>
  );
});

const styles = StyleSheet.create({
  cardWrap: { marginBottom: spacing.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    ...ui.shadow,
  },
  dimmed: { opacity: 0.72 },
  photo: { width: 56, height: 56, borderRadius: 14 },
  round: { borderRadius: 28 },
  wide: { width: 76, height: 56 },
  body: { flex: 1, minWidth: 0, gap: 3 },
  title: { ...adminType.listTitle, fontSize: 14.5, color: ui.text },
  subtitle: { fontFamily: fonts.body, fontSize: 12.5, lineHeight: 17, color: ui.textSecondary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 },
  meta: { flexShrink: 1, fontFamily: fonts.bodyMedium, fontSize: 11.5, color: ui.textTertiary },
  badge: { paddingHorizontal: 8, height: 20, borderRadius: 10, justifyContent: 'center' },
  badgeText: { fontFamily: fonts.bodyBold, fontSize: 10.5, letterSpacing: 0.3 },
});
