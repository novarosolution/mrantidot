import { useCallback, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import Toast from 'react-native-toast-message';
import { moveItem } from '@/components/kit/ReorderButtons';
import { api, getApiErrorMessage } from '@/lib/api';
import { haptic } from '@/lib/motion';

/**
 * "Reorder" mode for a website list (gallery, team, testimonials): move rows locally, then
 * `PUT {endpoint}` with the ids in their new order — or cancel to put them back.
 */
export function useReorderMode<T extends { id: string }>(
  items: T[],
  setItems: Dispatch<SetStateAction<T[]>>,
  endpoint: string,
) {
  const [reordering, setReordering] = useState(false);
  const [saving, setSaving] = useState(false);
  const before = useRef<T[] | null>(null);

  const start = useCallback(() => {
    haptic('select');
    before.current = items;
    setReordering(true);
  }, [items]);

  const cancel = useCallback(() => {
    if (before.current) setItems(before.current);
    before.current = null;
    setReordering(false);
  }, [setItems]);

  const onMove = useCallback((from: number, to: number) => setItems((prev) => moveItem(prev, from, to)), [setItems]);

  const save = useCallback(async () => {
    const prev = before.current;
    const changed = !prev || prev.length !== items.length || prev.some((it, i) => items[i]?.id !== it.id);
    if (!changed) {
      before.current = null;
      setReordering(false);
      return;
    }
    setSaving(true);
    try {
      await api.put(endpoint, { ids: items.map((i) => i.id) }, { skipErrorToast: true });
      haptic('success');
      Toast.show({ type: 'success', text1: 'Order saved', text2: 'The website shows the new order within a minute' });
      before.current = null;
      setReordering(false);
    } catch (err) {
      haptic('error');
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Could not save the order') });
    } finally {
      setSaving(false);
    }
  }, [endpoint, items]);

  return { reordering, saving, start, cancel, save, onMove };
}
