import { Redirect, useLocalSearchParams } from 'expo-router';
import { BookingSuccessScreen } from '@/components/kit/BookingSuccessScreen';
import { customerRoutes, appHref } from '@/lib/routes';

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

  if (!bookingId) return <Redirect href={appHref(customerRoutes.bookings)} />;

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
