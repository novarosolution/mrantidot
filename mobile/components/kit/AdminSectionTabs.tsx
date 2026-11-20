import type { LucideIcon } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { haptic } from '@/lib/motion';
import { colors, fonts, spacing, ui } from '@/constants/theme';

export type AdminSectionTab = {
  key: string;
  label: string;
  icon: LucideIcon;
};

/** Scrollable section pills — outlined when idle, solid ink when selected (matches filter chips). */
export function AdminSectionTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: AdminSectionTab[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <View style={styles.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const selected = tab.key === active;
          return (
            <Pressable
              key={tab.key}
              style={({ pressed }) => [styles.tab, selected && styles.tabOn, pressed && styles.pressed]}
              onPress={() => {
                if (!selected) haptic('select');
                onChange(tab.key);
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
            >
              <Icon size={15} color={selected ? colors.white : ui.brand} strokeWidth={2.2} />
              <Text style={[styles.label, selected && styles.labelOn]} numberOfLines={1}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ui.border,
  },
  row: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.border,
  },
  tabOn: {
    backgroundColor: ui.text,
    borderColor: ui.text,
  },
  pressed: { opacity: 0.85 },
  label: { fontFamily: fonts.bodySemi, fontSize: 13, color: ui.text },
  labelOn: { color: colors.white },
});
