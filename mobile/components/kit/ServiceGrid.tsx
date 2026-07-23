import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PremiumIcon, IconStroke } from '@/components/kit/PremiumIcon';
import { GlassPanel } from '@/components/kit/GlassScreenKit';
import { AppIcons } from '@/constants/appIcons';
import { ServiceIcon } from '@/components/ServiceIcon';
import type { Service } from '@/types/api';
import { serviceDisplayRating } from '@/lib/ratings';
import { colors, fonts } from '@/constants/theme';
import { homeShadow } from '@/components/kit/homeUi';

const COLS = 2;
const GAP = 12;
const H_PAD = 20;

function cardWidth() {
  return (Dimensions.get('window').width - H_PAD * 2 - GAP * (COLS - 1)) / COLS;
}

export function ServiceGrid({
  services,
  onPressItem,
  limit = 4,
}: {
  services: Service[];
  onPressItem?: (service: Service) => void;
  limit?: number;
}) {
  const items = services.slice(0, limit);
  const width = cardWidth();

  return (
    <View style={styles.grid}>
      {items.map((s) => {
        const rating = serviceDisplayRating(s);
        return (
          <Pressable
            key={s.id}
            style={({ pressed }) => [{ width }, pressed && styles.pressed]}
            onPress={() => onPressItem?.(s)}
          >
            <GlassPanel style={styles.card} padded={false} tone="clear" intensity={40}>
              <View style={styles.inner}>
                <View style={styles.top}>
                  <ServiceIcon iconKey={s.iconKey} size={22} variant="premium" boxSize={52} color="#0B7228" />
                  {rating > 0 ? (
                    <View style={styles.rating}>
                      <PremiumIcon icon={AppIcons.ui.star} variant="plain" size={10} color="#25A443" fill="#25A443" />
                      <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
                    </View>
                  ) : null}
                </View>

                <Text style={styles.name} numberOfLines={2}>
                  {s.name}
                </Text>

                <View style={styles.footer}>
                  <Text style={styles.price}>₹{s.basePrice}</Text>
                  <LinearGradient colors={['#30B84F', '#0A6423']} style={styles.arrow}>
                    <PremiumIcon
                      icon={AppIcons.ui.arrowRight}
                      variant="plain"
                      size={14}
                      color="#FFFFFF"
                      strokeWidth={IconStroke.bold}
                    />
                  </LinearGradient>
                </View>
              </View>
            </GlassPanel>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: H_PAD,
    marginTop: 14,
    gap: GAP,
  },
  card: {
    borderRadius: 24,
    ...homeShadow.card,
  },
  inner: { padding: 15, gap: 12 },
  pressed: { transform: [{ scale: 0.97 }] },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(242,250,238,0.98)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(219,241,209,0.98)',
  },
  ratingText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.forest },
  name: {
    fontFamily: fonts.displayExtra,
    fontSize: 15,
    lineHeight: 19,
    letterSpacing: -0.2,
    color: colors.ink,
    minHeight: 38,
  },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  price: { fontFamily: fonts.displayExtra, fontSize: 17, color: colors.forest },
  arrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#04150A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
});
