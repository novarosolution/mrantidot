import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { GlassPanel } from '@/components/kit/GlassScreenKit';
import { homeShadow } from '@/components/kit/homeUi';
import { AppIcons } from '@/constants/appIcons';
import { colors, fonts, premium, spacing, surfaces } from '@/constants/theme';

export function JobProgressCard({
  done,
  total,
  live,
  label = 'Treatment progress',
}: {
  done: number;
  total: number;
  live?: boolean;
  label?: string;
}) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const animPct = useRef(new Animated.Value(0)).current;
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [enter]);

  useEffect(() => {
    Animated.spring(animPct, {
      toValue: pct,
      friction: 9,
      tension: 50,
      useNativeDriver: false,
    }).start();
  }, [animPct, pct]);

  const fillWidth = animPct.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View
      style={[
        styles.shell,
        { opacity: enter, transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] },
      ]}
    >
      <GlassPanel style={styles.card} padded={false} tone="light" intensity={42} goldEdge>
        <View style={styles.inner}>
          <View style={styles.head}>
            <Text style={styles.title}>{label}</Text>
            {live ? (
              <View style={styles.liveBadge}>
                <PremiumIcon icon={AppIcons.ui.activity} variant="plain" size="xs" color={colors.forest} />
                <Text style={styles.liveText}>Live</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.track}>
            <Animated.View style={[styles.fillWrap, { width: fillWidth }]}>
              <LinearGradient
                colors={['#8FD03C', '#1A8734', '#0A6423']}
                style={styles.fill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </Animated.View>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.meta}>
              {done} of {total} steps
            </Text>
            <Text style={styles.pct}>{pct}%</Text>
          </View>
        </View>
      </GlassPanel>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: premium.radiusCard,
    ...homeShadow.card,
  },
  card: {
    borderRadius: premium.radiusCard,
  },
  inner: {
    padding: spacing.md,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  title: { fontFamily: fonts.display, fontSize: 15, color: colors.ink },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: surfaces.glassBorderStrong,
  },
  liveText: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.forest },
  track: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EAF6E3',
    overflow: 'hidden',
  },
  fillWrap: { height: '100%' },
  fill: { flex: 1, borderRadius: 5 },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  meta: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  pct: { fontFamily: fonts.displayExtra, fontSize: 14, color: colors.forest },
});
