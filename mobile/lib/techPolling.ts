import { useIsFocused } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

/** True while the app is in the foreground. */
export function useAppActive(): boolean {
  const [active, setActive] = useState(
    () => AppState.currentState !== 'background' && AppState.currentState !== 'inactive',
  );
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => setActive(state === 'active'));
    return () => sub.remove();
  }, []);
  return active;
}

/**
 * Calls `tick` every `intervalMs`, but only while this screen is focused and the app is in the foreground —
 * no polling from a background tab or a locked phone. It also ticks once each time polling resumes, so make
 * `tick` cheap when nothing is stale (e.g. a cache revalidation that skips fresh data).
 */
export function useLiveInterval(tick: () => void, intervalMs: number, enabled: boolean): void {
  const focused = useIsFocused();
  const active = useAppActive();
  const tickRef = useRef(tick);
  tickRef.current = tick;
  const running = enabled && focused && active;

  useEffect(() => {
    if (!running) return;
    tickRef.current();
    const timer = setInterval(() => tickRef.current(), intervalMs);
    return () => clearInterval(timer);
  }, [running, intervalMs]);
}
