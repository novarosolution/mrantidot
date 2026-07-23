import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { colors, fonts } from '@/constants/theme';
import { homeShadow } from '@/components/kit/homeUi';

/** Soft trust line under home content. */
export function HomeTrustStrip({
  guaranteeText,
}: {
  guaranteeText?: string;
  badges?: string[];
}) {
  const text = guaranteeText?.trim() || 'Verified pros · Satisfaction guaranteed';

  return (
    <View style={styles.wrap}>
      <View style={styles.shell}>
        <View style={styles.pill}>
          <LinearGradient
            colors={['#FFFFFF', '#F5FBF2', '#EAF6E3']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.iconShell}>
            <LinearGradient colors={['#8FD03C', '#1A8734']} style={styles.icon} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }}>
              <PremiumIcon
                icon={AppIcons.ui.shieldCheck}
                variant="plain"
                size={14}
                color="#FFFFFF"
                strokeWidth={2.4}
                fill="rgba(255,255,255,0.35)"
              />
            </LinearGradient>
          </View>
          <Text style={styles.text} numberOfLines={1}>
            {text}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 24,
    marginHorizontal: 20,
    marginBottom: 8,
    alignItems: 'center',
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
    backgroundColor: '#FFFFFF',
  },
  iconShell: {
    borderRadius: 15,
    shadowColor: '#0A6423',
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
});
