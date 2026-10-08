import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { TEXT_INPUT_FONT_SIZE, textInputDefaults } from '@/components/ui/textInputDefaults';
import { colors, fonts, ui } from '@/constants/theme';

const ROTATE_MS = 2600;

/**
 * Sticky search field. While empty it cycles "Search for '…'" through real service names
 * (Urban-style rotating hint); the hint is an overlay so the TextInput stays a plain input.
 */
export function HomeSearchBar({
  query,
  onChangeQuery,
  onSubmit,
  hints,
  fallbackPlaceholder,
  dividerOpacity,
  background,
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
}) {
  const [focused, setFocused] = useState(false);
  const [hintIdx, setHintIdx] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;
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

  return (
    <View style={[styles.wrap, background ? { backgroundColor: background } : null]}>
      <View style={[styles.field, focused && styles.fieldFocused, ui.shadow]}>
        <View style={[styles.iconWell, focused && styles.iconWellFocused]}>
          <Search size={17} color={focused ? ui.brand : ui.textSecondary} strokeWidth={2.2} />
        </View>
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
      </View>
      <Animated.View style={[styles.divider, { opacity: dividerOpacity ?? 0 }]} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 52,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: ui.border,
  },
  fieldFocused: {
    borderColor: ui.brand,
    backgroundColor: colors.white,
  },
  iconWell: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: ui.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWellFocused: { backgroundColor: ui.brandSoft },
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
    color: ui.textTertiary,
  },
  hintAccent: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: ui.brand,
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
    backgroundColor: ui.border,
  },
});
