import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppIcons } from '@/constants/appIcons';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { colors, fonts } from '@/constants/theme';

/** Home section title — premium display type + lime accent. */
export function HomeSectionTitle({
  title,
  onAction,
}: {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.titleCol}>
          <LinearGradient
            colors={['#8FD03C', '#27A747']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.accent}
          />
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>
        {onAction ? (
          <Pressable style={({ pressed }) => [styles.action, pressed && { opacity: 0.82 }]} onPress={onAction} hitSlop={8}>
            <View style={styles.chevronBtn}>
              <PremiumIcon icon={AppIcons.ui.chevronRight} variant="plain" size={14} color={colors.forest} strokeWidth={2.5} />
            </View>
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
    alignItems: 'center',
    gap: 10,
  },
  accent: {
    width: 3,
    height: 18,
    borderRadius: 2,
  },
  title: {
    flexShrink: 1,
    fontFamily: fonts.displayExtra,
    fontSize: 19,
    lineHeight: 24,
    letterSpacing: -0.55,
    color: colors.ink,
  },
  action: { padding: 2 },
  chevronBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
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
