import { memo } from 'react';
import { StyleSheet, View, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';
import { Image, type ImageContentFit, type ImageSource } from 'expo-image';
import { ImageOff } from 'lucide-react-native';
import { ui } from '@/constants/theme';

/**
 * Remote or bundled photo with disk + memory caching, a soft fade-in and a neutral placeholder.
 * Use it for every photo the app downloads (service covers, job photos, avatars, website photos).
 *
 *   <AppImage uri={mediaUrl(photo.url)} style={{ width: 96, height: 96, borderRadius: 16 }} />
 */
export const AppImage = memo(function AppImage({
  uri,
  source,
  style,
  contentFit = 'cover',
  transition = 180,
  priority = 'normal',
  recyclingKey,
  accessibilityLabel,
  placeholderColor = ui.surfaceMuted,
  showFallbackIcon = true,
}: {
  /** Remote URL (or null/undefined → placeholder). */
  uri?: string | null;
  /** Bundled image (`require(...)`) or a full expo-image source; wins over `uri`. */
  source?: ImageSource | number;
  style?: StyleProp<ImageStyle>;
  contentFit?: ImageContentFit;
  /** Fade-in length in ms (0 = none). */
  transition?: number;
  priority?: 'low' | 'normal' | 'high';
  /** Set when the same component shows different images in a recycled list row. */
  recyclingKey?: string;
  accessibilityLabel?: string;
  placeholderColor?: string;
  /** Show a small "no image" icon when there is nothing to load. */
  showFallbackIcon?: boolean;
}) {
  const src = source ?? (uri ? { uri } : null);
  if (!src) {
    return (
      <View style={[styles.empty, { backgroundColor: placeholderColor }, style as StyleProp<ViewStyle>]} accessibilityLabel={accessibilityLabel}>
        {showFallbackIcon ? <ImageOff size={18} color={ui.textTertiary} strokeWidth={2} /> : null}
      </View>
    );
  }
  return (
    <Image
      source={src}
      style={[{ backgroundColor: placeholderColor }, style]}
      contentFit={contentFit}
      transition={transition}
      cachePolicy="memory-disk"
      priority={priority}
      recyclingKey={recyclingKey}
      accessibilityLabel={accessibilityLabel}
      accessible={Boolean(accessibilityLabel)}
    />
  );
});

const styles = StyleSheet.create({
  empty: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
