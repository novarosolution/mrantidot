import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { fonts, ui } from '@/constants/theme';
import { formatIndianNumber, percentOf } from './chartFormat';
import { useChartProgress } from './useChartProgress';

export type DonutSegment = { key: string; label: string; value: number; color: string };

/**
 * Donut (react-native-svg) with a legend — bookings by status. The arcs sweep in on entrance (instant with
 * Reduce Motion); hovering (web) or pressing a legend row highlights its arc and shows it in the centre, and
 * `onSegmentPress` makes the rows open something (e.g. the bookings list filtered to that status).
 */
export function StatusDonut({
  segments,
  size = 156,
  thickness = 18,
  centerLabel = 'Total',
  trigger,
  onSegmentPress,
  emptyLabel = 'No bookings in this range',
}: {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  trigger?: unknown;
  onSegmentPress?: (key: string) => void;
  emptyLabel?: string;
}) {
  const [active, setActive] = useState<string | null>(null);
  const [width, setWidth] = useState(0);
  const progress = useChartProgress(trigger ?? segments.map((s) => s.value).join(','));

  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const mid = size / 2;
  const r = (size - thickness) / 2 - 3;
  const circumference = 2 * Math.PI * r;
  const visible = segments.filter((s) => s.value > 0);
  const gap = visible.length > 1 ? 2.5 : 0;

  let offset = 0;
  const arcs = visible.map((s) => {
    const full = (s.value / total) * circumference * progress;
    const arc = { ...s, len: Math.max(0, full - gap), offset };
    offset += full;
    return arc;
  });
  const activeSeg = active ? segments.find((s) => s.key === active) : undefined;
  const row = width >= 360;

  const onLayout = (e: LayoutChangeEvent) => setWidth(Math.round(e.nativeEvent.layout.width));

  return (
    <View style={[styles.root, row && styles.rootRow]} onLayout={onLayout}>
      <View
        style={{ width: size, height: size }}
        accessible
        accessibilityRole="image"
        accessibilityLabel={
          total > 0
            ? `${centerLabel} ${total}: ${visible.map((s) => `${s.label} ${s.value}`).join(', ')}`
            : emptyLabel
        }
      >
        <Svg width={size} height={size}>
          <G transform={`rotate(-90 ${mid} ${mid})`}>
            <Circle cx={mid} cy={mid} r={r} stroke={ui.hairline} strokeWidth={thickness} fill="none" />
            {arcs.map((a) => (
              <Circle
                key={a.key}
                cx={mid}
                cy={mid}
                r={r}
                stroke={a.color}
                strokeWidth={a.key === active ? thickness + 5 : thickness}
                strokeOpacity={active && a.key !== active ? 0.4 : 1}
                fill="none"
                strokeDasharray={`${a.len} ${circumference}`}
                strokeDashoffset={-a.offset}
              />
            ))}
          </G>
        </Svg>
        <View style={[StyleSheet.absoluteFill, styles.center]} pointerEvents="none">
          <Text style={styles.centerValue} numberOfLines={1}>
            {formatIndianNumber(activeSeg ? activeSeg.value : total)}
          </Text>
          <Text style={styles.centerLabel} numberOfLines={1}>
            {activeSeg ? activeSeg.label : total > 0 ? centerLabel : 'None yet'}
          </Text>
          {activeSeg ? <Text style={styles.centerPct}>{percentOf(activeSeg.value, total)}</Text> : null}
        </View>
      </View>

      <View style={[styles.legend, row && styles.legendRow]}>
        {segments.map((s) => (
          <Pressable
            key={s.key}
            onHoverIn={() => setActive(s.key)}
            onHoverOut={() => setActive((cur) => (cur === s.key ? null : cur))}
            onPressIn={() => setActive(s.key)}
            onPressOut={() => setActive((cur) => (cur === s.key ? null : cur))}
            onPress={onSegmentPress ? () => onSegmentPress(s.key) : undefined}
            disabled={!onSegmentPress}
            style={({ pressed }) => [styles.item, active === s.key && styles.itemActive, pressed && styles.pressed]}
            accessibilityRole={onSegmentPress ? 'button' : 'text'}
            accessibilityLabel={`${s.label}: ${s.value}, ${percentOf(s.value, total)}`}
          >
            <View style={[styles.dot, { backgroundColor: s.color }]} />
            <Text style={styles.itemLabel} numberOfLines={1}>
              {s.label}
            </Text>
            <Text style={styles.itemValue}>{formatIndianNumber(s.value)}</Text>
            <Text style={styles.itemPct}>{percentOf(s.value, total)}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', gap: 14 },
  rootRow: { flexDirection: 'row', alignItems: 'center', gap: 22 },
  center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 },
  centerValue: { fontFamily: fonts.display, fontSize: 24, lineHeight: 29, letterSpacing: -0.6, color: ui.text },
  centerLabel: { fontFamily: fonts.bodyMedium, fontSize: 11.5, color: ui.textSecondary, marginTop: 1 },
  centerPct: { fontFamily: fonts.bodySemi, fontSize: 11, color: ui.textTertiary, marginTop: 1 },
  legend: { alignSelf: 'stretch', gap: 2 },
  legendRow: { flex: 1, minWidth: 0 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  itemActive: { backgroundColor: ui.surfaceMuted },
  pressed: { opacity: 0.8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  itemLabel: { flex: 1, minWidth: 0, fontFamily: fonts.bodyMedium, fontSize: 13, color: ui.text },
  itemValue: { fontFamily: fonts.bodySemi, fontSize: 13, color: ui.text, minWidth: 28, textAlign: 'right' },
  itemPct: { fontFamily: fonts.bodyMedium, fontSize: 12, color: ui.textTertiary, width: 38, textAlign: 'right' },
});

