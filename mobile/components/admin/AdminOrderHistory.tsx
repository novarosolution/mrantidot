import { BellRing, History } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatINR } from '@/components/charts/chartFormat';
import { Card } from '@/components/ui/Card';
import { haptic } from '@/lib/motion';
import { formatTimeAgo } from '@/lib/time-ago';
import { userInitials } from '@/lib/userInitials';
import type { Booking } from '@/types/api';
import { colors, fonts, radii, spacing, ui } from '@/constants/theme';

const COLLAPSED = 3;

function fullTime(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

/**
 * Every admin edit of the order (newest first): who, when, total before → after, what changed and why.
 * Admins only — customers only see an "Booking updated" step in their timeline. Hidden until the first edit.
 */
export function AdminOrderHistory({ booking }: { booking: Booking }) {
  const [expanded, setExpanded] = useState(false);
  const history = [...(booking.orderHistory ?? [])].reverse();
  if (history.length === 0) return null;
  const shown = expanded ? history : history.slice(0, COLLAPSED);

  return (
    <Card variant="premium" style={styles.card}>
      <View style={styles.head}>
        <History size={16} color={colors.forest} strokeWidth={2.3} />
        <Text style={styles.title}>Order changes</Text>
        <Text style={styles.count}>{history.length}</Text>
      </View>
      {shown.map((h, i) => {
        const diff = h.totalAfter - h.totalBefore;
        return (
          <View key={h.id} style={styles.row}>
            <View style={styles.rail}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{userInitials(h.byName)}</Text>
              </View>
              {i < shown.length - 1 ? <View style={styles.line} /> : null}
            </View>
            <View style={styles.body}>
              <View style={styles.metaRow}>
                <Text style={styles.by} numberOfLines={1}>
                  {h.byName || 'Admin'}
                </Text>
                <Text style={styles.when} accessibilityLabel={fullTime(h.at)}>
                  {h.at ? formatTimeAgo(h.at) : ''}
                </Text>
              </View>
              {diff !== 0 ? (
                <View style={styles.totals}>
                  <Text style={styles.totalText}>
                    {formatINR(h.totalBefore)} → <Text style={styles.totalStrong}>{formatINR(h.totalAfter)}</Text>
                  </Text>
                  <View style={[styles.diff, diff > 0 ? styles.diffUp : styles.diffDown]}>
                    <Text style={[styles.diffText, diff > 0 ? styles.diffTextUp : styles.diffTextDown]}>
                      {`${diff > 0 ? '+' : '−'}${formatINR(Math.abs(diff))}`}
                    </Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.sameTotal}>{`Total unchanged · ${formatINR(h.totalAfter)}`}</Text>
              )}
              {h.changes.map((c, ci) => (
                <Text key={`${h.id}-${ci}`} style={styles.change} selectable>
                  • {c}
                </Text>
              ))}
              {h.note ? (
                <Text style={styles.note} selectable>
                  “{h.note}”
                </Text>
              ) : null}
              {h.notified ? (
                <View style={styles.notified}>
                  <BellRing size={11} color={colors.secondaryDark} strokeWidth={2.4} />
                  <Text style={styles.notifiedText}>Customer notified</Text>
                </View>
              ) : null}
            </View>
          </View>
        );
      })}
      {history.length > COLLAPSED ? (
        <Pressable
          onPress={() => {
            haptic('select');
            setExpanded((e) => !e);
          }}
          hitSlop={8}
          style={({ pressed }) => [styles.more, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityState={{ expanded }}
        >
          <Text style={styles.moreText}>{expanded ? 'Show less' : `Show all ${history.length} changes`}</Text>
        </Pressable>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: spacing.md, padding: spacing.md },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.sm },
  title: { flex: 1, fontFamily: fonts.display, fontSize: 14, color: colors.ink },
  count: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    color: ui.textSecondary,
    backgroundColor: colors.greyBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', gap: 10 },
  rail: { alignItems: 'center', width: 30 },
  avatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.forest },
  line: { flex: 1, width: 2, marginVertical: 4, borderRadius: 1, backgroundColor: colors.greyBg },
  body: { flex: 1, minWidth: 0, paddingBottom: spacing.md, gap: 3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 30 },
  by: { flexShrink: 1, fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ink },
  when: { flex: 1, fontFamily: fonts.body, fontSize: 12, color: ui.textTertiary },
  totals: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  totalText: { fontFamily: fonts.body, fontSize: 13, color: ui.textSecondary },
  totalStrong: { fontFamily: fonts.bodyBold, color: ui.text },
  sameTotal: { fontFamily: fonts.body, fontSize: 12.5, color: ui.textSecondary },
  diff: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radii.pill },
  diffUp: { backgroundColor: colors.amberBg },
  diffDown: { backgroundColor: colors.blueBg },
  diffText: { fontFamily: fonts.bodySemi, fontSize: 11.5 },
  diffTextUp: { color: colors.amberInk },
  diffTextDown: { color: colors.blue },
  change: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: colors.ink },
  note: { fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, color: ui.textSecondary, fontStyle: 'italic', marginTop: 2 },
  notified: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  notifiedText: { fontFamily: fonts.bodySemi, fontSize: 11.5, color: colors.secondaryDark },
  more: { alignSelf: 'flex-start', paddingVertical: 4 },
  moreText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.forest },
  pressed: { opacity: 0.6 },
});
