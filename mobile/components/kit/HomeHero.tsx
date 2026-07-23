import { useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { BrandLogo } from '@/components/BrandLogo';
import { HeroDarkSlice } from '@/components/kit/HeroDarkSlice';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import { homeGreetingName } from '@/lib/profile-display';
import { fonts, headerTopPad, surfaces } from '@/constants/theme';
import { textInputDefaults } from '@/components/ui/textInputDefaults';
import { homeShadow } from '@/components/kit/homeUi';
import { customerRoutes, appPush } from '@/lib/routes';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';

function greetingForHour(
  h: number,
  copy: { homeGreetingMorning: string; homeGreetingAfternoon: string; homeGreetingEvening: string },
): string {
  if (h < 12) return copy.homeGreetingMorning;
  if (h < 17) return copy.homeGreetingAfternoon;
  return copy.homeGreetingEvening;
}

export function HomeHero({
  topInset,
  brandName,
  heroEyebrow,
  searchPlaceholder,
  query,
  onChangeQuery,
  onSubmitSearch,
  unread,
  heroSubtitle,
}: {
  topInset: number;
  brandName?: string;
  heroEyebrow?: string;
  heroSubtitle?: string;
  searchPlaceholder: string;
  query: string;
  onChangeQuery: (v: string) => void;
  onSubmitSearch: () => void;
  unread: number;
}) {
  const ui = useCustomerUiCopy();
  const { user } = useAuth();
  const { displayLabel, locating, refreshLocation } = useLocation();
  const firstName = homeGreetingName(user);
  const initial = (user?.name?.[0] ?? 'U').toUpperCase();
  const brand = brandName?.trim() || 'Mr Antidot';
  const eyebrow = heroEyebrow?.trim() || brand;
  const greet = greetingForHour(new Date().getHours(), ui);
  const subLine = heroSubtitle?.trim() || 'Trusted pest control at your door';

  const ping = useRef(new Animated.Value(0)).current;
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 560,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [enter]);

  useEffect(() => {
    if (unread <= 0) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(ping, { toValue: 1, duration: 900, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(ping, { toValue: 0, duration: 900, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [ping, unread]);

  const enterStyle = {
    opacity: enter,
    transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
  };

  return (
    <View style={styles.wrap}>
      <HeroDarkSlice
        style={styles.heroShell}
        contentStyle={[styles.heroContent, { paddingTop: headerTopPad(topInset) }]}
        sliceHeight={20}
      >
        <Animated.View style={enterStyle}>
          <View style={styles.topRow}>
            <View style={styles.brandMark}>
              <LinearGradient
                colors={['rgba(255,255,255,0.28)', 'rgba(255,255,255,0.1)']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <BrandLogo size={30} animate={false} />
            </View>

            <View style={styles.brandCol}>
              <Text style={styles.brandName} numberOfLines={1}>
                {eyebrow}
              </Text>
              <LinearGradient
                colors={['#C8F07A', '#8FD03C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.brandRule}
              />
            </View>

            <View style={styles.actions}>
              <Pressable
                style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
                onPress={() => appPush(customerRoutes.notifications)}
                hitSlop={4}
              >
                <PremiumIcon icon={AppIcons.ui.bell} variant="plain" size={18} color="#FFFFFF" strokeWidth={2} fill="rgba(255,255,255,0.22)" />
                {unread > 0 ? (
                  <Animated.View
                    style={[
                      styles.ping,
                      {
                        transform: [{ scale: ping.interpolate({ inputRange: [0, 1], outputRange: [1, 1.22] }) }],
                        opacity: ping.interpolate({ inputRange: [0, 1], outputRange: [1, 0.6] }),
                      },
                    ]}
                  />
                ) : null}
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}
                onPress={() => appPush(customerRoutes.profile)}
                hitSlop={4}
              >
                <LinearGradient colors={['#E8F9D4', '#8FD03C']} style={StyleSheet.absoluteFill} start={{ x: 0.2, y: 0 }} end={{ x: 0.9, y: 1 }} />
                <Text style={styles.avatarText}>{initial}</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.greetBlock}>
            <Text style={styles.greetLine}>{greet}</Text>
            <Text style={styles.greetName} numberOfLines={1}>
              {firstName}
            </Text>
            <Text style={styles.greetSub} numberOfLines={1}>
              {subLine}
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [styles.location, pressed && styles.pressed]}
            onPress={() => void refreshLocation()}
            disabled={locating}
          >
            <View style={styles.locationIcon}>
              {locating ? (
                <ActivityIndicator size="small" color="#0A6423" />
              ) : (
                <PremiumIcon icon={AppIcons.ui.mapPin} variant="plain" size={13} color="#0A6423" strokeWidth={2.4} fill="rgba(10,100,35,0.18)" />
              )}
            </View>
            <Text style={styles.locationText} numberOfLines={1}>
              {locating ? ui.homeFindingLocation : displayLabel || ui.homeSetLocation}
            </Text>
            <PremiumIcon
              icon={AppIcons.ui.chevronDown}
              variant="plain"
              size={14}
              color="rgba(255,255,255,0.92)"
              strokeWidth={2.4}
            />
          </Pressable>
        </Animated.View>
      </HeroDarkSlice>

      <View style={styles.searchOuter}>
        <View style={styles.searchShell}>
          <LinearGradient
            colors={['rgba(255,255,255,0.98)', 'rgba(247,252,244,0.96)']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            pointerEvents="none"
          />
          <View style={styles.searchWrap}>
            <LinearGradient colors={['#EAF6E3', '#D4EEC4']} style={styles.searchIcon}>
              <PremiumIcon icon={AppIcons.ui.search} variant="plain" size={17} color="#0A6423" strokeWidth={2.3} fill="rgba(10,100,35,0.16)" />
            </LinearGradient>
            <TextInput
              style={styles.search}
              {...textInputDefaults}
              placeholder={searchPlaceholder}
              placeholderTextColor="#86AC80"
              value={query}
              onChangeText={onChangeQuery}
              onSubmitEditing={onSubmitSearch}
              returnKeyType="search"
              scrollEnabled={false}
              multiline={false}
            />
            {query.length > 0 ? (
              <Pressable style={styles.clearBtn} onPress={() => onChangeQuery('')} hitSlop={8}>
                <PremiumIcon icon={AppIcons.ui.close} variant="plain" size={14} color="#5C8A63" />
              </Pressable>
            ) : (
              <Pressable style={styles.goBtn} onPress={onSubmitSearch} hitSlop={6}>
                <PremiumIcon icon={AppIcons.ui.arrowRight} variant="plain" size={14} color="#FFFFFF" strokeWidth={2.6} />
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 4 },
  heroShell: {},
  heroContent: {
    paddingHorizontal: 20,
    paddingBottom: 44,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandMark: {
    width: 48,
    height: 48,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  brandCol: { flex: 1, minWidth: 0, gap: 5 },
  brandName: {
    fontFamily: fonts.brand,
    fontSize: 22,
    letterSpacing: -0.55,
    color: '#FFFFFF',
  },
  brandRule: {
    width: 28,
    height: 3,
    borderRadius: 2,
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.34)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#02180C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  ping: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8FD03C',
    borderWidth: 1.5,
    borderColor: '#0A6423',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fonts.displayExtra,
    fontSize: 15,
    color: '#043813',
  },
  greetBlock: {
    marginTop: 18,
    gap: 2,
  },
  greetLine: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13.5,
    letterSpacing: 0.15,
    color: 'rgba(255,255,255,0.92)',
  },
  greetName: {
    fontFamily: fonts.displayExtra,
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -0.85,
    color: '#FFFFFF',
  },
  greetSub: {
    marginTop: 4,
    fontFamily: fonts.body,
    fontSize: 13.5,
    lineHeight: 19,
    letterSpacing: -0.05,
    color: 'rgba(255,255,255,0.86)',
  },
  location: {
    marginTop: 14,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: '100%',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.34)',
    borderRadius: 999,
    paddingLeft: 6,
    paddingRight: 12,
    paddingVertical: 6,
  },
  locationIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationText: {
    flexShrink: 1,
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: '#FFFFFF',
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.97 }] },
  searchOuter: {
    marginTop: -18,
    paddingHorizontal: 20,
    zIndex: 5,
  },
  searchShell: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
    ...homeShadow.search,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 56,
    paddingHorizontal: 10,
  },
  searchIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  search: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: '#0B2213',
    paddingVertical: 12,
  },
  clearBtn: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: '#EAF6E3',
    borderWidth: 1,
    borderColor: '#DBF1D1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goBtn: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: '#1A8734',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
