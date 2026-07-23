import { useMemo } from 'react';
import { useAppContent } from '@/context/AppContentContext';
import { fillBrand, getCustomerUiCopy } from '@/constants/customerUiCopy';
import type { CustomerUiCopy } from '@/types/api';

export function useCustomerUiCopy(): CustomerUiCopy {
  const { content } = useAppContent();
  return useMemo(() => getCustomerUiCopy(content.customerUi), [content.customerUi]);
}

export function useBrandFill() {
  const { content } = useAppContent();
  const brand = content.branding.name?.trim() || 'Mr Antidot';
  return useMemo(
    () => ({
      brand,
      fill: (template: string) => fillBrand(template, brand),
    }),
    [brand],
  );
}
