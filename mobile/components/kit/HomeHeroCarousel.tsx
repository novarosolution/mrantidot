import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type ImageSourcePropType,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { ctaLabelText } from '@/components/kit/format';
import { SERVICE_TYPE_IMAGES } from '@/constants/serviceImages';
import { useAmbientInterval, useAmbientLoop } from '@/lib/a11yPrefs';
import type { HomePromo } from '@/types/api';
import { colors, fonts } from '@/constants/theme';

export type HeroSlide = {
  key: string;
  /** Small line above the title — the service line ("Pest control at home"). */
  kicker: string;
  title: string;
  cta: string;
  art: ImageSourcePropType;
  onPress: () => void;
};

const AUTO_MS = 4800;
export const HERO_SLIDE_H = 184;

/**
 * The admin-curated home promo as a hero slide. The home carousel and the admin live preview both build
 * it here, so what the admin sees is what shoppers get. The promo's badge is the kicker (falling back to
 * the service line), and a typed "→" is dropped because the slide draws its own arrow.
 * Returns null while the promo is off or has no headline.
 */
export function promoHeroSlide(
  promo: HomePromo | null | undefined,
  copy: { homeHeroKicker: string; homeHeroCta: string },
  onPress: () => void,
): HeroSlide | null {
  const title = promo?.title?.trim();
  if (!promo?.active || !title) return null;
  return {
    key: 'promo',
    kicker: promo.badge?.trim() || copy.homeHeroKicker,
    title,
    cta: ctaLabelText(promo.ctaLabel) || ctaLabelText(copy.homeHeroCta),
    art: SERVICE_TYPE_IMAGES.general,
    onPress,
  };
}

/**
 * Promo carousel that closes the green home header: kicker, a bold line, "Book now →" on the left and
 * large art on the right. Pages with a swipe, advances on its own, and shows pager dashes bottom-right.
 * Slides span the window unless `width` says otherwise (the admin preview sits inside a card).
 */
export function HomeHeroCarousel({ slides, width: widthProp }: { slides: HeroSlide[]; width?: number }) {
  const { width: windowWidth } = useWindowDimensions();
  const width = widthProp ?? windowWidth;
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);
  const dragging = useRef(false);
  const scrollRef = useRef<ScrollView>(null);
  const float = useRef(new Animated.Value(0)).current;
  const count = slides.length;

  // Art bob + auto-advance run only while Home is on screen (and never with Reduce Motion).
  useAmbientLoop(
    () =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(float, { toValue: 1, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(float, { toValue: 0, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      ),
    [float],
  );

  // Slides can change length (offer arrives, catalogue loads) — keep the page in range.
  useEffect(() => {
    if (indexRef.current >= count) {
      indexRef.current = 0;
      setIndex(0);
      scrollRef.current?.scrollTo({ x: 0, animated: false });
    }
  }, [count]);

  useAmbientInterval(
    () => {
      if (dragging.current || count < 2) return;
      const next = (indexRef.current + 1) % count;
      indexRef.current = next;
      setIndex(next);
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
    },
    AUTO_MS,
    count > 1,
  );

  const artLift = useMemo(() => float.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }), [float]);

  function onScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    indexRef.current = i;
    setIndex(i);
    dragging.current = false;
  }

  if (count === 0) return null;

  return (
    <View style={styles.wrap}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={count > 1}
        onScrollBeginDrag={() => {
          dragging.current = true;
        }}
        onMomentumScrollEnd={onScrollEnd}
        onScrollEndDrag={(e) => {
          // A slow drag that doesn't page never fires momentum-end — resume auto-advance anyway.
          if (e.nativeEvent.velocity?.x === 0) dragging.current = false;
        }}
        scrollEventThrottle={16}
        nestedScrollEnabled
      >
        {slides.map((s) => (
          <Pressable
            key={s.key}
            style={({ pressed }) => [{ width }, styles.slide, pressed && styles.pressed]}
            onPress={s.onPress}
            accessibilityRole="button"
            accessibilityLabel={`${s.kicker}. ${s.title}. ${s.cta}`}
          >
            <View style={styles.text}>
              {/* Admin badges can be long ("MR ANTIDOT · TRUSTED SERVICE") — wrap rather than clip. */}
              <Text style={styles.kicker} numberOfLines={2}>
                {s.kicker}
              </Text>
              <Text style={styles.title} numberOfLines={3}>
                {s.title}
              </Text>
              <View style={styles.cta}>
                <Text style={styles.ctaText}>{s.cta}</Text>
                <ArrowRight size={18} color={colors.white} strokeWidth={2.2} />
              </View>
            </View>
            <Animated.Image
              source={s.art}
              style={[
                styles.art,
                { transform: [{ translateY: artLift }] },
              ]}
              resizeMode="contain"
            />
          </Pressable>
        ))}
      </ScrollView>

      {count > 1 ? (
        <View style={styles.dots} pointerEvents="none">
          {slides.map((s, i) => (
            <View key={s.key} style={[styles.dot, i === index && styles.dotOn]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  /** Clips the art at the header's rounded bottom edge. */
  wrap: { height: HERO_SLIDE_H, overflow: 'hidden', borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  slide: { height: HERO_SLIDE_H, paddingHorizontal: 16, justifyContent: 'center' },
  pressed: { opacity: 0.94 },
  text: { width: '58%', paddingBottom: 14 },
  kicker: { fontFamily: fonts.body, fontSize: 15, lineHeight: 20, color: 'rgba(255,255,255,0.92)' },
  title: {
    marginTop: 3,
    fontFamily: fonts.displaySemi,
    fontSize: 21,
    lineHeight: 27,
    letterSpacing: -0.4,
    color: colors.white,
  },
  cta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  ctaText: { fontFamily: fonts.bodySemi, fontSize: 16, color: colors.white },
  art: { position: 'absolute', right: 6, bottom: -4, width: 176, height: 176 },
  dots: { position: 'absolute', right: 18, bottom: 12, flexDirection: 'row', gap: 4 },
  dot: { width: 16, height: 3.5, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotOn: { width: 22, backgroundColor: colors.white },
});
