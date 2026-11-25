import { RefreshCw, WifiOff } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { colors, radii, spacing, typeScale, ui } from '@/constants/theme';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { errorKind } from '@/lib/errorKind';

/**
 * Error / reload card used across list and detail screens. Transport failures (offline, 5xx) get
 * friendly admin-editable copy — the raw error (codes, API address) is never shown. A real message
 * from the API ("Booking not found") is shown as is.
 */
export function ListEmptyRetry({
  title,
  message,
  onRetry,
  retryLabel,
}: {
  title?: string;
  /** The load error (usually `useScreenLoad().error`). */
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  const copy = useCustomerUiCopy();
  const kind = errorKind(message ?? '');
  const offline = kind === 'offline';
  const heading = title ?? (offline ? copy.systemOfflineTitle : copy.systemErrorTitle);
  const body = kind === 'message' ? message : offline ? copy.systemOfflineMessage : copy.systemErrorMessage;
  const Icon = offline ? WifiOff : RefreshCw;
  const label = retryLabel ?? copy.systemRetry;

  return (
    <View style={styles.wrap}>
      <View style={styles.card} accessibilityRole="alert">
        <View style={[styles.iconHalo, offline && styles.iconHaloOffline]}>
          <Icon size={26} color={offline ? colors.error : ui.brand} strokeWidth={2} />
        </View>
        <Text style={styles.title} accessibilityRole="header">
          {heading}
        </Text>
        {body ? <Text style={styles.message}>{body}</Text> : null}
        {onRetry ? (
          <Button title={label} variant="premium" size="md" onPress={onRetry} style={styles.btn} accessibilityLabel={label} />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  card: {
    maxWidth: 340,
    width: '100%',
    alignItems: 'center',
    gap: 10,
    padding: spacing.lg + 4,
    borderRadius: radii.card,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    ...ui.shadow,
  },
  iconHalo: {
    width: 64,
    height: 64,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    backgroundColor: ui.brandSoft,
  },
  iconHaloOffline: { backgroundColor: colors.errorBg },
  title: { ...typeScale.section, color: ui.text, textAlign: 'center' },
  message: { ...typeScale.caption, lineHeight: 20, color: ui.textSecondary, textAlign: 'center' },
  btn: { marginTop: spacing.sm, minWidth: 168 },
});
