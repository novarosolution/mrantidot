import { X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppImage } from '@/components/ui/AppImage';
import { colors, radii, typeScale } from '@/constants/theme';
import { fillCopy } from '@/constants/customerUiCopy';
import { useCustomerUiCopy } from '@/lib/customer-ui-copy';
import { haptic } from '@/lib/motion';

/**
 * Full-screen photo viewer: swipe between photos, tap × (or Android back) to close.
 * Photos load through AppImage, so thumbnails already on screen open instantly from cache.
 */
export function PhotoViewer({
  photos,
  index,
  onClose,
}: {
  /** Full URLs (already passed through `mediaUrl`). */
  photos: string[];
  /** Photo to open at; null keeps the viewer closed. */
  index: number | null;
  onClose: () => void;
}) {
  const copy = useCustomerUiCopy();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [current, setCurrent] = useState(index ?? 0);
  const visible = index !== null && photos.length > 0;

  useEffect(() => {
    if (index === null) return;
    setCurrent(index);
    // Jump (no animation) to the tapped photo once the pager has laid out.
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ x: index * width, animated: false }));
  }, [index, width]);

  function onMomentumEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== current) {
      setCurrent(i);
      haptic('select');
    }
  }

  return (
    <Modal visible={visible} animationType="fade" transparent={false} onRequestClose={onClose} statusBarTranslucent>
      <StatusBar style="light" />
      <View style={styles.root}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onMomentumEnd}
          contentOffset={{ x: (index ?? 0) * width, y: 0 }}
        >
          {photos.map((uri, i) => (
            <View key={`${uri}-${i}`} style={{ width, height }}>
              <AppImage
                uri={uri}
                style={{ width, height }}
                contentFit="contain"
                placeholderColor="transparent"
                priority={i === current ? 'high' : 'low'}
                accessibilityLabel={fillCopy(copy.photoViewerLabel, { current: i + 1, total: photos.length })}
              />
            </View>
          ))}
        </ScrollView>
        <View style={[styles.top, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
          {photos.length > 1 ? (
            <View style={styles.counter}>
              <Text style={styles.counterText}>
                {fillCopy(copy.photoViewerCount, { current: current + 1, total: photos.length })}
              </Text>
            </View>
          ) : (
            <View />
          )}
          <Pressable
            onPress={onClose}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={copy.systemClose}
            style={({ pressed }) => [styles.close, pressed && styles.closePressed]}
          >
            <X size={22} color={colors.white} strokeWidth={2.2} />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  counter: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  counterText: { ...typeScale.captionStrong, color: colors.white },
  close: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  closePressed: { backgroundColor: 'rgba(255,255,255,0.3)' },
});
