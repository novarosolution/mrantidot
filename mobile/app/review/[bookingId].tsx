import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { paramString } from '@/lib/routeParams';
import { CustomerPageHeader } from '@/components/kit/CustomerPageHeader';
import { ServiceIcon } from '@/components/ServiceIcon';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { RatingStars } from '@/components/ui/RatingStars';
import { Card } from '@/components/ui/Card';
import { FadeSlideIn } from '@/components/ui/FadeSlideIn';
import { StickyActionBar } from '@/components/ui/StickyActionBar';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { api, getApiErrorMessage, screenLoadConfig } from '@/lib/api';
import {
  bookingScheduleDisplay,
  bookingServiceIconKey,
  bookingServiceName,
} from '@/lib/booking-helpers';
import { useScreenLoad } from '@/lib/useScreenLoad';
import type { Booking } from '@/types/api';
import { colors, fonts, premium, spacing, ui } from '@/constants/theme';
import { customerRoutes, appReplace } from '@/lib/routes';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';

const TAGS = ['On time', 'Professional', 'No smell', 'Thorough', 'Polite'];

const STAR_LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'] as const;

export default function ReviewScreen() {
  const copy = useCustomerUiCopy();
  const bookingId = paramString(useLocalSearchParams<{ bookingId: string | string[] }>().bookingId);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [stars, setStars] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { loading, error, runLoad } = useScreenLoad();

  const load = useCallback(async () => {
    if (!bookingId) {
      throw new Error('Booking not found');
    }
    const { data } = await api.get<{ booking: Booking }>(`/bookings/${bookingId}`, screenLoadConfig);
    setBooking(data.booking);
  }, [bookingId]);

  useEffect(() => {
    void runLoad(load);
  }, [load, runLoad]);

  function toggleTag(tag: string) {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  async function submit() {
    if (!bookingId) {
      Toast.show({ type: 'error', text1: 'Booking not found' });
      return;
    }
    if (stars < 1) {
      Toast.show({ type: 'error', text1: 'Please select a star rating' });
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/reviews', { bookingId, stars, tags, comment: comment.trim() || undefined });
      Toast.show({ type: 'success', text1: 'Review submitted!' });
      appReplace(customerRoutes.bookings);
    } catch (err) {
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Could not submit review') });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Spinner fullScreen />;

  if (error || !booking) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.safe} edges={['left', 'right']}>
          <CustomerPageHeader variant="premium" title={copy.reviewScreenTitle} showBack />
          <ListEmptyRetry message={error ?? 'Booking not found'} onRetry={() => void runLoad(load)} />
        </SafeAreaView>
      </View>
    );
  }

  const serviceName = bookingServiceName(booking);
  const schedule = bookingScheduleDisplay(booking);
  const iconKey = bookingServiceIconKey(booking);
  const rated = stars > 0;

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['left', 'right']}>
        <CustomerPageHeader variant="premium" title={copy.reviewScreenTitle} showBack />
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        >
          <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <FadeSlideIn>
              <Card variant="premium" style={styles.serviceCard}>
                <View style={styles.serviceStrip}>
                  <View style={styles.serviceIcon}>
                    <ServiceIcon iconKey={iconKey} size={20} color={colors.white} />
                  </View>
                  <View style={styles.serviceText}>
                    <Text style={styles.serviceName} numberOfLines={1}>
                      {serviceName}
                    </Text>
                    <Text style={styles.serviceDate} numberOfLines={1}>
                      {schedule}
                    </Text>
                  </View>
                </View>
              </Card>

              <Card variant="premium" style={styles.formCard}>
                <Text style={styles.heading}>{copy.reviewHeading}</Text>

                <View style={styles.starsWrap}>
                  <RatingStars value={stars} onChange={setStars} size={40} />
                </View>
                <Text style={[styles.starLabel, !rated && styles.starLabelMuted]}>
                  {rated ? STAR_LABELS[stars] : 'Select a rating'}
                </Text>

                {rated ? (
                  <View style={styles.detailsBlock}>
                    <View style={styles.divider} />
                    <Text style={styles.sectionLabel}>{copy.reviewTagsTitle}</Text>
                    <View style={styles.tags}>
                      {TAGS.map((tag) => (
                        <Chip
                          key={tag}
                          label={tag}
                          selected={tags.includes(tag)}
                          onPress={() => toggleTag(tag)}
                        />
                      ))}
                    </View>

                    <Input
                      label={copy.reviewNoteLabel}
                      value={comment}
                      onChangeText={setComment}
                      multiline
                      placeholder="Optional"
                      containerStyle={styles.commentInput}
                    />
                  </View>
                ) : null}
              </Card>
            </FadeSlideIn>
          </ScrollView>
        </KeyboardAvoidingView>

        <StickyActionBar>
          <Button
            title={rated ? 'Submit Review' : 'Select rating'}
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
  root: { flex: 1, backgroundColor: ui.surfaceMuted },
  safe: { flex: 1, backgroundColor: 'transparent' },
  flex: { flex: 1 },
  container: { padding: spacing.md, paddingBottom: 120, gap: spacing.sm },
  serviceCard: { padding: 0, overflow: 'hidden', marginBottom: spacing.xs },
  serviceStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  serviceIcon: {
    width: 44,
    height: 44,
    borderRadius: premium.radiusCard,
    backgroundColor: ui.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceText: { flex: 1 },
  serviceName: { fontFamily: fonts.display, fontSize: 15, color: ui.text },
  serviceDate: { fontFamily: fonts.body, fontSize: 12, color: ui.textSecondary, marginTop: 2 },
  formCard: { padding: spacing.lg, paddingTop: spacing.md + 4, overflow: 'hidden' },
  heading: {
    fontFamily: fonts.displayExtra,
    fontSize: 20,
    textAlign: 'center',
    color: ui.text,
    marginTop: spacing.sm,
  },
  starsWrap: { alignItems: 'center', marginTop: spacing.lg },
  starLabel: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: ui.brand,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  starLabelMuted: { color: ui.textSecondary, fontFamily: fonts.body },
  detailsBlock: { marginTop: spacing.md },
  divider: { height: 1, backgroundColor: ui.hairline, marginBottom: spacing.md },
  sectionLabel: {
    fontFamily: fonts.displaySemi,
    fontSize: 14,
    color: ui.text,
    marginBottom: spacing.sm,
  },
  tags: { flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.sm, marginBottom: spacing.xs },
  commentInput: { marginBottom: 0, marginTop: spacing.sm },
});
