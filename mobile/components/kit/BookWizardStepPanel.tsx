import { LinearGradient } from 'expo-linear-gradient';
import { type LucideIcon } from 'lucide-react-native';
import { type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { colors, fonts, premium, spacing, surfaces } from '@/constants/theme';

export function BookWizardStepPanel({
  icon: Icon,
  title,
  subtitle,
  children,
  animTrigger,
  compactHeader,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  children: ReactNode;
  animTrigger?: string | number;
  compactHeader?: boolean;
}) {
  return (
    <FadeSlideIn trigger={animTrigger}>
      <View style={styles.root}>
        <LinearGradient colors={['#8FD03C', '#27A747']} style={styles.goldBar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
        <LinearGradient
          colors={['rgba(255,255,255,0.94)', 'rgba(244,250,238,0.88)', 'rgba(234,246,227,0.72)']}
          locations={[0, 0.55, 1]}
          style={[styles.header, compactHeader && styles.headerCompact]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <PremiumIcon
            icon={Icon}
            variant="premium"
            size={compactHeader ? 18 : 22}
            color={colors.forest}
            boxSize={compactHeader ? 42 : 50}
          />
          <View style={styles.headerText}>
            <Text style={[styles.title, compactHeader && styles.titleCompact]}>{title}</Text>
            {subtitle ? (
              <Text style={[styles.subtitle, compactHeader && styles.subtitleCompact]}>{subtitle}</Text>
            ) : null}
          </View>
        </LinearGradient>
        <View style={[styles.body, compactHeader && styles.bodyCompact]}>{children}</View>
      </View>
    </FadeSlideIn>
  );
}

export function BookWizardSection({
  step,
  title,
  hint,
  children,
  compact,
}: {
  step: number;
  title: string;
  hint?: string;
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <LinearGradient
          colors={['#1A8734', '#0A6423']}
          style={[styles.stepBadge, compact && styles.stepBadgeCompact]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.stepNum}>{step}</Text>
        </LinearGradient>
        <View style={styles.sectionTitles}>
          <Text style={[styles.sectionTitle, compact && styles.sectionTitleCompact]}>{title}</Text>
          {hint ? <Text style={styles.sectionHint}>{hint}</Text> : null}
        </View>
      </View>
      <View style={[styles.panel, compact && styles.panelCompact]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderRadius: premium.radiusCard,
    backgroundColor: 'rgba(255,255,255,0.38)',
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...premium.shadowSoft,
  },
  goldBar: { height: 3, width: '100%' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: surfaces.glassBorder,
  },
  headerCompact: {
    gap: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  headerText: { flex: 1 },
  title: {
    fontFamily: fonts.displayExtra,
    fontSize: 20,
    color: colors.ink,
    letterSpacing: -0.3,
    lineHeight: 26,
  },
  titleCompact: {
    fontSize: 17,
    lineHeight: 22,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.muted,
    marginTop: 4,
    lineHeight: 19,
  },
  subtitleCompact: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 17,
  },
  body: {
    padding: spacing.md,
    gap: spacing.lg,
    backgroundColor: surfaces.glassSoft,
  },
  bodyCompact: {
    gap: spacing.md,
    padding: spacing.sm,
    paddingTop: spacing.md,
  },
  section: { gap: spacing.sm },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 2,
  },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeCompact: {
    width: 22,
    height: 22,
    borderRadius: 7,
  },
  stepNum: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.lime,
  },
  sectionTitles: { flex: 1, paddingTop: 2 },
  sectionTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.ink,
  },
  sectionTitleCompact: {
    fontSize: 13,
  },
  sectionHint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
    lineHeight: 17,
  },
  panel: {
    backgroundColor: surfaces.glassInput,
    borderRadius: 18,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
    ...premium.shadowSoft,
    shadowOpacity: 0.06,
  },
  panelCompact: {
    padding: spacing.sm,
    borderRadius: 14,
  },
});
