import { type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { colors, classic, fonts, spacing, typography } from '@/constants/theme';

export function BookSectionCard({
  title,
  subtitle,
  children,
  variant = 'premium',
  animDelay = 0,
  animTrigger,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  variant?: 'default' | 'premium';
  animDelay?: number;
  animTrigger?: string | number;
}) {
  if (variant === 'premium') {
    return (
      <FadeSlideIn delay={animDelay} trigger={animTrigger}>
        <Card variant="premium" style={styles.cardPremium}>
          <View style={styles.goldRule} />
          <Text style={styles.overline}>{title.toUpperCase()}</Text>
          {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
          <View style={styles.body}>{children}</View>
        </Card>
      </FadeSlideIn>
    );
  }

  return (
    <FadeSlideIn delay={animDelay} trigger={animTrigger}>
      <Card style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
        <View style={styles.body}>{children}</View>
      </Card>
    </FadeSlideIn>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md, padding: spacing.md },
  cardPremium: { marginBottom: spacing.md, padding: spacing.lg, overflow: 'hidden' },
  goldRule: {
    position: 'absolute',
    top: 0,
    left: spacing.lg,
    right: spacing.lg,
    height: 3,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    backgroundColor: classic.headerGoldLine,
  },
  overline: { ...typography.overline, marginBottom: 6, marginTop: 4 },
  title: { fontFamily: fonts.display, fontSize: 16, color: colors.ink },
  sub: { fontFamily: fonts.body, fontSize: 12.5, color: colors.muted, marginTop: 6, lineHeight: 18 },
  body: { marginTop: spacing.md },
  bodyTight: { marginTop: spacing.sm },
});
