import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts, ui } from '@/constants/theme';

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
  const label = actionLabel?.trim() || 'See all';

  return (
    <View style={styles.wrap}>
      <View style={styles.titleBlock}>
        <Text style={styles.title} numberOfLines={2}>
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
  title: {
    fontFamily: fonts.displaySemi,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.5,
    color: ui.text,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 20,
    color: ui.textSecondary,
  },
  action: { paddingTop: 4, maxWidth: '36%' },
  actionLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: ui.brand,
  },
});
