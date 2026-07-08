import { type ReactNode } from 'react';
import { CustomerPageHeader } from './CustomerPageHeader';
import { ADMIN_TEAM } from '@/lib/routes';

/** Back + title header for admin stack screens. */
export function AdminLightHeader(props: {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: ReactNode;
  backFallback?: string;
  onBack?: () => void;
}) {
  const { showBack = true, backFallback = ADMIN_TEAM, ...rest } = props;
  return (
    <CustomerPageHeader
      variant="premium"
      showBack={showBack}
      backFallback={backFallback}
      {...rest}
    />
  );
}
