import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { PremiumIcon } from '@/components/kit/PremiumIcon';
import { AppIcons } from '@/constants/appIcons';
import { PhotoSourceSheet } from '@/components/kit/PhotoSourceSheet';
import { mergePickedImages, pickImageFromCamera, pickImagesFromLibrary } from '@/lib/pickImages';
import type { PickedImage } from '@/lib/upload';
import { colors, fonts, spacing, ui } from '@/constants/theme';

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
  const photosRef = useRef(photos);
  photosRef.current = photos;
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
      if (shot) onChange(mergePickedImages(photosRef.current, [shot], max));
    } finally {
      setBusy(false);
    }
  }

  async function fromGallery() {
    if (remaining <= 0) return;
    setBusy(true);
    try {
      const picked = await pickImagesFromLibrary(remaining);
      if (picked.length > 0) onChange(mergePickedImages(photosRef.current, picked, max));
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
          <View style={styles.addGradient}>
            {busy ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <>
                <PremiumIcon icon={AppIcons.ui.camera} variant="plain" size={22} color={colors.white} />
                <Text style={styles.addLabel}>Add photo</Text>
              </>
            )}
          </View>
        </Pressable>

        {photos.map((photo) => (
          <View key={photo.uri} style={styles.thumbWrap}>
            <Image source={{ uri: photo.uri }} style={styles.thumb} />
            <Pressable
              style={styles.removeBtn}
              onPress={() => onChange(photos.filter((p) => p.uri !== photo.uri))}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Remove photo"
            >
              <PremiumIcon icon={AppIcons.ui.close} variant="plain" size={12} color={colors.white} strokeWidth={3} />
            </Pressable>
          </View>
        ))}

        {slots > 1 ? (
          <Pressable
            style={({ pressed }) => [styles.emptySlot, pressed && styles.pressed, busy && styles.disabled]}
            onPress={openSheet}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel="Add another photo"
          >
            <PremiumIcon icon={AppIcons.ui.imagePlus} variant="plain" size={20} color={ui.brand} />
          </Pressable>
        ) : null}
      </View>

      <Text style={styles.hint}>
        Optional · {photos.length}/{max} photos
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
      <View style={styles.bannerInner}>
        <View style={styles.bannerIcon}>
          <PremiumIcon icon={AppIcons.ui.check} variant="plain" size={16} color={colors.white} strokeWidth={2.8} />
        </View>
        <View style={styles.bannerCopy}>
          <Text style={styles.bannerKicker}>ADDRESS READY</Text>
          <Text style={styles.bannerText} numberOfLines={3}>
            {address.trim()}
          </Text>
        </View>
      </View>
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
    backgroundColor: ui.brand,
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
    borderColor: ui.hairline,
    backgroundColor: ui.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.88 },
  disabled: { opacity: 0.5 },
  hint: { fontFamily: fonts.body, fontSize: 12, color: ui.textSecondary, lineHeight: 16 },
  banner: { marginTop: spacing.xs },
  bannerInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: ui.hairline,
    backgroundColor: ui.brandSoft,
  },
  bannerIcon: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: ui.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerCopy: { flex: 1, minWidth: 0 },
  bannerKicker: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: ui.brand,
    letterSpacing: 1,
  },
  bannerText: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: ui.text,
    lineHeight: 20,
    marginTop: 3,
  },
});
