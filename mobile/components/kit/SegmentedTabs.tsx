import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { PressableScale } from '@/components/ui/PressableScale';
import { colors, radii, spacing, typeScale, ui } from '@/constants/theme';
import { getReducedMotion } from '@/lib/a11yPrefs';
import { haptic, motion } from '@/lib/motion';

export type SegmentedTab<K extends string> = { key: K; label: string; count?: number };

const PAD = 4;

/**
 * Segmented filter — full-width capsule with a brand pill that slides to the selected tab
 * (native-driven spring; instant with Reduce Motion), optional count badges, selection haptic.
 */
export function SegmentedTabs<K extends string>({
  tabs,
  selected,
  onSelect,
}: {
  tabs: SegmentedTab<K>[];
  selected: K;
  onSelect: (key: K) => void;
}) {
  const [width, setWidth] = useState(0);
  const index = Math.max(0, tabs.findIndex((t) => t.key === selected));
  const segW = width > 0 && tabs.length > 0 ? (width - PAD * 2) / tabs.length : 0;
  const x = useRef(new Animated.Value(0)).current;
  const placed = useRef(false);

  useEffect(() => {
    if (!segW) return;
    const to = index * segW;
    if (!placed.current || getReducedMotion()) {
      placed.current = true;
      x.setValue(to);
      return;
    }
    Animated.spring(x, { toValue: to, ...motion.springSnappy, useNativeDriver: true }).start();
  }, [index, segW, x]);

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  return (
    <View style={styles.shell} accessibilityRole="tablist" onLayout={onLayout}>
      {segW > 0 ? (
        <Animated.View pointerEvents="none" style={[styles.indicator, { width: segW, transform: [{ translateX: x }] }]} />
      ) : null}
      {tabs.map((tab, i) => {
        const on = i === index;
        return (
          <PressableScale
            key={tab.key}
            onPress={() => {
              if (on) return;
              haptic('select');
              onSelect(tab.key);
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={tab.count != null ? `${tab.label}, ${tab.count}` : tab.label}
            containerStyle={styles.segWrap}
            style={[styles.seg, on && segW === 0 && styles.segOnFallback]}
          >
            <Text style={[styles.label, on && styles.labelOn]} numberOfLines={1}>
              {tab.label}
            </Text>
            {tab.count != null ? (
              <View style={[styles.count, on && styles.countOn]}>
                <Text style={[styles.countText, on && styles.countTextOn]}>{tab.count}</Text>
              </View>
            ) : null}
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: PAD,
    borderRadius: radii.control,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    ...ui.shadow,
  },
  indicator: {
    position: 'absolute',
    top: PAD,
    bottom: PAD,
    left: PAD,
    borderRadius: radii.control - PAD,
    backgroundColor: ui.brand,
  },
  segWrap: { flex: 1 },
  seg: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: radii.control - PAD,
    paddingHorizontal: 6,
  },
  /** Before the first layout pass there is no indicator yet — fill the tab itself. */
  segOnFallback: { backgroundColor: ui.brand },
  label: { ...typeScale.captionStrong, color: ui.textSecondary },
  labelOn: { color: colors.white },
  count: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ui.surfaceMuted,
  },
  countOn: { backgroundColor: 'rgba(255,255,255,0.22)' },
  countText: { ...typeScale.micro, fontFamily: typeScale.button.fontFamily, color: ui.text },
  countTextOn: { color: colors.white },
});
