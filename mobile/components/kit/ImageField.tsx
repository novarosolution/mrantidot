import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { ImageIcon, ImagePlus, RefreshCw, Trash2 } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { IconInput } from '@/components/kit/IconInput';
import { websitePreview } from '@/lib/images';
import { haptic } from '@/lib/motion';
import { pickImagesFromLibrary } from '@/lib/pickImages';
import { uploadWebsiteImage } from '@/lib/upload';
import type { WebsiteImage } from '@/types/api';
import { colors, fonts, spacing, ui } from '@/constants/theme';

/** Counts uploads in flight across several ImageFields — disable Save while `busy`. */
export function useBusyCounter(): [boolean, (busy: boolean) => void] {
  const [count, setCount] = useState(0);
  const onBusyChange = useCallback((busy: boolean) => setCount((n) => Math.max(0, n + (busy ? 1 : -1))), []);
  return [count > 0, onBusyChange];
}

/**
 * Picks one photo from the library and uploads it to the website media store (always JPEG).
 * Resolves the stored URL, or null when the admin cancels. Shows an error toast and throws on failure.
 */
export async function pickAndUploadWebsitePhoto(opts?: {
  onPicked?: (localUri: string) => void;
  onProgress?: (fraction: number) => void;
}): Promise<string | null> {
  const [picked] = await pickImagesFromLibrary(1);
  if (!picked) return null;
  opts?.onPicked?.(picked.uri);
  try {
    return await uploadWebsiteImage(picked.uri, { onProgress: opts?.onProgress });
  } catch (err) {
    haptic('error');
    Toast.show({ type: 'error', text1: 'Photo upload failed', text2: err instanceof Error ? err.message : undefined });
    throw err;
  }
}

/**
 * Preview of a website photo URL: https as-is, `/uploads/…` from the API, website-bundled files from
 * EXPO_PUBLIC_WEBSITE_URL — or a neat "Website photo" placeholder with the file name.
 */
export const WebsitePhoto = memo(function WebsitePhoto({
  url,
  style,
  compact = false,
  emptyLabel = 'No photo',
}: {
  url?: string;
  style?: StyleProp<ViewStyle>;
  /** Thumbnail mode: icon only, no captions. */
  compact?: boolean;
  emptyLabel?: string;
}) {
  const preview = websitePreview(url);
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [url]);

  if (preview.kind === 'remote' && !failed) {
    return (
      <View style={[styles.photoBox, style]}>
        <Image
          source={{ uri: preview.uri }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          onError={() => setFailed(true)}
          accessibilityIgnoresInvertColors
        />
      </View>
    );
  }

  const caption =
    preview.kind === 'bundled' ? 'Website photo' : preview.kind === 'remote' ? 'Preview unavailable' : emptyLabel;
  const detail = preview.kind === 'bundled' ? preview.fileName : preview.kind === 'remote' ? 'The photo is saved' : '';

  return (
    <View style={[styles.photoBox, styles.placeholder, style]}>
      <ImageIcon size={compact ? 18 : 26} color={ui.brand} strokeWidth={1.8} />
      {!compact ? (
        <>
          <Text style={styles.placeholderTitle}>{caption}</Text>
          {detail ? (
            <Text style={styles.placeholderDetail} numberOfLines={1}>
              {detail}
            </Text>
          ) : null}
        </>
      ) : null}
    </View>
  );
});

/**
 * One website photo: preview, pick from library → upload → URL, required alt text, remove.
 * `onChange` should be stable (memoised) so typing alt text only re-renders this field.
 */
export const ImageField = memo(function ImageField({
  label,
  hint,
  value,
  onChange,
  aspectRatio = 16 / 9,
  requireAlt = true,
  altPlaceholder = 'e.g. Technician spraying a kitchen',
  onBusyChange,
  removable = true,
}: {
  label: string;
  hint?: string;
  value: WebsiteImage;
  onChange: (image: WebsiteImage) => void;
  aspectRatio?: number;
  requireAlt?: boolean;
  altPlaceholder?: string;
  onBusyChange?: (busy: boolean) => void;
  removable?: boolean;
}) {
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const valueRef = useRef(value);
  valueRef.current = value;
  const mounted = useRef(true);
  useEffect(
    () => () => {
      mounted.current = false;
    },
    [],
  );

  const pick = useCallback(async () => {
    if (busy) return;
    haptic('tap');
    let started = false;
    try {
      const url = await pickAndUploadWebsitePhoto({
        onPicked: (uri) => {
          started = true;
          setLocalUri(uri);
          setProgress(0);
          setBusy(true);
          onBusyChange?.(true);
        },
        onProgress: (f) => {
          if (mounted.current) setProgress(f);
        },
      });
      if (url) {
        onChange({ ...valueRef.current, url });
        haptic('success');
      }
    } catch {
      // pickAndUploadWebsitePhoto already showed the toast.
    } finally {
      if (started) {
        onBusyChange?.(false);
        if (mounted.current) {
          setBusy(false);
          setLocalUri(null);
        }
      }
    }
  }, [busy, onBusyChange, onChange]);

  const remove = useCallback(() => {
    haptic('select');
    onChange({ url: '', alt: '' });
  }, [onChange]);

  const hasPhoto = Boolean(value.url);
  const altMissing = requireAlt && hasPhoto && !value.alt.trim();

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}

      <Pressable
        onPress={() => void pick()}
        disabled={busy}
        style={({ pressed }) => [styles.previewShell, { aspectRatio }, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={hasPhoto ? `Replace ${label}` : `Add ${label}`}
      >
        {localUri ? (
          <Image source={{ uri: localUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : hasPhoto ? (
          <WebsitePhoto url={value.url} style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.empty]}>
            <View style={styles.emptyIcon}>
              <ImagePlus size={22} color={ui.brand} strokeWidth={2} />
            </View>
            <Text style={styles.emptyTitle}>Add photo</Text>
            <Text style={styles.emptyHint}>JPG or PNG from your library</Text>
          </View>
        )}
        {busy ? (
          <View style={[StyleSheet.absoluteFill, styles.busy]}>
            <ActivityIndicator color={colors.white} />
            <Text style={styles.busyText}>{progress > 0 ? `Uploading ${Math.round(progress * 100)}%` : 'Preparing photo…'}</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.max(6, Math.round(progress * 100))}%` }]} />
            </View>
          </View>
        ) : null}
      </Pressable>

      <View style={styles.actions}>
        <Pressable
          onPress={() => void pick()}
          disabled={busy}
          style={({ pressed }) => [styles.action, pressed && styles.pressed, busy && styles.disabled]}
          accessibilityRole="button"
        >
          {hasPhoto ? <RefreshCw size={15} color={ui.brand} strokeWidth={2.4} /> : <ImagePlus size={15} color={ui.brand} strokeWidth={2.4} />}
          <Text style={styles.actionText}>{hasPhoto ? 'Replace' : 'Choose photo'}</Text>
        </Pressable>
        {hasPhoto && removable ? (
          <Pressable
            onPress={remove}
            disabled={busy}
            style={({ pressed }) => [styles.action, styles.actionDanger, pressed && styles.pressed, busy && styles.disabled]}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${label}`}
          >
            <Trash2 size={15} color={colors.error} strokeWidth={2.4} />
            <Text style={[styles.actionText, styles.actionTextDanger]}>Remove</Text>
          </Pressable>
        ) : null}
      </View>

      {hasPhoto ? (
        <IconInput
          label={requireAlt ? 'Alt text (required)' : 'Alt text'}
          value={value.alt}
          maxLength={200}
          placeholder={altPlaceholder}
          onChangeText={(alt) => onChange({ ...valueRef.current, alt })}
          error={altMissing ? 'Describe the photo for Google and screen readers' : undefined}
          hint="What is in the photo, in a few words"
          containerStyle={styles.alt}
        />
      ) : null}
    </View>
  );
});

/** True when every photo that is set also has alt text. */
export function imagesHaveAlt(images: WebsiteImage[]): boolean {
  return images.every((img) => !img.url || Boolean(img.alt.trim()));
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  label: { fontFamily: fonts.bodySemi, fontSize: 13, color: ui.text, marginBottom: 4 },
  hint: { fontFamily: fonts.body, fontSize: 12, lineHeight: 17, color: ui.textSecondary, marginBottom: 8 },
  previewShell: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: ui.surfaceMuted,
    borderWidth: 1,
    borderColor: ui.border,
    marginTop: 4,
  },
  pressed: { opacity: 0.9 },
  disabled: { opacity: 0.5 },
  photoBox: { overflow: 'hidden', backgroundColor: ui.surfaceMuted },
  placeholder: { alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: spacing.sm },
  placeholderTitle: { fontFamily: fonts.bodySemi, fontSize: 13, color: ui.text, marginTop: 4 },
  placeholderDetail: { fontFamily: fonts.body, fontSize: 11.5, color: ui.textSecondary, maxWidth: '90%' },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(10,100,35,0.3)',
  },
  emptyIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: ui.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontFamily: fonts.bodyBold, fontSize: 14, color: ui.text },
  emptyHint: { fontFamily: fonts.body, fontSize: 12, color: ui.textSecondary },
  busy: { backgroundColor: 'rgba(8,14,10,0.5)', alignItems: 'center', justifyContent: 'center', gap: 8 },
  busyText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.white },
  progressTrack: { width: '56%', height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)', overflow: 'hidden' },
  progressFill: { height: 4, borderRadius: 2, backgroundColor: colors.limeBright },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: ui.brandSoft,
    borderWidth: 1,
    borderColor: ui.border,
  },
  actionDanger: { backgroundColor: colors.errorBg, borderColor: 'rgba(179,63,40,0.18)' },
  actionText: { fontFamily: fonts.bodySemi, fontSize: 13, color: ui.brand },
  actionTextDanger: { color: colors.error },
  alt: { marginTop: spacing.sm, marginBottom: 0 },
});
