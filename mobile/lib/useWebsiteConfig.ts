import axios from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';
import Toast from 'react-native-toast-message';
import { api, getApiErrorMessage, screenLoadConfig } from '@/lib/api';
import { haptic } from '@/lib/motion';
import { useScreenLoad } from '@/lib/useScreenLoad';
import type { WebsiteConfig, WebsitePatch } from '@/types/api';

/**
 * Loads the website layout/photos/lists document and saves groups of it back.
 * `onLoaded` runs after every fresh copy arrives (first load, a save, or the reload after a 409),
 * so screens can reset their drafts from it.
 */
export function useWebsiteConfig(onLoaded: (website: WebsiteConfig) => void) {
  const [website, setWebsite] = useState<WebsiteConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const { loading, error, runLoad, reload } = useScreenLoad();
  const onLoadedRef = useRef(onLoaded);
  onLoadedRef.current = onLoaded;
  const websiteRef = useRef<WebsiteConfig | null>(null);

  const apply = useCallback((next: WebsiteConfig) => {
    websiteRef.current = next;
    setWebsite(next);
    onLoadedRef.current(next);
  }, []);

  const load = useCallback(async () => {
    const { data } = await api.get<{ website: WebsiteConfig }>('/website', { ...screenLoadConfig, skipCache: true });
    apply(data.website);
  }, [apply]);

  useEffect(() => {
    void runLoad(load, 'Could not load the website settings');
  }, [load, runLoad]);

  const retry = useCallback(() => reload(load, 'Could not load the website settings'), [load, reload]);

  /** Sends the given groups with the loaded `updatedAt`. Resolves true when saved. */
  const save = useCallback(
    async (patch: Omit<WebsitePatch, 'updatedAt'>, successText = 'Website updated'): Promise<boolean> => {
      const current = websiteRef.current;
      if (!current) return false;
      setSaving(true);
      try {
        const { data } = await api.patch<{ website: WebsiteConfig }>(
          '/website/admin',
          { ...patch, updatedAt: current.updatedAt },
          { skipErrorToast: true },
        );
        apply(data.website);
        haptic('success');
        Toast.show({ type: 'success', text1: successText, text2: 'The website shows it within a minute' });
        return true;
      } catch (err) {
        haptic('error');
        if (axios.isAxiosError(err) && err.response?.status === 409) {
          Toast.show({
            type: 'error',
            text1: 'Someone else saved meanwhile',
            text2: 'Loaded their version — please make your change again',
          });
          await reload(load, 'Could not load the website settings');
          return false;
        }
        Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Could not save the website') });
        return false;
      } finally {
        setSaving(false);
      }
    },
    [apply, load, reload],
  );

  return { website, loading, error, saving, save, retry };
}
