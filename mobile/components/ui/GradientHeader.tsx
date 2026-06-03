/**
 * @deprecated Use CustomerPageHeader variant="premium" instead.
 */
import { CustomerPageHeader } from '@/components/kit/CustomerPageHeader';

export function GradientHeader({
  title,
  subtitle,
  showLogo: _showLogo,
  right,
}: {
  title: string;
  subtitle?: string;
  showLogo?: boolean;
  right?: React.ReactNode;
}) {
  return (
    <CustomerPageHeader
      variant="premium"
      title={title}
      subtitle={subtitle}
      rightAction={right}
    />
  );
}
