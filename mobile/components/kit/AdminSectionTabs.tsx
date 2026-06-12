import { LinearGradient } from 'expo-linear-gradient';
import { LucideIcon } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, spacing } from '@/constants/theme';

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
      <LinearGradient colors={['#FFFFFF', '#F8FBF9']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />
      <LinearGradient colors={['#D4A017', '#B6841C']} style={styles.goldBar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const selected = tab.key === active;
          return (
            <Pressable
              key={tab.key}
              style={({ pressed }) => [styles.tab, selected && styles.tabOn, pressed && styles.pressed]}
              onPress={() => onChange(tab.key)}
            >
              <Icon size={14} color={selected ? colors.white : colors.forest} strokeWidth={2.2} />
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(20,83,45,0.1)',
    overflow: 'hidden',
  },
  goldBar: { height: 2, width: '100%' },
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
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.1)',
  },
  tabOn: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  pressed: { opacity: 0.88 },
  label: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.forest },
  labelOn: { color: colors.white },
});
