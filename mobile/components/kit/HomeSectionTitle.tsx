import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { fonts, ui } from '@/constants/theme';

/** Home section title — bold heading with a quiet text link (Urban-style, no pills or accent bars). */
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
        <Text style={styles.title} numberOfLines={1}>
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
          style={({ pressed }) => [styles.action, pressed && { opacity: 0.6 }]}
          onPress={onAction}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={label}
        >
          <Text style={styles.actionLabel} numberOfLines={1}>
            {label}
          </Text>
          <ChevronRight size={16} color={ui.brand} strokeWidth={2.4} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  titleBlock: { flex: 1, minWidth: 0, gap: 4 },
  title: {
    fontFamily: fonts.displayExtra,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.6,
    color: ui.text,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: ui.textSecondary,
  },
  action: { flexDirection: 'row', alignItems: 'center', gap: 1, paddingBottom: 3, maxWidth: '40%' },
  actionLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 13.5,
    color: ui.brand,
  },
});

