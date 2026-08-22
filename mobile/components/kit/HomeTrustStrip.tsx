import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { colors, fonts } from '@/constants/theme';
import { homeShadow } from '@/components/kit/homeUi';

/** Soft trust line under home content — guarantee and/or CMS badges. */
export function HomeTrustStrip({
  guaranteeText,
  badges,
}: {
  guaranteeText?: string;
  badges?: string[];
}) {
  const chipList = (badges ?? []).map((b) => b.trim()).filter(Boolean).slice(0, 3);
  const guarantee = guaranteeText?.trim() || '';
  const text =
    chipList.length > 0
      ? chipList.join(' · ')
      : guarantee || 'Verified pros · Satisfaction guaranteed';

  return (
    <View style={styles.wrap}>
      <View style={styles.shell}>
        <View style={styles.pill}>
          <LinearGradient
            colors={[colors.white, '#F5FBF2', colors.soft]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.iconShell}>
            <LinearGradient colors={[colors.limeBright, colors.forestMid]} style={styles.icon} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }}>
              <PremiumIcon
                icon={AppIcons.ui.shieldCheck}
                variant="plain"
                size={14}
                color={colors.white}
                strokeWidth={2.4}
                fill="rgba(255,255,255,0.35)"
              />
            </LinearGradient>
          </View>
          <Text style={styles.text} numberOfLines={2}>
            {text}
          </Text>
        </View>
      </View>
      {chipList.length > 0 && guarantee && guarantee !== text ? (
        <Text style={styles.guarantee} numberOfLines={2}>
          {guarantee}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 24,
    marginHorizontal: 20,
    marginBottom: 8,
    alignItems: 'center',
    gap: 8,
  },
  shell: {
    maxWidth: '100%',
    borderRadius: 999,
    ...homeShadow.card,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(180,220,165,0.95)',
    backgroundColor: colors.white,
  },
  iconShell: {
    borderRadius: 15,
    shadowColor: colors.forest,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  icon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    letterSpacing: -0.1,
    color: colors.ink,
    flexShrink: 1,
    paddingRight: 4,
  },
  guarantee: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 16,
    color: colors.muted,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
});
