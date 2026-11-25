import { Inbox, type LucideIcon } from 'lucide-react-native';
import { StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import { PestImage } from '@/components/ServiceIcon';
import { Button } from './Button';
import { colors, radii, spacing, typeScale, ui } from '@/constants/theme';

/**
 * Calm "nothing here" card. Defaults to a neutral line icon; pass `icon` for a context glyph
 * (bell, map pin, card…) or `art` for a bundled illustration where one genuinely fits.
 */
export function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
  icon: Icon = Inbox,
  art,
}: {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: LucideIcon;
  art?: ImageSourcePropType;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <View style={styles.icon}>
          {art ? <PestImage source={art} size={52} /> : <Icon size={30} color={ui.brand} strokeWidth={1.8} />}
        </View>
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        {message ? <Text style={styles.message}>{message}</Text> : null}
        {actionLabel && onAction ? (
          <Button title={actionLabel} variant="premium" size="md" onPress={onAction} style={styles.btn} />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  card: {
    maxWidth: 340,
    width: '100%',
    borderRadius: radii.card,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    padding: spacing.lg,
    alignItems: 'center',
    gap: 10,
    ...ui.shadow,
  },
  icon: {
    width: 72,
    height: 72,
    borderRadius: radii.pill,
    backgroundColor: ui.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    ...typeScale.section,
    textAlign: 'center',
    color: ui.text,
  },
  message: {
    ...typeScale.caption,
    lineHeight: 20,
    textAlign: 'center',
    color: ui.textSecondary,
  },
  btn: { marginTop: spacing.sm, minWidth: 160 },
});
