import { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import type { HomeConfig, HomePromo } from '@/types/api';
import { colors, fonts, gradients, ui } from '@/constants/theme';
import { ctaLabelText } from '@/components/kit/format';
import { DEFAULT_HOME_CONFIG } from '@/constants/homeContent';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { CouponArt, HomeShieldArt } from '@/components/illustrations/HomeArt';

const H_PAD = 16;
const SLIDE_W = Dimensions.get('window').width - H_PAD * 2;
const AUTO_MS = 4600;

type Slide = {
  key: string;
  title: string;
  cta: string;
  tone: 'green' | 'offer';
  code?: string;
  kicker?: string;
};

export function HomePromoCarousel({
  promo,
  homeConfig,
  onBook,
  onClaimOffer,
}: {
  brandName?: string;
  tagline?: string;
  promo?: HomePromo | null;
  homeConfig?: Pick<
    HomeConfig,
    'bookSlideTitle' | 'bookSlideCta' | 'bookSlideFallbackSub' | 'promoCodeHint'
  >;
  onBook: () => void;
  onClaimOffer: () => void;
}) {
  const copy = useCustomerUiCopy();
  const [idx, setIdx] = useState(0);
  const ref = useRef<ScrollView>(null);
  const holding = useRef(false);

  const offerOn = promo?.active === true && Boolean(promo?.title?.trim());
  const code = homeConfig?.promoCodeHint?.trim() || '';
  const bookTitle = homeConfig?.bookSlideTitle?.trim() || DEFAULT_HOME_CONFIG.bookSlideTitle!;
  const bookCta = ctaLabelText(homeConfig?.bookSlideCta) || DEFAULT_HOME_CONFIG.bookSlideCta!;
  const bookSub =
    homeConfig?.bookSlideFallbackSub?.trim() || DEFAULT_HOME_CONFIG.bookSlideFallbackSub!;

  const slides: Slide[] = [
    {
      key: 'book',
      title: bookTitle,
      cta: bookCta,
      tone: 'green',
      code: bookSub,
    },
    ...(offerOn
      ? [
          {
            key: 'offer',
            title: promo!.title!.trim(),
            cta: ctaLabelText(promo?.ctaLabel) || 'Claim offer',
            tone: 'offer' as const,
            code: code || undefined,
            kicker: promo?.badge?.trim() || undefined,
          },
        ]
      : []),
  ];

  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => {
      if (holding.current) return;
      setIdx((prev) => {
        const next = (prev + 1) % slides.length;
        ref.current?.scrollTo({ x: next * SLIDE_W, animated: true });
        return next;
      });
    }, AUTO_MS);
    return () => clearInterval(t);
  }, [slides.length]);

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const next = Math.round(e.nativeEvent.contentOffset.x / SLIDE_W);
    if (next !== idx && next >= 0 && next < slides.length) setIdx(next);
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.shell}>
        <ScrollView
          ref={ref}
          horizontal
          pagingEnabled
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          onScrollBeginDrag={() => {
            holding.current = true;
          }}
          onMomentumScrollEnd={() => {
            holding.current = false;
          }}
        >
          {slides.map((slide) => {
            const offer = slide.tone === 'offer';
            return (
              <LinearGradient
                key={slide.key}
                colors={offer ? [...gradients.offerDark] : [...gradients.header]}
                style={[styles.slide, { width: SLIDE_W }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.disc} pointerEvents="none" />
                <View style={styles.row}>
                  <View style={styles.body}>
                    <View style={styles.kickerPill}>
                      <Text style={styles.kicker} numberOfLines={1}>
                        {slide.kicker || (offer ? copy.homeCarouselOfferKicker : copy.homeCarouselBookKicker)}
                      </Text>
                    </View>
                    <Text style={styles.title} numberOfLines={2}>
                      {slide.title}
                    </Text>
                    {slide.code ? (
                      offer ? (
                        <View style={styles.codePill}>
                          <Text style={styles.codeText}>{slide.code}</Text>
                        </View>
                      ) : (
                        <Text style={styles.subText} numberOfLines={1}>
                          {slide.code}
                        </Text>
                      )
                    ) : null}
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={slide.cta}
                      style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
                      onPress={offer ? onClaimOffer : onBook}
                    >
                      <Text style={styles.ctaText}>{slide.cta}</Text>
                      <PremiumIcon icon={AppIcons.ui.arrowRight} variant="plain" size={15} color={ui.text} strokeWidth={2.5} fill="none" />
                    </Pressable>
                  </View>
                  <View style={styles.art} pointerEvents="none">
                    {offer ? <CouponArt size={106} /> : <HomeShieldArt size={106} />}
                  </View>
                </View>
              </LinearGradient>
            );
          })}
        </ScrollView>
      </View>
      {slides.length > 1 ? (
        <View style={styles.dots}>
          {slides.map((s, i) => (
            <View key={s.key} style={[styles.dot, i === idx && styles.dotOn]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginHorizontal: H_PAD },
  shell: {
    borderRadius: 22,
    overflow: 'hidden',
    ...ui.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 18,
  },
  slide: {
    minHeight: 172,
    paddingLeft: 20,
    paddingRight: 8,
    paddingVertical: 20,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  disc: {
    position: 'absolute',
    left: -60,
    bottom: -90,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  body: { flex: 1, minWidth: 0, gap: 8 },
  kickerPill: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  kicker: {
    fontFamily: fonts.bodyBold,
    fontSize: 10.5,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: colors.limeOnDark,
  },
  title: {
    fontFamily: fonts.displayExtra,
    fontSize: 21,
    lineHeight: 26,
    letterSpacing: -0.6,
    color: colors.white,
  },
  codePill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(185,229,138,0.7)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  codeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12.5,
    letterSpacing: 1.2,
    color: colors.limeOnDark,
  },
  subText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: 'rgba(255,255,255,0.82)',
  },
  cta: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: colors.white,
  },
  ctaPressed: { opacity: 0.85 },
  ctaText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13.5,
    color: ui.text,
  },
  art: {
    width: 100,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 5, marginTop: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: ui.border },
  dotOn: { width: 18, backgroundColor: ui.text },
});
