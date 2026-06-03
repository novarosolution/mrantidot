import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Clock } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ServiceIcon } from '@/components/ServiceIcon';
import type { Service } from '@/types/api';
import { colors, fonts, gradients, headerTopPad, premium, spacing } from '@/constants/theme';

export function BookServiceStrip({
  service,
  durationLabel,
  onBack,
  title,
  subtitle,
}: {
  service: Service;
  durationLabel: string;
  onBack?: () => void;
  title?: string;
  subtitle?: string;
}) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[...gradients.bookHero]}
      style={[styles.wrap, onBack ? { paddingTop: headerTopPad(insets.top) } : null]}
    >
      {onBack ? (
        <View style={styles.navRow}>
          <Pressable
            style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
            onPress={onBack}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ChevronLeft size={22} color={colors.white} />
          </Pressable>
          <View style={styles.navText}>
            {title ? (
              <Text style={styles.navTitle} numberOfLines={1}>
                {title}
              </Text>
            ) : null}
            {subtitle ? (
              <Text style={styles.navSub} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>
      ) : null}
      <View style={styles.row}>
        <View style={styles.icon}>
          <ServiceIcon iconKey={service.iconKey} size={28} color={colors.lime} />
        </View>
        <View style={styles.body}>
          <Text style={styles.name} numberOfLines={2}>
            {service.name}
          </Text>
          <View style={styles.metaRow}>
            <View style={styles.pricePill}>
              <Text style={styles.price}>From ₹{service.basePrice}</Text>
            </View>
            <View style={styles.duration}>
              <Clock size={12} color={colors.lime} />
              <Text style={styles.durationText}>{durationLabel}</Text>
            </View>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: 2,
  },
  navRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.8 },
  navText: { flex: 1, minWidth: 0 },
  navTitle: { fontFamily: fonts.displayExtra, fontSize: 18, color: colors.white },
  navSub: { fontFamily: fonts.body, fontSize: 11.5, color: colors.lime, marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, minWidth: 0 },
  name: { fontFamily: fonts.displayExtra, fontSize: 18, color: colors.white, lineHeight: 24 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  pricePill: {
    backgroundColor: 'rgba(168,224,78,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  price: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.lime },
  duration: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  durationText: { fontFamily: fonts.body, fontSize: 12, color: 'rgba(255,255,255,0.9)' },
});
