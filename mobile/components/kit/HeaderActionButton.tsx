import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { PressableScale } from '@/components/ui/PressableScale';
import { ui } from '@/constants/theme';
import { webTitle } from '@/lib/webKeys';

/** Circular glass header action — same treatment as the home bell, consistent across screens. */
export function HeaderActionButton({
  icon: Icon,
  onPress,
  accessibilityLabel,
}: {
  icon: LucideIcon;
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  // The wrapper carries the browser tooltip for this icon-only button (web).
  return (
    <View ref={webTitle(accessibilityLabel)}>
      <PressableScale
        scaleTo={0.92}
        onPress={onPress}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? 'Action'}
      >
        <GlassSurface style={styles.btn} intensity={30} tintOpacity={0.78}>
          <Icon size={20} color={ui.brand} strokeWidth={2.1} />
        </GlassSurface>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: ui.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
