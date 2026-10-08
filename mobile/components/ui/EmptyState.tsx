import { StyleSheet, Text, View } from 'react-native';
import { PestImage } from '@/components/ServiceIcon';
import { SERVICE_TYPE_IMAGES } from '@/constants/serviceImages';
import { Button } from './Button';
import { colors, fonts, spacing, ui } from '@/constants/theme';

export function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
}: {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <View style={styles.icon}>
          <PestImage source={SERVICE_TYPE_IMAGES.cockroach} size={56} />
        </View>
        <Text style={styles.title}>{title}</Text>
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
    maxWidth: 320,
    width: '100%',
    borderRadius: 22,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    padding: spacing.lg,
    alignItems: 'center',
    gap: 10,
    ...ui.shadow,
  },
  icon: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: ui.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontFamily: fonts.displaySemi,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.3,
    textAlign: 'center',
    color: ui.text,
  },
  message: {
    fontFamily: fonts.body,
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: 'center',
    color: ui.textSecondary,
  },
  btn: { marginTop: spacing.sm, minWidth: 160 },
});
