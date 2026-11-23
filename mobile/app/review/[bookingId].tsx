import { useLocalSearchParams } from 'expo-router';
import { CircleCheck } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { paramString } from '@/lib/routeParams';
import { CustomerPageHeader } from '@/components/kit/CustomerPageHeader';
import { ListRowsSkeleton } from '@/components/kit/ScreenSkeletons';
import { ServiceThumb } from '@/components/kit/ServiceThumb';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { RatingStars } from '@/components/ui/RatingStars';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { StickyActionBar } from '@/components/ui/StickyActionBar';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Skeleton } from '@/components/ui/Skeleton';
import { api, getApiErrorMessage, screenLoadConfig } from '@/lib/api';
import { bookingScheduleDisplay, bookingServiceIconKey, bookingServiceName } from '@/lib/booking-helpers';
import { useBusinessSettings } from '@/lib/businessSettings';
import { reviewTags } from '@/lib/settingsLabels';
import { useScreenLoad } from '@/lib/useScreenLoad';
import { haptic, stagger } from '@/lib/motion';
import type { Booking } from '@/types/api';
import { colors, radii, spacing, typeScale, ui } from '@/constants/theme';
import { customerRoutes, appReplace } from '@/lib/routes';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';

/** Rate a finished visit: stars (with words), the admin's quick tags, an optional note, then a thank-you. */
export default function ReviewScreen() {
  const copy = useCustomerUiCopy();
  const settings = useBusinessSettings();
  const bookingId = paramString(useLocalSearchParams<{ bookingId: string | string[] }>().bookingId);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [stars, setStars] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const { loading, error, runLoad } = useScreenLoad();
  const starWords = ['', copy.reviewStar1, copy.reviewStar2, copy.reviewStar3, copy.reviewStar4, copy.reviewStar5];
  const tagOptions = reviewTags(settings);

  const load = useCallback(async () => {
    if (!bookingId) throw new Error(copy.bookingNotFound);
    const { data } = await api.get<{ booking: Booking }>(`/bookings/${bookingId}`, screenLoadConfig);
    setBooking(data.booking);
    // Copy edits must not refetch.
  }, [bookingId]);

  useEffect(() => {
    void runLoad(load);
  }, [load, runLoad]);

  function toggleTag(tag: string) {
    haptic('select');
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  async function submit() {
    if (!bookingId || stars < 1) {
      haptic('warning');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/reviews', { bookingId, stars, tags, comment: comment.trim() || undefined });
      haptic('success');
      setDone(true);
    } catch (err) {
      haptic('error');
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, copy.reviewSubmitFailed) });
    } finally {
      setSubmitting(false);
    }
  }

  const header = <CustomerPageHeader variant="premium" title={copy.reviewScreenTitle} showBack />;

  if (loading) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.safe} edges={['left', 'right']}>
          {header}
          <View style={styles.container}>
            <ListRowsSkeleton rows={1} />
            <View style={styles.skeletonCard}>
              <Skeleton width="60%" height={20} radius={8} />
              <Skeleton width={240} height={40} radius={12} style={styles.skeletonStars} />
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (error || !booking) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.safe} edges={['left', 'right']}>
          {header}
          <ListEmptyRetry message={error ?? copy.bookingNotFound} onRetry={() => void runLoad(load)} />
        </SafeAreaView>
      </View>
    );
  }

  const service =
    booking.service && typeof booking.service === 'object'
      ? booking.service
      : { iconKey: bookingServiceIconKey(booking), serviceTypes: undefined };
  const rated = stars > 0;

  if (done) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.safe} edges={['left', 'right']}>
          {header}
          <View style={styles.thanksWrap}>
            <FadeSlideIn>
              <View style={styles.thanksCard} accessibilityRole="summary">
                <View style={styles.thanksIcon}>
                  <CircleCheck size={40} color={colors.white} strokeWidth={2} />
                </View>
                <Text style={styles.thanksTitle} accessibilityRole="header">
                  {copy.reviewThanksTitle}
                </Text>
                <RatingStars value={stars} size={26} />
                <Text style={styles.thanksBody}>{copy.reviewThanksBody}</Text>
              </View>
            </FadeSlideIn>
          </View>
          <StickyActionBar>
            <Button title={copy.reviewThanksDone} variant="premium" onPress={() => appReplace(customerRoutes.bookings)} />
          </StickyActionBar>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['left', 'right']}>
        {header}
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        >
          <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <FadeSlideIn delay={stagger(0)}>
              <View style={styles.serviceCard}>
                <ServiceThumb service={service} width={48} radius={radii.thumb} iconSize={24} />
                <View style={styles.serviceText}>
                  <Text style={styles.serviceName} numberOfLines={1}>
                    {bookingServiceName(booking, copy)}
                  </Text>
                  <Text style={styles.serviceDate} numberOfLines={1}>
                    {bookingScheduleDisplay(booking, copy)}
                  </Text>
                </View>
              </View>
            </FadeSlideIn>

            <FadeSlideIn delay={stagger(1)}>
              <View style={styles.formCard}>
                <Text style={styles.heading} accessibilityRole="header">
                  {copy.reviewHeading}
                </Text>
                <View style={styles.starsWrap}>
                  <RatingStars value={stars} onChange={setStars} size={40} />
                </View>
                <Text style={[styles.starLabel, !rated && styles.starLabelMuted]} accessibilityLiveRegion="polite">
                  {rated ? starWords[stars] : copy.reviewSelectRating}
                </Text>

                {rated ? (
                  <FadeSlideIn delay={stagger(1)} slideFrom={10}>
                    <View style={styles.detailsBlock}>
                      <View style={styles.divider} />
                      {tagOptions.length > 0 ? (
                        <>
                          <Text style={styles.sectionLabel}>{copy.reviewTagsTitle}</Text>
                          <View style={styles.tags}>
                            {tagOptions.map((tag) => (
                              <Chip key={tag} label={tag} selected={tags.includes(tag)} onPress={() => toggleTag(tag)} />
                            ))}
                          </View>
                        </>
                      ) : null}
                      <Input
                        label={copy.reviewNoteLabel}
                        value={comment}
                        onChangeText={setComment}
                        multiline
                        placeholder={copy.reviewNotePlaceholder}
                        containerStyle={styles.commentInput}
                      />
                    </View>
                  </FadeSlideIn>
                ) : null}
              </View>
            </FadeSlideIn>
          </ScrollView>
        </KeyboardAvoidingView>

        <StickyActionBar>
          <Button
            title={rated ? copy.reviewSubmit : copy.reviewSelectRating}
            variant="premium"
            onPress={submit}
            loading={submitting}
            disabled={stars < 1}
          />
        </StickyActionBar>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: ui.canvas },
  safe: { flex: 1, backgroundColor: 'transparent' },
  flex: { flex: 1 },
  container: { padding: spacing.md, paddingBottom: 140, gap: spacing.sm },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
    padding: spacing.md,
    borderRadius: radii.card,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
  },
  serviceText: { flex: 1 },
  serviceName: { ...typeScale.rowTitle, color: ui.text },
  serviceDate: { ...typeScale.caption, fontSize: 12, color: ui.textSecondary, marginTop: 2 },
  formCard: {
    padding: spacing.lg,
    paddingTop: spacing.md + 4,
    borderRadius: radii.card,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    ...ui.shadow,
  },
  heading: { ...typeScale.title, fontSize: 20, lineHeight: 26, textAlign: 'center', color: ui.text, marginTop: spacing.sm },
  starsWrap: { alignItems: 'center', marginTop: spacing.lg },
  starLabel: { ...typeScale.rowTitleLg, color: ui.brand, textAlign: 'center', marginTop: spacing.sm },
  starLabelMuted: { ...typeScale.body, color: ui.textSecondary },
  detailsBlock: { marginTop: spacing.md },
  divider: { height: 1, backgroundColor: ui.hairline, marginBottom: spacing.md },
  sectionLabel: { ...typeScale.bodyStrong, color: ui.text, marginBottom: spacing.sm },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xs },
  commentInput: { marginBottom: 0, marginTop: spacing.sm },
  skeletonCard: {
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.card,
    backgroundColor: colors.white,
  },
  skeletonStars: { marginTop: spacing.sm },
  thanksWrap: { flex: 1, padding: spacing.md, justifyContent: 'center' },
  thanksCard: {
    alignItems: 'center',
    gap: spacing.sm + 4,
    padding: spacing.lg + 4,
    borderRadius: radii.card,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.hairline,
    ...ui.shadow,
  },
  thanksIcon: {
    width: 76,
    height: 76,
    borderRadius: radii.pill,
    backgroundColor: ui.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  thanksTitle: { ...typeScale.title, textAlign: 'center', color: ui.text },
  thanksBody: { ...typeScale.body, textAlign: 'center', color: ui.textSecondary },
});
