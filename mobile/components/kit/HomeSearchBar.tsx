import { memo, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, TextInput, View, type LayoutChangeEvent } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { TEXT_INPUT_FONT_SIZE, textInputDefaults } from '@/components/ui/textInputDefaults';
import { colors, fonts, radii, ui } from '@/constants/theme';
import { useAmbientInterval } from '@/lib/a11yPrefs';
import { fillCopy } from '@/constants/customerUiCopy';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { motion } from '@/lib/motion';

const ROTATE_MS = 2600;
/** Solid band behind the search pill (and the status strip) when the bar is stuck to the top. */
export const SEARCH_BAND = ui.band;

/**
 * Sticky search pill. While empty it cycles "Search for '…'" through real service names;
 * the hint is an overlay so the TextInput stays a plain input. Resting it floats on the header;
 * stuck to the top it sits on a solid light-grey band with a hairline.
 */
export const HomeSearchBar = memo(function HomeSearchBar({
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
  const copy = useCustomerUiCopy();
  const [focused, setFocused] = useState(false);
  const [hintIdx, setHintIdx] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;
  /** Brand focus ring cross-fades over the hairline (opacity only, so it stays on the native driver). */
  const focusAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: focused ? 1 : 0,
      duration: motion.duration.base,
      easing: motion.easing.out,
      useNativeDriver: true,
    }).start();
  }, [focusAnim, focused]);
  const showHint = query.length === 0;
  const rotating = showHint && !focused && hints.length > 1;

  // Rotates only while Home is visible (paused on other tabs, in the background and with Reduce Motion).
  useAmbientInterval(
    () => {
      Animated.timing(fade, { toValue: 0, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(
        () => {
          setHintIdx((i) => (i + 1) % Math.max(1, hints.length));
          Animated.timing(fade, { toValue: 1, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
        },
      );
    },
    ROTATE_MS,
    rotating,
  );

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
      <View style={styles.field}>
        <Animated.View style={[styles.focusRing, { opacity: focusAnim }]} pointerEvents="none" />
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
            accessibilityLabel={hint ? fillCopy(copy.homeSearchForHint, { query: hint }) : fallbackPlaceholder}
            multiline={false}
          />
          {showHint ? (
            <View style={styles.hintRow} pointerEvents="none">
              {hint ? (
                <>
                  <Text style={styles.hint}>{`${copy.homeSearchHintPrefix} `}</Text>
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
            accessibilityLabel={copy.homeSearchClear}
          >
            <X size={13} color={colors.white} strokeWidth={2.6} />
          </Pressable>
        ) : null}
      </View>
      <Animated.View style={[styles.divider, { opacity: dividerOpacity ?? 0 }]} pointerEvents="none" />
    </View>
  );
});

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
    borderRadius: radii.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(17,26,21,0.08)',
  },
  focusRing: {
    ...StyleSheet.absoluteFill,
    margin: -1,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: ui.brand,
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
    fontSize: 14,
    color: ui.textSecondary,
  },
  hintAccent: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
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
