import { type ReactNode } from 'react';
import { ListEmptyRetry } from './ListEmptyRetry';
import { Spinner } from './Spinner';

export function ScreenState({
  loading,
  error,
  onRetry,
  title,
  loadingLabel,
  /** When true, use inline spinner (for use inside shells that already have a header). */
  embedded,
  skeleton,
  children,
}: {
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  title?: string;
  loadingLabel?: string;
  embedded?: boolean;
  /** Content-shaped placeholder shown instead of the spinner while loading. */
  skeleton?: ReactNode;
  children: ReactNode;
}) {
  if (loading) return skeleton ? <>{skeleton}</> : <Spinner fullScreen={!embedded} label={loadingLabel} />;
  if (error) {
    return <ListEmptyRetry title={title} message={error} onRetry={onRetry} />;
  }
  return <>{children}</>;
}
