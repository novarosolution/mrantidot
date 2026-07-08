import { Dimensions } from 'react-native';
import { spacing } from '@/constants/theme';

/** Exact cell width for admin 2- or 3-column grids (accounts for gap + page padding). */
export function adminGridCellWidth(cols: number, gap = 10, pagePad = spacing.md) {
  const inner = Dimensions.get('window').width - pagePad * 2 - gap * (cols - 1);
  return inner / cols;
}

export const ADMIN_KPI_COLS = 2;
export const ADMIN_QUICK_COLS = 3;
