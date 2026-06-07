import { LucideIcon } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, premium, spacing } from '@/constants/theme';

export type AdminSectionTab = {
  key: string;
  label: string;
  icon: LucideIcon;
};

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
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const selected = tab.key === active;
          return (
            <Pressable
              key={tab.key}
              style={({ pressed }) => [styles.tab, selected && styles.tabOn, pressed && styles.pressed]}
              onPress={() => onChange(tab.key)}
            >
              <Icon size={14} color={selected ? colors.forest : colors.muted} strokeWidth={2.2} />
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
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...premium.shadowSoft,
  },
  row: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabOn: {
    backgroundColor: colors.soft,
    borderColor: 'rgba(30,142,78,0.25)',
  },
  pressed: { opacity: 0.9 },
  label: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.muted },
  labelOn: { color: colors.forest },
});
