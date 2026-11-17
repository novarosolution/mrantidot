import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, TextInput, View, type LayoutChangeEvent } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { TEXT_INPUT_FONT_SIZE, textInputDefaults } from '@/components/ui/textInputDefaults';
import { colors, fonts, ui } from '@/constants/theme';

const ROTATE_MS = 2600;
/** Solid band behind the search pill (and the status strip) when the bar is stuck to the top. */
export const SEARCH_BAND = '#F2F3F2';

/**
 * Sticky search pill. While empty it cycles "Search for '…'" through real service names;
 * the hint is an overlay so the TextInput stays a plain input. Resting it floats on the header;
 * stuck to the top it sits on a solid light-grey band with a hairline.
 */
export function HomeSearchBar({
  query,
  onChangeQuery,
  onSubmit,
  hints,
  fallbackPlaceholder,
  dividerOpacity,
  background,
  onLayout,
}: {
  query: string;
  onChangeQuery: (v: string) => void;
  onSubmit: () => void;
  /** Service names to rotate through; falls back to the CMS placeholder when empty. */
  hints: string[];
  fallbackPlaceholder: string;
  /** 0 → 1 as the bar sticks to the top; draws the bottom hairline. */
  dividerOpacity?: Animated.AnimatedInterpolation<number> | number;
  /** Strip colour behind the field — match the header so the top reads as one block. */
  background?: string;
  onLayout?: (e: LayoutChangeEvent) => void;
}) {
  const [focused, setFocused] = useState(false);
  const [hintIdx, setHintIdx] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;
  const focusAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: focused ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [focusAnim, focused]);
  const showHint = query.length === 0;
  const rotating = showHint && !focused && hints.length > 1;

  useEffect(() => {
    if (!rotating) return;
    const t = setInterval(() => {
      Animated.timing(fade, { toValue: 0, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(
        () => {
          setHintIdx((i) => (i + 1) % hints.length);
          Animated.timing(fade, { toValue: 1, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
        },
      );
    }, ROTATE_MS);
    return () => clearInterval(t);
  }, [fade, hints.length, rotating]);

  const hint = hints.length > 0 ? hints[hintIdx % hints.length] : null;
  const restOpacity =
    typeof dividerOpacity === 'number'
      ? 1 - dividerOpacity
      : dividerOpacity
        ? dividerOpacity.interpolate({ inputRange: [0, 1], outputRange: [1, 0] })
        : 1;

  return (
    <View style={styles.wrap} onLayout={onLayout}>
      {/* Resting: blends into the header colour. Stuck to the top: solid light-grey band. */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { backgroundColor: background ?? colors.white, opacity: restOpacity }]}
        pointerEvents="none"
      />
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.band, { opacity: dividerOpacity ?? 0 }]}
        pointerEvents="none"
      />
      <Animated.View
        style={[
          styles.field,
          {
            borderColor: focusAnim.interpolate({ inputRange: [0, 1], outputRange: ['rgba(17,26,21,0.08)', ui.brand] }),
          },
        ]}
      >
        <Search size={22} color={focused ? ui.brand : ui.text} strokeWidth={1.8} />
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            {...textInputDefaults}
            value={query}
            onChangeText={onChangeQuery}
            onSubmitEditing={onSubmit}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            returnKeyType="search"
            autoCapitalize="none"
            accessibilityLabel={hint ? `Search for ${hint}` : fallbackPlaceholder}
            multiline={false}
          />
          {showHint ? (
            <View style={styles.hintRow} pointerEvents="none">
              {hint ? (
                <>
                  <Text style={styles.hint}>Search for </Text>
                  <Animated.Text
                    style={[
                      styles.hintAccent,
                      styles.hintFlex,
                      {
                        opacity: fade,
                        transform: [{ translateY: fade.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }],
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {`'${hint}'`}
                  </Animated.Text>
                </>
              ) : (
                <Text style={[styles.hint, styles.hintFlex]} numberOfLines={1}>
                  {fallbackPlaceholder}
                </Text>
              )}
            </View>
          ) : null}
        </View>
        {query.length > 0 ? (
          <Pressable
            style={styles.clear}
            onPress={() => onChangeQuery('')}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
          >
            <X size={13} color={colors.white} strokeWidth={2.6} />
          </Pressable>
        ) : null}
      </Animated.View>
      <Animated.View style={[styles.divider, { opacity: dividerOpacity ?? 0 }]} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 46,
    paddingLeft: 16,
    paddingRight: 12,
    borderRadius: 23,
    backgroundColor: colors.white,
    borderWidth: 1,
  },
  /** Light-grey strip the pill sits on once the bar sticks. */
  band: { backgroundColor: SEARCH_BAND },
  inputWrap: { flex: 1, justifyContent: 'center', height: '100%' },
  input: {
    ...(Platform.OS === 'android' ? { fontFamily: fonts.bodyMedium } : {}),
    fontSize: TEXT_INPUT_FONT_SIZE,
    color: ui.text,
    paddingVertical: 0,
    height: '100%',
  },
  hintRow: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
    alignItems: 'center',
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: ui.textSecondary,
  },
  hintAccent: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: ui.textSecondary,
  },
  hintFlex: { flexShrink: 1 },
  clear: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: ui.textTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(17,26,21,0.1)',
  },
});
