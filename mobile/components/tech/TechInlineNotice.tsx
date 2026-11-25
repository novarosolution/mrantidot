import { CloudOff } from 'lucide-react-native';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, spacing, ui } from '@/constants/theme';

/**
 * Quiet inline error for one part of a screen ("Couldn't load your earnings · Try again"),
 * used instead of a toast so a failed background refresh never interrupts work.
 */
export function TechInlineNotice({
  message,
  actionLabel,
  onAction,
  busy = false,
}: {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  busy?: boolean;
}) {
  return (
    <View style={styles.card} accessibilityRole="alert">
      <View style={styles.icon}>
        <CloudOff size={17} color={colors.amberInk} strokeWidth={2.2} />
      </View>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          disabled={busy}
          hitSlop={6}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          accessibilityState={{ busy }}
        >
          {busy ? <ActivityIndicator size="small" color={ui.brand} /> : <Text style={styles.actionText}>{actionLabel}</Text>}
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 6,
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    marginBottom: spacing.sm,
    ...ui.shadow,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.amberBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 13, lineHeight: 18, color: ui.text },
  action: {
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { backgroundColor: ui.brandSoft },
  actionText: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: ui.brand },
});
