import { type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { colors, fonts, spacing, typography } from '@/constants/theme';

export function BookSectionCard({
  title,
  subtitle,
  children,
  variant = 'premium',
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  variant?: 'default' | 'premium';
}) {
  if (variant === 'premium') {
    return (
      <Card variant="premium" style={styles.cardPremium}>
        <Text style={styles.overline}>{title.toUpperCase()}</Text>
        {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
        <View style={styles.body}>{children}</View>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
      <View style={styles.body}>{children}</View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md, padding: spacing.md },
  cardPremium: { marginBottom: spacing.md, padding: spacing.lg },
  overline: { ...typography.overline, marginBottom: 6 },
  title: { fontFamily: fonts.display, fontSize: 16, color: colors.ink },
  titlePremium: { fontFamily: fonts.displayExtra, fontSize: 17, color: colors.ink, letterSpacing: -0.3 },
  sub: { fontFamily: fonts.body, fontSize: 12.5, color: colors.muted, marginTop: 6, lineHeight: 18 },
  body: { marginTop: spacing.md },
});
