import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { HomeCategoryFilter } from '@/components/kit/HomePageKit';
import { HomeSectionTitle } from '@/components/kit/HomeSectionTitle';

export function HomeServicesSection({
  title,
  subtitle,
  actionLabel,
  onAction,
  chips,
  selectedCategory,
  onSelectCategory,
  children,
}: {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  chips: { label: string }[];
  selectedCategory: string;
  onSelectCategory: (label: string) => void;
  children: ReactNode;
}) {
  return (
    <View style={styles.wrap}>
      <HomeSectionTitle title={title} subtitle={subtitle} actionLabel={actionLabel} onAction={onAction} />
      <HomeCategoryFilter chips={chips} selected={selectedCategory} onSelect={onSelectCategory} />
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {},
  body: { marginTop: 4 },
});
