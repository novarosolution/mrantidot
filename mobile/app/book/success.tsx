import { useLocalSearchParams } from 'expo-router';
import { BookingSuccessScreen } from '@/components/kit/BookingSuccessScreen';
import { Spinner } from '@/components/ui/Spinner';

export default function BookSuccessRoute() {
  const params = useLocalSearchParams<{
    bookingId?: string;
    serviceName?: string;
    schedule?: string;
    total?: string;
    payment?: string;
  }>();

  const bookingId = params.bookingId?.trim();
  const serviceName = params.serviceName?.trim() || 'Service';
  const schedule = params.schedule?.trim() || '—';
  const total = Number(params.total ?? 0);
  const paymentLabel = params.payment?.trim() || undefined;

  if (!bookingId) return <Spinner fullScreen />;

  return (
    <BookingSuccessScreen
      bookingId={bookingId}
      serviceName={serviceName}
      schedule={schedule}
      total={Number.isFinite(total) ? total : 0}
      paymentLabel={paymentLabel}
    />
  );
}
