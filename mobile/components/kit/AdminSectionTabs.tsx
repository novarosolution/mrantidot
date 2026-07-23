import { LinearGradient } from 'expo-linear-gradient';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import type { LucideIcon } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { adminShadow } from '@/components/kit/homeUi';
import { adminSurfaces, colors, fonts, spacing } from '@/constants/theme';

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
      <LinearGradient colors={['#FFFFFF', '#F6FAF2']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />
      <LinearGradient colors={['#8FD03C', '#27A747']} style={styles.goldBar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const selected = tab.key === active;
          return (
            <Pressable
              key={tab.key}
              style={({ pressed }) => [pressed && styles.pressed]}
              onPress={() => onChange(tab.key)}
            >
              {selected ? (
                <View style={styles.tabOnShell}>
                  <LinearGradient
                    colors={['#8FD03C', '#1A8734', '#0A6423']}
                    start={{ x: 0.1, y: 0 }}
                    end={{ x: 0.9, y: 1 }}
                    style={[styles.tab, styles.tabOn]}
                  >
                    <PremiumIcon icon={Icon} variant="plain" size={14} color="#FFFFFF" strokeWidth={2.3} fill="rgba(255,255,255,0.28)" />
                    <Text style={[styles.label, styles.labelOn]} numberOfLines={1}>
                      {tab.label}
                    </Text>
                  </LinearGradient>
                </View>
              ) : (
                <View style={styles.tab}>
                  <PremiumIcon icon={Icon} variant="plain" size={14} color={colors.forest} strokeWidth={2.3} />
                  <Text style={styles.label} numberOfLines={1}>
                    {tab.label}
                  </Text>
                </View>
              )}
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
    borderBottomColor: adminSurfaces.cardBorder,
    overflow: 'hidden',
  },
  goldBar: { height: 2.5, width: '100%' },
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
    borderColor: adminSurfaces.chipBorder,
  },
  tabOnShell: {
    borderRadius: 999,
    ...adminShadow.soft,
  },
  tabOn: {
    borderWidth: 0,
  },
  pressed: { opacity: 0.88 },
  label: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: colors.ink },
  labelOn: { color: colors.white },
});
