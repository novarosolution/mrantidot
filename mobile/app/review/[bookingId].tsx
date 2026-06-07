import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { BookingFactsCard } from '@/components/kit/BookingFactsCard';
import { CustomerPageHeader } from '@/components/kit/CustomerPageHeader';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { RatingStars } from '@/components/ui/RatingStars';
import { Card } from '@/components/ui/Card';
import { StickyActionBar } from '@/components/ui/StickyActionBar';
import { ListEmptyRetry } from '@/components/ui/ListEmptyRetry';
import { Spinner } from '@/components/ui/Spinner';
import { api, screenLoadConfig } from '@/lib/api';
import { useScreenLoad } from '@/lib/useScreenLoad';
import type { Booking } from '@/types/api';
import { colors, design, fonts, spacing } from '@/constants/theme';

const TAGS = ['On time', 'Professional', 'No smell', 'Thorough', 'Polite'];

export default function ReviewScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [stars, setStars] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { loading, error, runLoad } = useScreenLoad();

  const load = useCallback(async () => {
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
    if (stars < 1) {
      Toast.show({ type: 'error', text1: 'Please select a star rating' });
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/reviews', { bookingId, stars, tags, comment });
      Toast.show({ type: 'success', text1: 'Review submitted!' });
      router.replace('/(customer)/bookings');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Spinner fullScreen />;

  if (error || !booking) {
    return (
      <SafeAreaView style={styles.safe} edges={['left', 'right']}>
        <CustomerPageHeader variant="premium" title="Rate & Review" showBack />
        <ListEmptyRetry message={error ?? 'Booking not found'} onRetry={() => void runLoad(load)} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <CustomerPageHeader variant="premium" title="Rate & Review" showBack />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="always">
        <BookingFactsCard
          booking={booking}
          audience="customer"
          showTechnician={false}
          showPayment={false}
          showPhotos={false}
        />
        <Card variant="premium" style={styles.heroCard}>
          <Text style={styles.q}>How was the service?</Text>
          <View style={styles.starsWrap}>
            <RatingStars value={stars} onChange={setStars} size={44} />
          </View>
        </Card>
        <Text style={styles.tagTitle}>What went well?</Text>
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
        <Input label="Share details" value={comment} onChangeText={setComment} multiline />
        <Text style={styles.trust}>Your feedback helps us improve every visit.</Text>
      </ScrollView>
      <StickyActionBar>
        <Button
          title="Submit Review"
          variant="premium"
          onPress={submit}
          loading={submitting}
          disabled={stars < 1}
        />
      </StickyActionBar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: design.screenBg },
  trust: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: spacing.sm },
  container: { padding: spacing.md, paddingBottom: 120, gap: spacing.md },
  heroCard: { alignItems: 'center', paddingVertical: spacing.lg },
  q: { fontFamily: fonts.displayExtra, fontSize: 20, textAlign: 'center', color: colors.ink },
  starsWrap: { alignItems: 'center', marginTop: spacing.lg },
  tagTitle: { ...design.sectionTitle, marginTop: spacing.sm, marginBottom: spacing.sm },
  tags: { flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.sm, marginBottom: spacing.md },
  submit: { marginTop: spacing.md },
});
