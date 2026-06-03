import { Inbox } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { colors, design, fonts, premium, shadows, spacing } from '@/constants/theme';

export function EmptyState({ title, message }: { title: string; message?: string }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Inbox size={28} color={colors.secondaryDark} strokeWidth={1.8} />
        </View>
        <Text style={styles.title}>{title}</Text>
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
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
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: { ...design.sectionTitle, textAlign: 'center' },
  message: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textMuted,
    marginTop: spacing.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
});
