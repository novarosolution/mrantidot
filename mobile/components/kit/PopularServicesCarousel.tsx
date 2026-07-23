import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { ServiceIcon } from '@/components/ServiceIcon';
import { GlassPanel } from '@/components/kit/GlassScreenKit';
import { HomeSectionTitle } from '@/components/kit/HomeSectionTitle';
import { serviceDisplayRating } from '@/lib/ratings';
import type { Service } from '@/types/api';
import { colors, fonts } from '@/constants/theme';
import { homeShadow } from '@/components/kit/homeUi';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';

const CARD_W = 256;

export function PopularServicesCarousel({
  title,
  onAction,
  services,
  onPressItem,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  services: Service[];
  onPressItem: (service: Service) => void;
}) {
  const ui = useCustomerUiCopy();
  const items = services.slice(0, 6);
  if (items.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <HomeSectionTitle title={title} onAction={onAction} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={CARD_W + 12}
        snapToAlignment="start"
        contentContainerStyle={styles.row}
      >
        {items.map((s, index) => {
          const rating = serviceDisplayRating(s);
          const featured = index === 0;
          return (
            <Pressable
              key={s.id}
              onPress={() => onPressItem(s)}
              style={({ pressed }) => [pressed && { opacity: 0.96, transform: [{ scale: 0.985 }] }]}
            >
              {featured ? (
                <View style={styles.cardFeaturedShell}>
                  <LinearGradient
                    colors={['#27A747', '#0A6423', '#043813']}
                    style={styles.cardFeatured}
                    start={{ x: 0.05, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.orb} pointerEvents="none">
                      <LinearGradient
                        colors={['rgba(184,232,106,0.42)', 'rgba(143,208,60,0)']}
                        style={StyleSheet.absoluteFill}
                        start={{ x: 0.2, y: 0.2 }}
                        end={{ x: 1, y: 1 }}
                      />
                    </View>
                    <LinearGradient
                      colors={['rgba(255,255,255,0.22)', 'rgba(255,255,255,0)']}
                      style={styles.sheen}
                      start={{ x: 0.5, y: 0 }}
                      end={{ x: 0.5, y: 1 }}
                      pointerEvents="none"
                    />
                    <View style={styles.featuredRim} pointerEvents="none" />
                    <View style={styles.eyebrowPill}>
                      <Text style={styles.eyebrow}>{ui.homePopularBadge}</Text>
                    </View>
                    <View style={styles.main}>
                      <ServiceIcon
                        iconKey={s.iconKey}
                        size={22}
                        variant="premium"
                        boxSize={52}
                        color="#FFFFFF"
                      />
                      <View style={styles.info}>
                        <Text style={styles.nameFeatured} numberOfLines={2}>
                          {s.name}
                        </Text>
                        {rating > 0 ? (
                          <View style={styles.meta}>
                            <PremiumIcon icon={AppIcons.ui.star} variant="plain" size={12} color="#FFE08A" fill="#FFE08A" />
                            <Text style={styles.metaFeatured}>{rating.toFixed(1)}</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                    <View style={styles.footer}>
                      <Text style={styles.priceFeatured}>₹{s.basePrice}</Text>
                      <View style={styles.ctaLight}>
                        <Text style={styles.ctaLightText}>Book</Text>
                        <PremiumIcon icon={AppIcons.ui.arrowRight} variant="plain" size={13} color="#0A6423" strokeWidth={2.6} />
                      </View>
                    </View>
                  </LinearGradient>
                </View>
              ) : (
                <GlassPanel style={styles.card} padded={false} tone="clear" intensity={40}>
                  <View style={styles.cardInner}>
                    <View style={styles.main}>
                      <ServiceIcon iconKey={s.iconKey} size={22} variant="premium" boxSize={52} color="#0B7228" />
                      <View style={styles.info}>
                        <Text style={styles.name} numberOfLines={2}>
                          {s.name}
                        </Text>
                        {rating > 0 ? (
                          <View style={styles.meta}>
                            <PremiumIcon icon={AppIcons.ui.star} variant="plain" size={11} color="#1A8734" fill="#1A8734" />
                            <Text style={styles.metaText}>{rating.toFixed(1)}</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                    <View style={styles.footer}>
                      <Text style={styles.price}>₹{s.basePrice}</Text>
                      <LinearGradient colors={['#30B84F', '#1A8734']} style={styles.cta} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                        <Text style={styles.ctaText}>Book</Text>
                        <PremiumIcon icon={AppIcons.ui.arrowRight} variant="plain" size={13} color="#FFFFFF" strokeWidth={2.6} />
                      </LinearGradient>
                    </View>
                  </View>
                </GlassPanel>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingTop: 28 },
  row: { paddingHorizontal: 20, paddingTop: 14, gap: 12, paddingBottom: 6 },
  /** Shadow lives on the shell — overflow:hidden on the gradient would clip it. */
  cardFeaturedShell: {
    width: CARD_W,
    borderRadius: 26,
    ...homeShadow.popular,
  },
  cardFeatured: {
    borderRadius: 26,
    padding: 16,
    overflow: 'hidden',
  },
  featuredRim: {
    ...StyleSheet.absoluteFill,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  card: {
    width: CARD_W,
    borderRadius: 26,
    ...homeShadow.card,
  },
  cardInner: { padding: 16 },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '48%',
  },
  orb: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: 'hidden',
  },
  eyebrowPill: {
    alignSelf: 'flex-start',
    marginBottom: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.32)',
  },
  eyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: '#FFFFFF',
  },
  main: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  info: { flex: 1, minWidth: 0 },
  nameFeatured: {
    fontFamily: fonts.displayExtra,
    fontSize: 15.5,
    lineHeight: 20,
    color: '#FFFFFF',
  },
  name: {
    fontFamily: fonts.displayExtra,
    fontSize: 15.5,
    lineHeight: 20,
    color: colors.ink,
  },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  metaFeatured: { fontFamily: fonts.bodyBold, fontSize: 12.5, color: '#FFFFFF' },
  metaText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.muted },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
  },
  priceFeatured: {
    fontFamily: fonts.displayExtra,
    fontSize: 20,
    color: '#FFFFFF',
  },
  price: {
    fontFamily: fonts.displayExtra,
    fontSize: 20,
    color: colors.forest,
  },
  ctaLight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 9,
    shadowColor: '#02180C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaLightText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.forest,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  ctaText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: '#FFFFFF',
  },
});
