import { useIsFocused } from 'expo-router';
import { StatusBar, type StatusBarStyle } from 'expo-status-bar';

/**
 * Status bar style for the focused screen only. The root layout keeps `light` for dark heroes;
 * white screens mount this with `dark` — it unmounts on blur so the previous style returns.
 */
export function FocusStatusBar({ style }: { style: StatusBarStyle }) {
  const focused = useIsFocused();
  return focused ? <StatusBar style={style} animated /> : null;
}
