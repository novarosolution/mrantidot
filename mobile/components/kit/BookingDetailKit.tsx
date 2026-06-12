import { LinearGradient } from 'expo-linear-gradient';
import {
  Calendar,
  Check,
  CheckCircle2,
  ClipboardCheck,
  KeyRound,
  SprayCan,
  UserCheck,
  type LucideIcon,
} from 'lucide-react-native';
import { type ReactNode } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PremiumSectionHeader } from '@/components/ui/PremiumSectionHeader';
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge';
import { mediaUrl } from '@/lib/images';
import { colors, fonts, premium, shadows, spacing } from '@/constants/theme';

const STAGE_ICONS: LucideIcon[] = [
  ClipboardCheck,
  Calendar,
  UserCheck,
  SprayCan,
  KeyRound,
  CheckCircle2,
];

export function BookingDetailSection({
  title,
  subtitle,
  children,
  inset = true,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  inset?: boolean;
}) {
  return (
    <View style={styles.section}>
      <PremiumSectionHeader title={title} subtitle={subtitle} compact />
      <View style={[styles.card, inset && styles.cardInset]}>
        <LinearGradient colors={['#D4A017', '#B6841C']} style={styles.goldBar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
        {children}
      </View>
    </View>
  );
}

export function BookingStageTracker({ steps }: { steps: { title: string; done: boolean }[] }) {
  const doneCount = steps.filter((s) => s.done).length;
  const pct = steps.length ? Math.round((doneCount / steps.length) * 100) : 0;

  return (
    <View style={styles.stageWrap}>
      <LinearGradient colors={['#D4A017', '#B6841C']} style={styles.goldBar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
      <View style={styles.stageHead}>
        <Text style={styles.stageTitle}>Booking journey</Text>
        <View style={styles.stagePctChip}>
          <Text style={styles.stagePct}>{pct}%</Text>
        </View>
      </View>
      {steps.map((step, i) => {
        const Icon = STAGE_ICONS[i] ?? Check;
        const isLast = i === steps.length - 1;
        const isActive = step.done && (isLast || !steps[i + 1]?.done);
        return (
          <View key={step.title} style={styles.stageRow}>
            <View style={styles.stageCol}>
              <View style={[styles.stageDot, step.done && styles.stageDotDone, isActive && styles.stageDotActive]}>
                {step.done ? (
                  <Check size={11} color={colors.white} strokeWidth={3} />
                ) : (
                  <Icon size={12} color={colors.muted} strokeWidth={2.2} />
                )}
              </View>
              {!isLast ? (
                <View style={[styles.stageLine, step.done && steps[i + 1]?.done && styles.stageLineDone]} />
              ) : null}
            </View>
            <View style={styles.stageBody}>
              <Text style={[styles.stageLabel, !step.done && styles.stageLabelMuted, isActive && styles.stageLabelActive]}>
                {step.title}
              </Text>
              {isActive ? <Text style={styles.stageHint}>Current step</Text> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

export function BookingTreatmentStepCard({
  index,
  title,
  status,
  badge,
  photoUrl,
  geoAddress,
  active,
}: {
  index: number;
  title: string;
  status: string;
  badge: { label: string; tone: BadgeTone };
  photoUrl?: string;
  geoAddress?: string;
  active?: boolean;
}) {
  return (
    <View style={[styles.treatmentCard, active && styles.treatmentActive]}>
      <LinearGradient colors={['#D4A017', '#B6841C']} style={styles.goldBar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
      <View style={styles.treatmentHead}>
        <View style={[styles.stepNum, active && styles.stepNumActive]}>
          <Text style={[styles.stepNumText, active && styles.stepNumTextActive]}>{index + 1}</Text>
        </View>
        <View style={styles.treatmentInfo}>
          <Text style={styles.treatmentTitle}>{title}</Text>
          <Text style={styles.treatmentStatus}>{status === 'done' ? 'Completed' : active ? 'In progress' : 'Upcoming'}</Text>
        </View>
        <StatusBadge label={badge.label} tone={badge.tone} />
      </View>
      {photoUrl ? (
        <Image source={{ uri: mediaUrl(photoUrl) }} style={styles.treatmentPhoto} />
      ) : null}
      {geoAddress ? <Text style={styles.treatmentGeo}>{geoAddress}</Text> : null}
    </View>
  );
}

export function BookingPhotoGallery({ photos }: { photos: string[] }) {
  if (photos.length === 0) return null;
  return (
    <View style={styles.section}>
      <PremiumSectionHeader title="Problem photos" subtitle={`${photos.length} attached`} compact />
      <View style={[styles.card, styles.cardInset]}>
        <LinearGradient colors={['#D4A017', '#B6841C']} style={styles.goldBar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRow}>
          {photos.map((url, i) => (
            <View key={url} style={styles.photoFrame}>
              <Image source={{ uri: mediaUrl(url) }} style={styles.photo} />
              <View style={styles.photoIndex}>
                <Text style={styles.photoIndexText}>{i + 1}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: spacing.xs },
  card: {
    backgroundColor: colors.white,
    borderRadius: premium.radiusCard,
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.07)',
    overflow: 'hidden',
    ...shadows.card,
  },
  cardInset: { marginHorizontal: spacing.md },
  goldBar: { height: 3, width: '100%' },

  stageWrap: {
    padding: spacing.md,
    paddingTop: spacing.sm,
  },
  stageHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  stageTitle: { fontFamily: fonts.display, fontSize: 14, color: colors.ink },
  stagePctChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.soft,
  },
  stagePct: { fontFamily: fonts.displayExtra, fontSize: 12, color: colors.forest },
  stageRow: { flexDirection: 'row', alignItems: 'flex-start', minHeight: 48 },
  stageCol: { alignItems: 'center', width: 36, marginRight: spacing.sm },
  stageDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.soft,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageDotDone: { backgroundColor: colors.green, borderColor: colors.green },
  stageDotActive: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
    ...shadows.card,
  },
  stageLine: { flex: 1, width: 2, minHeight: 18, backgroundColor: colors.border, marginTop: 4 },
  stageLineDone: { backgroundColor: colors.green },
  stageBody: { flex: 1, paddingBottom: spacing.sm },
  stageLabel: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ink },
  stageLabelMuted: { color: colors.muted, fontFamily: fonts.body },
  stageLabelActive: { fontFamily: fonts.display, color: colors.forest },
  stageHint: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.green,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  treatmentCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: premium.radiusCard,
    padding: spacing.md,
    paddingTop: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.07)',
    overflow: 'hidden',
    ...shadows.card,
  },
  treatmentActive: {
    borderColor: colors.green,
    borderWidth: 1.5,
  },
  treatmentHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  stepNum: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumActive: { backgroundColor: colors.forest },
  stepNumText: { fontFamily: fonts.displayExtra, fontSize: 14, color: colors.forest },
  stepNumTextActive: { color: colors.white },
  treatmentInfo: { flex: 1, minWidth: 0 },
  treatmentTitle: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.ink },
  treatmentStatus: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 2 },
  treatmentPhoto: {
    width: '100%',
    height: 168,
    borderRadius: 14,
    marginTop: spacing.sm,
    backgroundColor: colors.soft,
  },
  treatmentGeo: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 6 },

  photoRow: { gap: spacing.sm, padding: spacing.md, paddingTop: spacing.sm },
  photoFrame: { position: 'relative' },
  photo: { width: 140, height: 104, borderRadius: 14, backgroundColor: colors.soft },
  photoIndex: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(20,83,45,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoIndexText: { fontFamily: fonts.bodySemi, fontSize: 10, color: colors.white },
});
