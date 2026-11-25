import { useNavigation } from 'expo-router';
import { useEffect, useRef, useSyncExternalStore, type DependencyList } from 'react';
import { AccessibilityInfo, AppState, Platform, type Animated } from 'react-native';

/**
 * App-wide accessibility + visibility state for motion.
 *
 * One OS query and one listener each for "Reduce motion" and "Reduce transparency", shared by every
 * component through `useSyncExternalStore` (no per-instance async query, no flip after first paint).
 * The queries start when this module is first imported, i.e. at app launch.
 */
type Store = { value: boolean; listeners: Set<() => void> };

function createPrefStore(
  query: () => Promise<boolean>,
  event: 'reduceMotionChanged' | 'reduceTransparencyChanged',
  enabled: boolean,
): Store {
  const store: Store = { value: false, listeners: new Set() };
  if (!enabled) return store;
  const set = (v: boolean) => {
    if (store.value === v) return;
    store.value = v;
    store.listeners.forEach((l) => l());
  };
  try {
    void query()
      .then(set)
      .catch(() => undefined);
    AccessibilityInfo.addEventListener(event, set);
  } catch {
    // Older web runtimes without matchMedia — keep motion on.
  }
  return store;
}

const reduceMotion = createPrefStore(() => AccessibilityInfo.isReduceMotionEnabled(), 'reduceMotionChanged', true);
const reduceTransparency = createPrefStore(
  () => AccessibilityInfo.isReduceTransparencyEnabled(),
  'reduceTransparencyChanged',
  Platform.OS === 'ios',
);

function subscribeTo(store: Store) {
  return (cb: () => void) => {
    store.listeners.add(cb);
    return () => {
      store.listeners.delete(cb);
    };
  };
}
const subscribeMotion = subscribeTo(reduceMotion);
const subscribeTransparency = subscribeTo(reduceTransparency);
const readMotion = () => reduceMotion.value;
const readTransparency = () => reduceTransparency.value;

/** Latest known "Reduce motion" value, for plain helpers and animation callbacks. */
export function getReducedMotion(): boolean {
  return reduceMotion.value;
}

/** True when the user asked the OS to reduce motion — entrances become instant, loops stay still. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribeMotion, readMotion, readMotion);
}

/** True when iOS "Reduce Transparency" is on — glass surfaces fall back to solid white. */
export function useReduceTransparency(): boolean {
  return useSyncExternalStore(subscribeTransparency, readTransparency, readTransparency);
}

/* ------------------------------------------------------------------------------------------------
 * Ambient (decorative, looping) motion only runs while someone can see it: motion allowed, the app
 * in the foreground and the screen focused. Focus is tracked with navigation listeners, not state,
 * so it still works on tabs frozen by `freezeOnBlur` (a frozen screen cannot re-render).
 * ---------------------------------------------------------------------------------------------- */

type Visibility = { subscribe: (cb: () => void) => () => void; isFocused: () => boolean };

function useScreenVisibility(): Visibility {
  // Every component here renders under the router's root stack, so a navigation object always exists
  // (the root layout's own one reports "focused" forever).
  const navigation = useNavigation();
  return {
    isFocused: () => {
      try {
        return navigation.isFocused();
      } catch {
        return true;
      }
    },
    subscribe: (cb) => {
      const offs: (() => void)[] = [];
      try {
        offs.push(navigation.addListener('focus', cb));
        offs.push(navigation.addListener('blur', cb));
      } catch {
        // Not a screen navigator — always visible.
      }
      const app = AppState.addEventListener('change', cb);
      return () => {
        offs.forEach((off) => off());
        app.remove();
      };
    },
  };
}

/**
 * Runs a decorative loop only while it is visible and motion is allowed; stops it on blur,
 * background and Reduce Motion, and restarts it when the screen comes back.
 *
 *   useAmbientLoop(() => Animated.loop(Animated.timing(v, {...})), [v]);
 *
 * `build` must return a fresh animation each call. Pass `enabled: false` to hold it still.
 */
export function useAmbientLoop(
  build: () => Animated.CompositeAnimation | null,
  deps: DependencyList,
  enabled = true,
): void {
  const reduced = useReducedMotion();
  const visibility = useScreenVisibility();
  const buildRef = useRef(build);
  buildRef.current = build;
  const visRef = useRef(visibility);
  visRef.current = visibility;

  useEffect(() => {
    if (reduced || !enabled) return;
    let anim: Animated.CompositeAnimation | null = null;
    const sync = () => {
      const visible = AppState.currentState !== 'background' && visRef.current.isFocused();
      if (visible && !anim) {
        anim = buildRef.current();
        anim?.start();
      } else if (!visible && anim) {
        anim.stop();
        anim = null;
      }
    };
    sync();
    // Navigation events arrive after the state change, so re-check on the next frame too.
    const off = visRef.current.subscribe(() => requestAnimationFrame(sync));
    return () => {
      off();
      anim?.stop();
      anim = null;
    };
  }, [reduced, enabled, ...deps]);
}

/**
 * setInterval that only ticks while the screen is visible (focused + foreground) and motion is allowed.
 * Used for auto-advancing carousels and rotating hints.
 */
export function useAmbientInterval(tick: () => void, ms: number, enabled = true): void {
  const reduced = useReducedMotion();
  const visibility = useScreenVisibility();
  const tickRef = useRef(tick);
  tickRef.current = tick;
  const visRef = useRef(visibility);
  visRef.current = visibility;

  useEffect(() => {
    if (reduced || !enabled || ms <= 0) return;
    let timer: ReturnType<typeof setInterval> | null = null;
    const sync = () => {
      const visible = AppState.currentState !== 'background' && visRef.current.isFocused();
      if (visible && !timer) timer = setInterval(() => tickRef.current(), ms);
      else if (!visible && timer) {
        clearInterval(timer);
        timer = null;
      }
    };
    sync();
    const off = visRef.current.subscribe(() => requestAnimationFrame(sync));
    return () => {
      off();
      if (timer) clearInterval(timer);
    };
  }, [reduced, enabled, ms]);
}
