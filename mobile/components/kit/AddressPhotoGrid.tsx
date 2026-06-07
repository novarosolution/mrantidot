import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Camera, ImagePlus, X } from 'lucide-react-native';
import { PhotoSourceSheet } from '@/components/kit/PhotoSourceSheet';
import { mergePickedImages, pickImageFromCamera, pickImagesFromLibrary } from '@/lib/pickImages';
import type { PickedImage } from '@/lib/upload';
import { colors, fonts, gradients, spacing } from '@/constants/theme';

const DEFAULT_MAX = 6;

export function AddressPhotoGrid({
  photos,
  onChange,
  max = DEFAULT_MAX,
}: {
  photos: PickedImage[];
  onChange: (photos: PickedImage[]) => void;
  max?: number;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const remaining = max - photos.length;
  const slots = remaining;

  function openSheet() {
    if (remaining <= 0) return;
    setSheetOpen(true);
  }

  async function fromCamera() {
    if (remaining <= 0) return;
    setBusy(true);
    try {
      const shot = await pickImageFromCamera();
      if (shot) onChange(mergePickedImages(photos, [shot], max));
    } finally {
      setBusy(false);
    }
  }

  async function fromGallery() {
    if (remaining <= 0) return;
    setBusy(true);
    try {
      const picked = await pickImagesFromLibrary(remaining);
      if (picked.length > 0) onChange(mergePickedImages(photos, picked, max));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.grid}>
        <Pressable
          style={({ pressed }) => [styles.addTile, pressed && styles.pressed, remaining <= 0 && styles.disabled]}
          onPress={openSheet}
          disabled={remaining <= 0 || busy}
        >
          <LinearGradient
            colors={[colors.forest, colors.deep]}
            style={styles.addGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {busy ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <>
                <Camera size={22} color={colors.white} />
                <Text style={styles.addLabel}>Add photo</Text>
              </>
            )}
          </LinearGradient>
        </Pressable>

        {photos.map((photo) => (
          <View key={photo.uri} style={styles.thumbWrap}>
            <Image source={{ uri: photo.uri }} style={styles.thumb} />
            <Pressable
              style={styles.removeBtn}
              onPress={() => onChange(photos.filter((p) => p.uri !== photo.uri))}
              hitSlop={6}
            >
              <X size={12} color={colors.white} strokeWidth={3} />
            </Pressable>
          </View>
        ))}

        {slots > 1 ? (
          <Pressable
            style={({ pressed }) => [styles.emptySlot, pressed && styles.pressed, busy && styles.disabled]}
            onPress={openSheet}
            disabled={busy}
          >
            <ImagePlus size={20} color={colors.green} />
          </Pressable>
        ) : null}
      </View>

      <Text style={styles.hint}>
        {photos.length}/{max}
      </Text>

      <PhotoSourceSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onCamera={() => void fromCamera()}
        onGallery={() => void fromGallery()}
      />
    </View>
  );
}

export function AddressConfirmBanner({ address }: { address: string }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, friction: 9, tension: 70, useNativeDriver: true }),
    ]).start();
  }, [address, opacity, translateY]);

  if (!address.trim()) return null;

  return (
    <Animated.View style={[styles.banner, { opacity, transform: [{ translateY }] }]}>
      <LinearGradient
        colors={['#E8F5EC', colors.white]}
        style={styles.bannerInner}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.bannerText} numberOfLines={3}>
          {address.trim()}
        </Text>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  addTile: { width: 88, height: 88, borderRadius: 18, overflow: 'hidden' },
  addGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addLabel: { fontFamily: fonts.bodySemi, fontSize: 10, color: colors.white },
  thumbWrap: { position: 'relative', width: 88, height: 88, borderRadius: 18, overflow: 'hidden' },
  thumb: { width: '100%', height: '100%' },
  removeBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySlot: {
    width: 88,
    height: 88,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(30,142,78,0.35)',
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.88 },
  disabled: { opacity: 0.5 },
  hint: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, lineHeight: 16 },
  banner: { marginTop: spacing.xs },
  bannerInner: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(30,142,78,0.18)',
    gap: 4,
  },
  bannerKicker: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    color: colors.green,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bannerText: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.forest,
    lineHeight: 20,
    paddingRight: 72,
  },
  readyPill: {
    position: 'absolute',
    top: 14,
    right: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  readyText: { fontFamily: fonts.bodySemi, fontSize: 10, color: colors.white },
});
