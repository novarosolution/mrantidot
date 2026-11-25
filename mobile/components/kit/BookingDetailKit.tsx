import { type LucideIcon } from 'lucide-react-native';
import { type ReactNode, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, type ImageStyle, type StyleProp } from 'react-native';
import { AppImage } from '@/components/ui/AppImage';
import { PhotoViewer } from '@/components/ui/PhotoViewer';
import { PressableScale } from '@/components/ui/PressableScale';
import { fillCopy } from '@/constants/customerUiCopy';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { PremiumSectionHeader } from '@/components/ui/PremiumSectionHeader';
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge';
import { mediaUrl } from '@/lib/images';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { colors, fonts, premium, shadows, spacing, surfaces } from '@/constants/theme';

const STAGE_ICONS: LucideIcon[] = [
  AppIcons.ui.listChecks,
  AppIcons.ui.calendar,
  AppIcons.ui.shieldCheck,
  AppIcons.ui.brand,
  AppIcons.ui.key,
  AppIcons.toast.success,
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
        {children}
      </View>
    </View>
  );
}

export function BookingStageTracker({ steps }: { steps: { title: string; done: boolean }[] }) {
  const doneCount = steps.filter((s) => s.done).length;
  const pct = steps.length ? Math.round((doneCount / steps.length) * 100) : 0;
  const activeIdx = steps.findIndex((s) => !s.done);
  const labels = useCustomerUiCopy();

  return (
    <View style={styles.stageWrap}>
      <View style={styles.stageHead}>
        <Text style={styles.stageTitle}>{labels.bookingDetailJourneyTitle}</Text>
        <View style={styles.stagePctChip}>
          <Text style={styles.stagePct}>{pct}%</Text>
        </View>
      </View>
      {steps.map((step, i) => {
        const Icon = STAGE_ICONS[i] ?? AppIcons.ui.check;
        const isLast = i === steps.length - 1;
        const isActive = activeIdx === i;
        return (
          <View key={step.title} style={styles.stageRow}>
            <View style={styles.stageCol}>
              <View style={[styles.stageDot, step.done && styles.stageDotDone, isActive && styles.stageDotActive]}>
                {step.done ? (
                  <PremiumIcon icon={AppIcons.ui.check} variant="plain" size={11} color={colors.white} strokeWidth={3} />
                ) : (
                  <PremiumIcon icon={Icon} variant="plain" size={12} color={isActive ? colors.forest : colors.muted} strokeWidth={2.2} />
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
              {isActive ? <Text style={styles.stageHint}>{labels.bookingDetailCurrentStep}</Text> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

/**
 * Booking photo (cached through AppImage). With `onOpen` it becomes a button that opens the viewer.
 * Empty URLs show a quiet "no image" tile instead of an empty box.
 */
export function SafePhoto({
  uri,
  style,
  onOpen,
  label,
}: {
  uri: string;
  style: StyleProp<ImageStyle>;
  /** @deprecated kept for older call sites — the tile is icon-only now. */
  compact?: boolean;
  onOpen?: () => void;
  label?: string;
}) {
  const copy = useCustomerUiCopy();
  const img = <AppImage uri={uri || null} style={style} recyclingKey={uri} accessibilityLabel={onOpen ? undefined : label} />;
  if (!onOpen) return img;
  return (
    <PressableScale
      onPress={onOpen}
      accessibilityRole="imagebutton"
      accessibilityLabel={label ?? copy.photoUnavailable}
      accessibilityHint={copy.photoOpenHint}
    >
      {img}
    </PressableScale>
  );
}

export function BookingTreatmentStepCard({
  index,
  title,
  status,
  badge,
  photoUrl,
  photoUrls,
  geoAddress,
  active,
}: {
  index: number;
  title: string;
  status: string;
  badge: { label: string; tone: BadgeTone };
  photoUrl?: string;
  photoUrls?: string[];
  geoAddress?: string;
  active?: boolean;
}) {
  const copy = useCustomerUiCopy();
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const photos = (photoUrls && photoUrls.length > 0 ? photoUrls : photoUrl ? [photoUrl] : []).map((p) => mediaUrl(p));
  const photoLabel = (i: number) => fillCopy(copy.photoViewerLabel, { current: i + 1, total: photos.length });

  return (
    <View style={[styles.treatmentCard, active && styles.treatmentActive]}>
      <View style={styles.treatmentHead}>
        <View style={[styles.stepNum, active && styles.stepNumActive]}>
          <Text style={[styles.stepNumText, active && styles.stepNumTextActive]}>{index + 1}</Text>
        </View>
        <View style={styles.treatmentInfo}>
          <Text style={styles.treatmentTitle}>{title}</Text>
          {/* The badge already says Completed / In progress — the subtitle adds detail instead. */}
          {status === 'done' && photos.length > 0 ? (
            <Text style={styles.treatmentStatus}>
              {photos.length === 1 ? copy.stepPhotosOne : fillCopy(copy.stepPhotosMany, { count: photos.length })}
            </Text>
          ) : active ? (
            <Text style={styles.treatmentStatus}>{copy.stepWorkingNow}</Text>
          ) : null}
        </View>
        <StatusBadge label={badge.label} tone={badge.tone} />
      </View>
      {photos.length === 1 ? (
        <SafePhoto uri={photos[0]} style={styles.treatmentPhoto} onOpen={() => setViewerIndex(0)} label={photoLabel(0)} />
      ) : photos.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.treatmentPhotoRow}
        >
          {photos.map((url, i) => (
            <View key={`${url}-${i}`} style={styles.treatmentPhotoFrame}>
              <SafePhoto uri={url} style={styles.treatmentPhotoMulti} onOpen={() => setViewerIndex(i)} label={photoLabel(i)} />
              <View style={styles.photoIndex}>
                <Text style={styles.photoIndexText}>{i + 1}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      ) : null}
      {geoAddress ? <Text style={styles.treatmentGeo}>{geoAddress}</Text> : null}
      <PhotoViewer photos={photos} index={viewerIndex} onClose={() => setViewerIndex(null)} />
    </View>
  );
}

export function BookingPhotoGallery({ photos: raw }: { photos: string[] }) {
  const copy = useCustomerUiCopy();
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  if (raw.length === 0) return null;
  const photos = raw.map((p) => mediaUrl(p));
  return (
    <View style={styles.section}>
      <PremiumSectionHeader
        title={copy.problemPhotosTitle}
        subtitle={fillCopy(copy.problemPhotosSub, { count: photos.length })}
        compact
      />
      <View style={[styles.card, styles.cardInset]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRow}>
          {photos.map((url, i) => (
            <View key={`${url}-${i}`} style={styles.photoFrame}>
              <SafePhoto
                uri={url}
                style={styles.photo}
                onOpen={() => setViewerIndex(i)}
                label={fillCopy(copy.photoViewerLabel, { current: i + 1, total: photos.length })}
              />
              <View style={styles.photoIndex}>
                <Text style={styles.photoIndexText}>{i + 1}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
      <PhotoViewer photos={photos} index={viewerIndex} onClose={() => setViewerIndex(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: spacing.xs },
  card: {
    backgroundColor: colors.white,
    borderRadius: premium.radiusCard,
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
    overflow: 'hidden',
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
    backgroundColor: surfaces.glassInput,
    borderRadius: premium.radiusCard,
    padding: spacing.md,
    paddingTop: spacing.sm,
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
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
  treatmentPhotoRow: { gap: spacing.sm, marginTop: spacing.sm, paddingRight: 4 },
  treatmentPhotoFrame: { position: 'relative' },
  treatmentPhotoMulti: {
    width: 140,
    height: 104,
    borderRadius: 14,
    backgroundColor: colors.soft,
  },
  treatmentGeo: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 6 },
  /** Keep failed photos compact — no tall empty block. */
  photoFallback: { height: 88 },
  photoFallbackSurface: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F2F4F2',
  },
  photoFallbackText: { fontFamily: fonts.bodySemi, fontSize: 11.5, color: colors.muted },

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
