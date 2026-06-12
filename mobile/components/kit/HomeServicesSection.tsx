import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { HomeCategoryFilter } from '@/components/kit/HomePageKit';
import { PremiumSectionHeader } from '@/components/ui/PremiumSectionHeader';
import { spacing } from '@/constants/theme';

/** Services block: header, category filter, and grid content as one section. */
export function HomeServicesSection({
  title,
  actionLabel,
  onAction,
  chips,
  selectedCategory,
  onSelectCategory,
  children,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  chips: { label: string }[];
  selectedCategory: string;
  onSelectCategory: (label: string) => void;
  children: ReactNode;
}) {
  return (
    <View style={styles.wrap}>
      <PremiumSectionHeader
        title={title}
        actionLabel={actionLabel}
        onAction={onAction}
        compact
        showRule={false}
        style={styles.header}
      />
      <HomeCategoryFilter chips={chips} selected={selectedCategory} onSelect={onSelectCategory} />
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.sm,
  },
  header: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  body: {
    marginTop: spacing.xs,
  },
});
