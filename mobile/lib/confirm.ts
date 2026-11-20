import { Alert, Platform } from 'react-native';

export type ConfirmOptions = {
  title: string;
  message?: string;
  /** Native button label for the confirming action (default "OK"). Browsers always show OK / Cancel. */
  confirmLabel?: string;
  cancelLabel?: string;
  /** Red confirm button on iOS. */
  destructive?: boolean;
};

function browserText(title: string, message?: string): string {
  return message ? `${title}\n\n${message}` : title;
}

/**
 * Two-button confirmation that works everywhere: `Alert.alert` (Cancel + confirm) on iOS / Android,
 * `window.confirm` in the browser (react-native-web's Alert is a no-op). Resolves true on confirm.
 */
export function confirmAsync({
  title,
  message,
  confirmLabel = 'OK',
  cancelLabel = 'Cancel',
  destructive = false,
}: ConfirmOptions): Promise<boolean> {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || typeof window.confirm !== 'function') return Promise.resolve(false);
    return Promise.resolve(window.confirm(browserText(title, message)));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: cancelLabel, style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: () => resolve(true) },
    ]);
  });
}

/** Single-button info alert: `Alert.alert` on native, `window.alert` in the browser. */
export function notify(title: string, message?: string): void {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && typeof window.alert === 'function') {
      window.alert(browserText(title, message));
    }
    return;
  }
  Alert.alert(title, message);
}

export type ChoiceOption<T extends string> = { label: string; value: T; destructive?: boolean };

/**
 * Native multi-choice alert (option buttons, then Cancel last). Resolves the picked value, or null on
 * Cancel. Browsers have no multi-button dialog — screens show an action sheet there instead.
 */
export function chooseAsync<T extends string>({
  title,
  message,
  options,
  cancelLabel = 'Cancel',
}: {
  title: string;
  message?: string;
  options: ChoiceOption<T>[];
  cancelLabel?: string;
}): Promise<T | null> {
  if (Platform.OS === 'web') {
    // Fallback only — one OK/Cancel dialog per option, first accepted wins.
    for (const option of options) {
      if (typeof window !== 'undefined' && window.confirm(browserText(title, message ? `${message}\n\n${option.label}?` : `${option.label}?`))) {
        return Promise.resolve(option.value);
      }
    }
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      ...options.map((option) => ({
        text: option.label,
        style: option.destructive ? ('destructive' as const) : undefined,
        onPress: () => resolve(option.value),
      })),
      { text: cancelLabel, style: 'cancel' as const, onPress: () => resolve(null) },
    ]);
  });
}
