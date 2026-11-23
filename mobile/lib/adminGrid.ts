import { Dimensions, useWindowDimensions } from 'react-native';
import { spacing } from '@/constants/theme';
import { adminContentWidth, IS_WEB, useSidebarCollapsed, WEB_WIDE_MIN_WIDTH } from '@/lib/webAdmin';

export const ADMIN_KPI_COLS = 2;
export const ADMIN_QUICK_COLS = 3;
/** KPI tiles per row on a desktop-width browser window (ADMIN_KPI_COLS on phones). */
export const ADMIN_KPI_COLS_WIDE = 4;

/**
 * Columns for a grid designed with `cols` columns on a phone: a desktop-width browser window shows the
 * 2-up KPI grids 4-up; every other count (3- and 4-up quick grids) is unchanged. Native: always `cols`.
 */
export function adminGridCols(cols: number, windowWidth: number = Dimensions.get('window').width): number {
  if (!IS_WEB || windowWidth < WEB_WIDE_MIN_WIDTH) return cols;
  return cols === ADMIN_KPI_COLS ? ADMIN_KPI_COLS_WIDE : cols;
}

function cellWidth(windowWidth: number, cols: number, gap: number, pagePad: number): number {
  const count = adminGridCols(cols, windowWidth);
  // adminContentWidth: the desktop web column is narrower than the window (native: window width).
  const inner = adminContentWidth(windowWidth) - pagePad * 2 - gap * (count - 1);
  return inner / count;
}

/**
 * Exact cell width for admin 2- or 3-column grids (accounts for gap + page padding), measured when called.
 * In components prefer `useAdminGridCellWidth` — it re-measures on window resize and sidebar collapse.
 */
export function adminGridCellWidth(cols: number, gap = 10, pagePad = spacing.md) {
  return cellWidth(Dimensions.get('window').width, cols, gap, pagePad);
}

/** `adminGridCellWidth` as a hook: follows window resizes and the desktop sidebar collapsing. */
export function useAdminGridCellWidth(cols: number, gap = 10, pagePad = spacing.md): number {
  const { width } = useWindowDimensions();
  useSidebarCollapsed();
  return cellWidth(width, cols, gap, pagePad);
}
