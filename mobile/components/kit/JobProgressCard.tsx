import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Activity } from 'lucide-react-native';
import { colors, fonts, premium, shadows, spacing } from '@/constants/theme';

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
    <Animated.View style={[styles.card, { opacity: enter, transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }]}>
      <View style={styles.head}>
        <Text style={styles.title}>{label}</Text>
        {live ? (
          <View style={styles.liveBadge}>
            <Activity size={12} color={colors.green} />
            <Text style={styles.liveText}>Live</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.track}>
        <Animated.View style={[styles.fillWrap, { width: fillWidth }]}>
          <LinearGradient
            colors={['#2BB563', '#1E8E4E', '#14532D']}
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
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: premium.radiusCard,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(20,83,45,0.06)',
    ...shadows.card,
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
  },
  liveText: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.green },
  track: {
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.border,
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
