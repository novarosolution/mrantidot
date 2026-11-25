import { useId, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';
import { colors, fonts, ui } from '@/constants/theme';
import { formatINR, formatINRCompact, niceScale } from './chartFormat';
import { useChartProgress } from './useChartProgress';

export type AreaPoint = { key: string; label: string; value: number };

const AXIS_W = 46;
const TOP = 14;
const BOTTOM = 24;
const RIGHT = 10;
const TIP_W = 176;

/** Smooth line through the points that never overshoots between them (horizontal tangents). */
function linePath(xs: number[], ys: number[]): string {
  if (xs.length === 0) return '';
  let d = `M${xs[0]},${ys[0]}`;
  for (let i = 1; i < xs.length; i += 1) {
    const mx = (xs[i - 1] + xs[i]) / 2;
    d += ` C${mx},${ys[i - 1]} ${mx},${ys[i]} ${xs[i]},${ys[i]}`;
  }
  return d;
}

/** Which x positions get a label so they never collide (first and last always). */
function labelIndices(n: number, plotW: number): number[] {
  if (n <= 0) return [];
  if (n === 1) return [0];
  const fit = Math.max(2, Math.floor(plotW / 58));
  const step = Math.max(1, Math.ceil(n / fit));
  const out: number[] = [];
  for (let i = 0; i < n; i += step) out.push(i);
  const last = n - 1;
  if (out[out.length - 1] !== last) {
    if (last - out[out.length - 1] < step / 2 && out.length > 1) out[out.length - 1] = last;
    else out.push(last);
  }
  return out;
}

/**
 * Area + line chart (react-native-svg) — revenue per day / month. Grows up from the baseline on entrance
 * (instant with Reduce Motion), hover (web) or tap (phones) a point for its tooltip, ₹ axis in Indian units.
 */
export function RevenueAreaChart({
  points,
  height = 196,
  color = colors.green,
  formatAxis = formatINRCompact,
  formatValue = formatINR,
  tooltip,
  trigger,
  integer = false,
  emptyLabel = 'Nothing in this range yet',
  accessibilityLabel,
}: {
  points: AreaPoint[];
  height?: number;
  color?: string;
  formatAxis?: (n: number) => string;
  formatValue?: (n: number) => string;
  /** Tooltip for a point (default: label + value). */
  tooltip?: (index: number) => { title: string; lines: string[] };
  /** Replays the entrance when it changes (e.g. the selected range). */
  trigger?: unknown;
  integer?: boolean;
  emptyLabel?: string;
  accessibilityLabel?: string;
}) {
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);
  const progress = useChartProgress(trigger ?? points.length);
  const gradientId = `area${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  const n = points.length;
  const plotW = Math.max(0, width - AXIS_W - RIGHT);
  const plotH = Math.max(0, height - TOP - BOTTOM);
  const maxVal = points.reduce((m, p) => Math.max(m, p.value), 0);
  const scale = niceScale(maxVal, 4, integer);
  const base = TOP + plotH;

  const geometry = useMemo(() => {
    const xs = points.map((_, i) => AXIS_W + (n <= 1 ? plotW / 2 : (i * plotW) / (n - 1)));
    const ys = points.map((p) => base - (p.value / scale.max) * plotH * progress);
    const line = linePath(xs, ys);
    const area = xs.length > 1 ? `${line} L${xs[xs.length - 1]},${base} L${xs[0]},${base} Z` : '';
    return { xs, ys, line, area };
  }, [points, n, plotW, plotH, base, scale.max, progress]);

  const ticks = useMemo(
    () => Array.from({ length: 5 }, (_, i) => ({ value: scale.step * i, y: base - ((scale.step * i) / scale.max) * plotH })),
    [scale.step, scale.max, base, plotH],
  );
  const labels = useMemo(() => labelIndices(n, plotW), [n, plotW]);
  const slotW = n <= 1 ? plotW : plotW / (n - 1);

  const onLayout = (e: LayoutChangeEvent) => setWidth(Math.round(e.nativeEvent.layout.width));

  const tip =
    active !== null && points[active]
      ? (tooltip?.(active) ?? { title: points[active].label, lines: [formatValue(points[active].value)] })
      : null;
  const tipLeft =
    active !== null ? Math.min(Math.max(geometry.xs[active] - TIP_W / 2, AXIS_W), Math.max(AXIS_W, width - TIP_W)) : 0;
  const total = points.reduce((s, p) => s + p.value, 0);
  const peak = points.reduce((best, p, i) => (p.value > (points[best]?.value ?? -1) ? i : best), 0);

  return (
    <View
      style={[styles.root, { height }]}
      onLayout={onLayout}
      accessible
      accessibilityRole="image"
      accessibilityLabel={
        accessibilityLabel ??
        (maxVal > 0
          ? `Chart: total ${formatValue(total)}, highest ${formatValue(points[peak].value)} on ${points[peak].label}`
          : emptyLabel)
      }
    >
      {width > 0 ? (
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity={0.26} />
              <Stop offset="1" stopColor={color} stopOpacity={0.02} />
            </LinearGradient>
          </Defs>
          {ticks.map((t, i) => (
            <Line
              key={`g${i}`}
              x1={AXIS_W}
              x2={width - RIGHT}
              y1={t.y}
              y2={t.y}
              stroke={i === 0 ? ui.border : ui.hairline}
              strokeWidth={1}
              strokeDasharray={i === 0 ? undefined : '3 5'}
            />
          ))}
          {ticks.map((t, i) => (
            <SvgText
              key={`y${i}`}
              x={AXIS_W - 8}
              y={t.y + 3.5}
              fontSize={10}
              fill={ui.textTertiary}
              textAnchor="end"
              fontFamily={fonts.bodyMedium}
            >
              {formatAxis(t.value)}
            </SvgText>
          ))}
          {labels.map((i) => (
            <SvgText
              key={`x${i}`}
              x={geometry.xs[i]}
              y={height - 6}
              fontSize={10}
              fill={ui.textTertiary}
              textAnchor={n > 1 && i === 0 ? 'start' : n > 1 && i === n - 1 ? 'end' : 'middle'}
              fontFamily={fonts.bodyMedium}
            >
              {points[i].label}
            </SvgText>
          ))}
          {geometry.area ? <Path d={geometry.area} fill={`url(#${gradientId})`} /> : null}
          {n > 1 ? (
            <Path d={geometry.line} stroke={color} strokeWidth={2.4} fill="none" strokeLinejoin="round" strokeLinecap="round" />
          ) : null}
          {n <= 14
            ? geometry.xs.map((cx, i) => (
                <Circle
                  key={`d${i}`}
                  cx={cx}
                  cy={geometry.ys[i]}
                  r={n === 1 ? 5 : 3}
                  fill={colors.white}
                  stroke={color}
                  strokeWidth={2}
                />
              ))
            : null}
          {active !== null && geometry.xs[active] !== undefined ? (
            <>
              <Line
                x1={geometry.xs[active]}
                x2={geometry.xs[active]}
                y1={TOP}
                y2={base}
                stroke={color}
                strokeOpacity={0.35}
                strokeWidth={1}
              />
              <Circle cx={geometry.xs[active]} cy={geometry.ys[active]} r={5} fill={color} stroke={colors.white} strokeWidth={2} />
            </>
          ) : null}
        </Svg>
      ) : null}

      {maxVal === 0 && width > 0 ? (
        <View style={[styles.empty, { top: TOP, height: plotH, left: AXIS_W, right: RIGHT }]} pointerEvents="none">
          <Text style={styles.emptyText}>{emptyLabel}</Text>
        </View>
      ) : null}

      {width > 0 && n > 0 ? (
        <Pressable
          style={[styles.hitLayer, { left: AXIS_W, top: TOP, width: plotW, height: plotH }]}
          onHoverOut={() => setActive(null)}
          accessible={false}
          focusable={false}
        >
          {points.map((p, i) => {
            const cx = (geometry.xs[i] ?? AXIS_W) - AXIS_W;
            const left = Math.max(0, cx - slotW / 2);
            const right = Math.min(plotW, cx + slotW / 2);
            return (
              <Pressable
                key={p.key}
                style={[styles.hit, { left, width: Math.max(1, right - left) }]}
                onHoverIn={() => setActive(i)}
                onPressIn={() => setActive(i)}
                accessible={false}
                focusable={false}
              />
            );
          })}
        </Pressable>
      ) : null}

      {tip ? (
        <View style={[styles.tip, { left: tipLeft, width: TIP_W }]} pointerEvents="none">
          <Text style={styles.tipTitle} numberOfLines={1}>
            {tip.title}
          </Text>
          {tip.lines.map((line) => (
            <Text key={line} style={styles.tipLine} numberOfLines={1}>
              {line}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { width: '100%', position: 'relative' },
  hitLayer: { position: 'absolute' },
  hit: { position: 'absolute', top: 0, bottom: 0 },
  empty: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontFamily: fonts.bodyMedium, fontSize: 12.5, color: ui.textTertiary },
  tip: {
    position: 'absolute',
    top: 0,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: ui.text,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 6,
  },
  tipTitle: { fontFamily: fonts.bodySemi, fontSize: 11.5, color: 'rgba(255,255,255,0.72)' },
  tipLine: { fontFamily: fonts.bodySemi, fontSize: 12.5, lineHeight: 17, color: colors.white, marginTop: 2 },
});
