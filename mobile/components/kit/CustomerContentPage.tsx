import { type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomerPageHeader } from '@/components/kit/CustomerPageHeader';
import { GlassBackdrop } from '@/components/kit/GlassScreenKit';
import { PremiumSectionHeader } from '@/components/ui/PremiumSectionHeader';
import { spacing, surfaces } from '@/constants/theme';

/** Shared premium shell for CMS / legal / FAQ-style customer pages. */
export function CustomerContentPage({
  title,
  subtitle,
  sectionTitle,
  sectionSubtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  sectionTitle?: string;
  sectionSubtitle?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.root}>
      <GlassBackdrop />
      <SafeAreaView style={styles.safe} edges={['left', 'right']}>
        <CustomerPageHeader title={title} subtitle={subtitle} variant="premium" showBack />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {sectionTitle ? (
            <PremiumSectionHeader
              title={sectionTitle}
              subtitle={sectionSubtitle}
              style={styles.section}
              compact
            />
          ) : null}
          {children}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: surfaces.glassScreenBase },
  safe: { flex: 1, backgroundColor: 'transparent' },
  scroll: { paddingBottom: spacing.xxl, flexGrow: 1 },
  section: { marginTop: spacing.md, paddingHorizontal: spacing.md },
});
