import { type ReactNode } from 'react';
import { CustomerPageHeader } from './CustomerPageHeader';

/** Back + title header for admin stack screens. */
export function AdminLightHeader(props: {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: ReactNode;
}) {
  const { showBack = true, ...rest } = props;
  return <CustomerPageHeader variant="premium" showBack={showBack} {...rest} />;
}
