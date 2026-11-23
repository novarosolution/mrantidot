import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts, typeScale, ui } from '@/constants/theme';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';

/** Home section title — bold heading, a quiet grey line under it, and a plain coloured "See all" link. */
export function HomeSectionTitle({
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const copy = useCustomerUiCopy();
  const label = actionLabel?.trim() || copy.homeSeeAll;

  return (
    <View style={styles.wrap}>
      <View style={styles.titleBlock}>
        <Text style={styles.title} numberOfLines={2} accessibilityRole="header">
          {title}
        </Text>
        {subtitle?.trim() ? (
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle.trim()}
          </Text>
        ) : null}
      </View>
      {onAction ? (
        <Pressable
          style={({ pressed }) => [styles.action, pressed && { opacity: 0.55 }]}
          onPress={onAction}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={label}
        >
          <Text style={styles.actionLabel} numberOfLines={1}>
            {label}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  titleBlock: { flex: 1, minWidth: 0, gap: 4 },
  /** Home feed headings use the large title step (22) in the softer semibold face. */
  title: { ...typeScale.title, fontFamily: fonts.displaySemi, color: ui.text },
  subtitle: { ...typeScale.body, color: ui.textSecondary },
  action: { paddingTop: 4, maxWidth: '36%', minHeight: 32 },
  actionLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: ui.brand,
  },
});
