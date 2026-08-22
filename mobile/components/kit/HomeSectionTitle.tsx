import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppIcons } from '@/constants/appIcons';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { colors, fonts } from '@/constants/theme';

/** Home section title — premium display type + lime accent. */
export function HomeSectionTitle({
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const label = actionLabel?.trim() || undefined;
  const a11y = label || 'See all';

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.titleCol}>
          <LinearGradient
            colors={[colors.limeBright, colors.green]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.accent}
          />
          <View style={styles.titleBlock}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            {subtitle?.trim() ? (
              <Text style={styles.subtitle} numberOfLines={2}>
                {subtitle.trim()}
              </Text>
            ) : null}
          </View>
        </View>
        {onAction ? (
          <Pressable
            style={({ pressed }) => [styles.action, pressed && { opacity: 0.82 }]}
            onPress={onAction}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={a11y}
          >
            {label ? (
              <View style={styles.labelBtn}>
                <Text style={styles.actionLabel} numberOfLines={1}>
                  {label}
                </Text>
                <PremiumIcon
                  icon={AppIcons.ui.chevronRight}
                  variant="plain"
                  size={14}
                  color={colors.forest}
                  strokeWidth={2.5}
                />
              </View>
            ) : (
              <View style={styles.chevronBtn}>
                <PremiumIcon
                  icon={AppIcons.ui.chevronRight}
                  variant="plain"
                  size={14}
                  color={colors.forest}
                  strokeWidth={2.5}
                />
              </View>
            )}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20,
    marginTop: 6,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  titleCol: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  accent: {
    width: 3,
    height: 18,
    borderRadius: 2,
    marginTop: 3,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    flexShrink: 1,
    fontFamily: fonts.displayExtra,
    fontSize: 19,
    lineHeight: 24,
    letterSpacing: -0.55,
    color: colors.ink,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted,
    paddingRight: 4,
  },
  action: { padding: 2, maxWidth: '42%' },
  labelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(180,220,165,0.95)',
    shadowColor: '#04150A',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  actionLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 12.5,
    letterSpacing: -0.1,
    color: colors.forest,
    maxWidth: 88,
  },
  chevronBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(180,220,165,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#04150A',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
});
