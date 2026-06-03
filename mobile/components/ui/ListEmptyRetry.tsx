import { AlertCircle } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { colors, design, fonts, premium, shadows, spacing } from '@/constants/theme';

export function ListEmptyRetry({
  title,
  message,
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  const isOffline = message?.toLowerCase().includes('cannot reach') ?? false;
  const heading = title ?? (isOffline ? 'Server unreachable' : 'Something went wrong');

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <AlertCircle size={28} color={colors.error} strokeWidth={1.8} />
        </View>
        <Text style={styles.title}>{heading}</Text>
        {message ? <Text style={styles.message}>{message}</Text> : null}
        {onRetry ? <Button title="Try again" variant="premium" onPress={onRetry} style={styles.btn} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  card: {
    backgroundColor: premium.surfaceElevated,
    borderRadius: premium.radiusCard,
    padding: spacing.lg,
    alignItems: 'center',
    maxWidth: 320,
    ...shadows.floating,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.errorBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: { ...design.sectionTitle, fontSize: 16, textAlign: 'center' },
  message: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 8, textAlign: 'center' },
  btn: { marginTop: spacing.md, minWidth: 160 },
});
