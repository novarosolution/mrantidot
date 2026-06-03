import { type ReactNode } from 'react';
import { ListEmptyRetry } from './ListEmptyRetry';
import { Spinner } from './Spinner';

export function ScreenState({
  loading,
  error,
  onRetry,
  title,
  children,
}: {
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  title?: string;
  children: ReactNode;
}) {
  if (loading) return <Spinner fullScreen />;
  if (error) {
    return <ListEmptyRetry title={title} message={error} onRetry={onRetry} />;
  }
  return <>{children}</>;
}
