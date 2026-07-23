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
import { fonts } from '@/constants/theme';
import { homeShadow } from '@/components/kit/homeUi';
import { DEFAULT_HOME_CONFIG } from '@/constants/homeContent';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';

const H_PAD = 20;
const SLIDE_W = Dimensions.get('window').width - H_PAD * 2;
const AUTO_MS = 4600;

type Slide = {
  key: string;
  title: string;
  cta: string;
  tone: 'green' | 'offer';
  code?: string;
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
  const ui = useCustomerUiCopy();
  const [idx, setIdx] = useState(0);
  const ref = useRef<ScrollView>(null);
  const holding = useRef(false);

  const offerOn = promo?.active !== false && Boolean(promo?.title?.trim());
  const code = homeConfig?.promoCodeHint?.trim() || DEFAULT_HOME_CONFIG.promoCodeHint!;
  const bookTitle = homeConfig?.bookSlideTitle?.trim() || DEFAULT_HOME_CONFIG.bookSlideTitle!;
  const bookCta = homeConfig?.bookSlideCta?.trim() || DEFAULT_HOME_CONFIG.bookSlideCta!;
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
            cta: promo?.ctaLabel?.trim() || 'Claim offer',
            tone: 'offer' as const,
            code,
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
          {slides.map((slide) => (
            <LinearGradient
              key={slide.key}
              colors={
                slide.tone === 'green'
                  ? ['#3CC85A', '#1B873E', '#053A16']
                  : ['#1B873E', '#0A6423', '#02180C']
              }
              locations={[0, 0.42, 1]}
              style={[styles.slide, { width: SLIDE_W }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.glowA} pointerEvents="none">
                <LinearGradient
                  colors={['rgba(200,255,150,0.35)', 'rgba(143,208,60,0.08)', 'rgba(143,208,60,0)']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0.2, y: 0.2 }}
                  end={{ x: 1, y: 1 }}
                />
              </View>
              <View style={styles.glowB} pointerEvents="none">
                <LinearGradient
                  colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0)']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
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
              <View style={styles.row}>
                <View style={styles.body}>
                  <Text style={styles.kicker}>
                    {slide.tone === 'offer' ? ui.homeCarouselOfferKicker : ui.homeCarouselBookKicker}
                  </Text>
                  <Text style={styles.title} numberOfLines={2}>
                    {slide.title}
                  </Text>
                  {slide.code ? (
                    <View style={slide.tone === 'offer' ? styles.codePill : styles.subPill}>
                      <Text style={slide.tone === 'offer' ? styles.codeText : styles.subText}>
                        {slide.code}
                      </Text>
                    </View>
                  ) : null}
                  <Pressable
                    style={({ pressed }) => [pressed && { transform: [{ scale: 0.96 }] }]}
                    onPress={slide.tone === 'green' ? onBook : onClaimOffer}
                  >
                    <LinearGradient
                      colors={['#FFFFFF', '#F2FAEE']}
                      style={styles.cta}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.ctaText}>{slide.cta}</Text>
                      <PremiumIcon
                        icon={AppIcons.ui.arrowRight}
                        variant="plain"
                        size={15}
                        color="#0A2E14"
                        strokeWidth={2.5}
                      />
                    </LinearGradient>
                  </Pressable>
                </View>
                <PremiumIcon
                  icon={slide.tone === 'offer' ? AppIcons.ui.percent : AppIcons.brand}
                  variant="glass"
                  size={34}
                  color="#FFFFFF"
                  strokeWidth={1.85}
                  boxSize={78}
                />
              </View>
            </LinearGradient>
          ))}
        </ScrollView>
      </View>
      <View style={styles.dots}>
        {slides.map((s, i) => (
          <View key={s.key} style={[styles.dot, i === idx && styles.dotOn]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 20, marginHorizontal: H_PAD },
  shell: {
    borderRadius: 28,
    overflow: 'hidden',
    ...homeShadow.promo,
  },
  slide: {
    minHeight: 158,
    paddingHorizontal: 20,
    paddingVertical: 22,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  glowA: {
    position: 'absolute',
    top: -60,
    right: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    overflow: 'hidden',
  },
  glowB: {
    position: 'absolute',
    bottom: -40,
    left: -40,
    width: 130,
    height: 130,
    borderRadius: 65,
    overflow: 'hidden',
  },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  row: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  body: { flex: 1, minWidth: 0, zIndex: 1, gap: 10 },
  kicker: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.9)',
  },
  title: {
    fontFamily: fonts.displayExtra,
    fontSize: 23,
    lineHeight: 28,
    letterSpacing: -0.65,
    color: '#FFFFFF',
  },
  codePill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.26)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  codeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 1.1,
    color: '#FFFFFF',
  },
  subPill: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
  },
  subText: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    letterSpacing: 0.1,
    color: 'rgba(255,255,255,0.88)',
  },
  cta: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  ctaText: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: '#0A2E14',
  },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(11,114,40,0.18)' },
  dotOn: { width: 20, backgroundColor: '#1A8734' },
});
