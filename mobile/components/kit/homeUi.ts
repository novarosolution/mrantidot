import { colors } from '@/constants/theme';
import { type ViewStyle } from 'react-native';

/** Premium depth tokens for home surfaces. */
export const homeShadow = {
  search: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  } satisfies ViewStyle,
  promo: {
    shadowColor: colors.deep,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 14,
  } satisfies ViewStyle,
  soft: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
  } satisfies ViewStyle,
  card: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 8,
  } satisfies ViewStyle,
  popular: {
    shadowColor: colors.deep,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.32,
    shadowRadius: 26,
    elevation: 14,
  } satisfies ViewStyle,
  tile: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 7,
  } satisfies ViewStyle,
};

/** Admin aliases — same depth language as customer home. */
/** Admin + technician cards — one quiet depth, matching the white customer theme. */
export const adminShadow = {
  soft: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 1,
  } satisfies ViewStyle,
  card: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  } satisfies ViewStyle,
  tile: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 1,
  } satisfies ViewStyle,
  hero: {
    shadowColor: colors.deep,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6,
  } satisfies ViewStyle,
};
