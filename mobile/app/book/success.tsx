import { Redirect, useLocalSearchParams } from 'expo-router';
import { BookingSuccessScreen } from '@/components/kit/BookingSuccessScreen';
import { paramString } from '@/lib/routeParams';
import { customerRoutes, appHref } from '@/lib/routes';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';

export default function BookSuccessRoute() {
  const copy = useCustomerUiCopy();
  const params = useLocalSearchParams<{
    bookingId?: string | string[];
    serviceName?: string | string[];
    schedule?: string | string[];
    total?: string | string[];
    payment?: string | string[];
    forName?: string | string[];
  }>();

  const bookingId = paramString(params.bookingId)?.trim();
  const serviceName = paramString(params.serviceName)?.trim() || copy.bookingServiceFallback;
  const schedule = paramString(params.schedule)?.trim() || copy.bookingScheduleTbd;
  const total = Number(paramString(params.total) ?? 0);
  const paymentLabel = paramString(params.payment)?.trim() || undefined;
  const forName = paramString(params.forName)?.trim() || undefined;

  if (!bookingId) return <Redirect href={appHref(customerRoutes.bookings)} />;

  return (
    <BookingSuccessScreen
      bookingId={bookingId}
      serviceName={serviceName}
      schedule={schedule}
      total={Number.isFinite(total) ? total : 0}
      paymentLabel={paymentLabel}
      forName={forName}
    />
  );
}
