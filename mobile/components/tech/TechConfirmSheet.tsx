import { type ReactNode } from 'react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';

/**
 * Two-choice confirmation as a bottom sheet (replaces native alerts on technician screens):
 * the confirming action on top, a quiet cancel underneath. While `loading` the sheet can't be dismissed.
 */
export function TechConfirmSheet({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive = false,
  loading = false,
  onConfirm,
  onClose,
  children = null,
}: {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel: string;
  /** Red confirm button (sign out, mark absent, cancel a request). */
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  children?: ReactNode;
}) {
  const close = () => {
    if (!loading) onClose();
  };
  return (
    <BottomSheet
      visible={visible}
      onClose={close}
      title={title}
      hint={message}
      footer={
        <>
          <Button
            title={confirmLabel}
            variant={destructive ? 'danger' : 'premium'}
            loading={loading}
            onPress={onConfirm}
          />
          <Button title={cancelLabel} variant="ghost" disabled={loading} onPress={close} />
        </>
      }
    >
      {children}
    </BottomSheet>
  );
}
