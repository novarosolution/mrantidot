import { type ViewStyle } from 'react-native';

/** Premium depth tokens for home surfaces. */
export const homeShadow = {
  search: {
    shadowColor: '#03170B',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  } satisfies ViewStyle,
  promo: {
    shadowColor: '#02180C',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 14,
  } satisfies ViewStyle,
  soft: {
    shadowColor: '#03170B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
  } satisfies ViewStyle,
  card: {
    shadowColor: '#03170B',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 8,
  } satisfies ViewStyle,
  popular: {
    shadowColor: '#02180C',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.32,
    shadowRadius: 26,
    elevation: 14,
  } satisfies ViewStyle,
  tile: {
    shadowColor: '#03170B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 7,
  } satisfies ViewStyle,
};

/** Admin aliases — same depth language as customer home. */
export const adminShadow = {
  soft: homeShadow.soft,
  card: homeShadow.card,
  tile: homeShadow.tile,
  hero: {
    shadowColor: '#02180C',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.22,
    shadowRadius: 22,
    elevation: 10,
  } satisfies ViewStyle,
};
