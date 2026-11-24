import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { colors, fonts, ui } from '@/constants/theme';
import { useChartProgress } from './useChartProgress';

export type BarItem = {
  key: string;
  label: string;
  value: number;
  /** Shown at the row end (e.g. "₹12,400"). */
  valueLabel: string;
  sublabel?: string;
  color?: string;
};

const BAR_H = 8;

function BarTrack({ fraction, color, highlighted }: { fraction: number; color: string; highlighted: boolean }) {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(Math.round(e.nativeEvent.layout.width));
  const fill = width * Math.max(0, Math.min(1, fraction));
  return (
    <View style={styles.track} onLayout={onLayout}>
      {width > 0 ? (
        <Svg width={width} height={BAR_H}>
          <Rect x={0} y={0} width={width} height={BAR_H} rx={BAR_H / 2} fill={ui.hairline} />
          {fill > 0 ? (
            <Rect
              x={0}
              y={0}
              width={Math.max(BAR_H, fill)}
              height={BAR_H}
              rx={BAR_H / 2}
              fill={color}
              fillOpacity={highlighted ? 1 : 0.88}
            />
          ) : null}
        </Svg>
      ) : null}
    </View>
  );
}

/**
 * Ranked horizontal bars (react-native-svg) — top services by revenue, etc. Bars grow in on entrance
 * (instant with Reduce Motion); rows highlight on hover and open `onItemPress` when given.
 */
export function HorizontalBars({
  items,
  color = colors.green,
  onItemPress,
  trigger,
  emptyLabel = 'Nothing to rank in this range',
}: {
  items: BarItem[];
  color?: string;
  onItemPress?: (key: string) => void;
  trigger?: unknown;
  emptyLabel?: string;
}) {
  const progress = useChartProgress(trigger ?? items.map((i) => i.value).join(','));
  const [hover, setHover] = useState<string | null>(null);
  const max = items.reduce((m, i) => Math.max(m, i.value), 0);

  if (items.length === 0) {
    return <Text style={styles.empty}>{emptyLabel}</Text>;
  }

  return (
    <View style={styles.list}>
      {items.map((item, index) => (
        <Pressable
          key={item.key}
          disabled={!onItemPress}
          onPress={onItemPress ? () => onItemPress(item.key) : undefined}
          onHoverIn={() => setHover(item.key)}
          onHoverOut={() => setHover((cur) => (cur === item.key ? null : cur))}
          style={({ pressed }) => [styles.row, hover === item.key && styles.rowHover, pressed && styles.pressed]}
          accessibilityRole={onItemPress ? 'button' : 'text'}
          accessibilityLabel={`${index + 1}. ${item.label}${item.sublabel ? `, ${item.sublabel}` : ''}: ${item.valueLabel}`}
        >
          <View style={styles.head}>
            <Text style={styles.rank}>{index + 1}</Text>
            <View style={styles.titleCol}>
              <Text style={styles.label} numberOfLines={1}>
                {item.label}
              </Text>
              {item.sublabel ? (
                <Text style={styles.sub} numberOfLines={1}>
                  {item.sublabel}
                </Text>
              ) : null}
            </View>
            <Text style={styles.value}>{item.valueLabel}</Text>
          </View>
          <BarTrack
            fraction={max > 0 ? (item.value / max) * progress : 0}
            color={item.color ?? color}
            highlighted={hover === item.key}
          />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 4 },
  row: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 12, gap: 8 },
  rowHover: { backgroundColor: ui.surfaceMuted },
  pressed: { opacity: 0.85 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rank: {
    width: 22,
    height: 22,
    borderRadius: 11,
    overflow: 'hidden',
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.forest,
    backgroundColor: ui.brandSoft,
  },
  titleCol: { flex: 1, minWidth: 0 },
  label: { fontFamily: fonts.bodySemi, fontSize: 13.5, color: ui.text },
  sub: { fontFamily: fonts.body, fontSize: 12, color: ui.textSecondary, marginTop: 1 },
  value: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: ui.text },
  track: { height: BAR_H, marginLeft: 32 },
  empty: { fontFamily: fonts.bodyMedium, fontSize: 13, color: ui.textTertiary, paddingVertical: 12, textAlign: 'center' },
});
