import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import type { PickedImage } from '@/lib/upload';

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  quality: 0.7,
};

export async function pickImagesFromLibrary(maxCount: number): Promise<PickedImage[]> {
  if (maxCount <= 0) return [];

  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Toast.show({ type: 'error', text1: 'Photo library permission required' });
    return [];
  }

  const res = await ImagePicker.launchImageLibraryAsync({
    ...PICKER_OPTIONS,
    allowsMultipleSelection: maxCount > 1,
    selectionLimit: maxCount,
  });

  if (res.canceled) return [];
  return res.assets.map((a) => ({ uri: a.uri, mimeType: a.mimeType }));
}

export async function pickImageFromCamera(): Promise<PickedImage | null> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Toast.show({ type: 'error', text1: 'Camera permission required' });
    return null;
  }

  const res = await ImagePicker.launchCameraAsync(PICKER_OPTIONS);
  if (res.canceled || !res.assets[0]) return null;
  const asset = res.assets[0];
  return { uri: asset.uri, mimeType: asset.mimeType };
}

export function mergePickedImages(existing: PickedImage[], added: PickedImage[], max: number): PickedImage[] {
  return [...existing, ...added].slice(0, max);
}
