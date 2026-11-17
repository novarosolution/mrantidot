import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, spacing, ui } from '@/constants/theme';

export type SegmentedTab<K extends string> = { key: K; label: string; count?: number };

/** Premium segmented filter — full-width capsule, brand-filled selection, optional count badges. */
export function SegmentedTabs<K extends string>({
  tabs,
  selected,
  onSelect,
}: {
  tabs: SegmentedTab<K>[];
  selected: K;
  onSelect: (key: K) => void;
}) {
  return (
    <View style={styles.shell} accessibilityRole="tablist">
      {tabs.map((tab) => {
        const on = selected === tab.key;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onSelect(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={tab.count != null ? `${tab.label}, ${tab.count}` : tab.label}
            style={({ pressed }) => [styles.seg, on && styles.segOn, pressed && styles.pressed]}
          >
            <Text style={[styles.label, on && styles.labelOn]} numberOfLines={1}>
              {tab.label}
            </Text>
            {tab.count != null ? (
              <View style={[styles.count, on && styles.countOn]}>
                <Text style={[styles.countText, on && styles.countTextOn]}>{tab.count}</Text>
              </View>
            ) : null}
          </Pressable>
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
    padding: 4,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    ...ui.shadow,
  },
  seg: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: 12,
    paddingHorizontal: 6,
  },
  segOn: { backgroundColor: ui.brand },
  pressed: { opacity: 0.88 },
  label: {
    fontFamily: fonts.bodySemi,
    fontSize: 12.5,
    color: ui.textSecondary,
  },
  labelOn: { color: colors.white },
  count: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ui.surfaceMuted,
  },
  countOn: { backgroundColor: 'rgba(255,255,255,0.22)' },
  countText: { fontFamily: fonts.bodyBold, fontSize: 11, color: ui.text },
  countTextOn: { color: colors.white },
});
