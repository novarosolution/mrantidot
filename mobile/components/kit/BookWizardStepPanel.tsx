import { LinearGradient } from 'expo-linear-gradient';
import { type LucideIcon } from 'lucide-react-native';
import { type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { colors, classic, fonts, spacing } from '@/constants/theme';

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
        <LinearGradient
          colors={['#FFFFFF', '#FAFCF9']}
          style={[styles.header, compactHeader && styles.headerCompact]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={[styles.headerIcon, compactHeader && styles.headerIconCompact]}>
            <Icon size={compactHeader ? 18 : 22} color={colors.forest} strokeWidth={2.2} />
          </View>
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
        <View style={[styles.stepBadge, compact && styles.stepBadgeCompact]}>
          <Text style={styles.stepNum}>{step}</Text>
        </View>
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
    borderRadius: 22,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.07)',
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(20,83,45,0.06)',
  },
  headerCompact: {
    gap: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(30,142,78,0.12)',
  },
  headerIconCompact: {
    width: 38,
    height: 38,
    borderRadius: 12,
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
    backgroundColor: classic.screenBg,
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
    backgroundColor: colors.forest,
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
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.06)',
  },
  panelCompact: {
    padding: spacing.sm,
    borderRadius: 14,
  },
});
