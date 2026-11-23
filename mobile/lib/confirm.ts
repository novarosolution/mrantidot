import { Alert, Platform } from 'react-native';

export type ConfirmOptions = {
  title: string;
  message?: string;
  /** Label of the confirming button (default "OK") — native alerts and the web admin's dialog. */
  confirmLabel?: string;
  cancelLabel?: string;
  /** Red confirm button. */
  destructive?: boolean;
};

/* ─── Web dialogs ──────────────────────────────────────────────────── */

/**
 * One button of the in-app web dialog. `cancel` closes like Escape / a backdrop click (the dialog resolves
 * null); `primary` and `destructive` are solid; `default` is an outlined choice.
 */
export type WebDialogButton = {
  value: string;
  label: string;
  tone: 'cancel' | 'default' | 'primary' | 'destructive';
};

export type WebDialogRequest = {
  title: string;
  message?: string;
  buttons: WebDialogButton[];
  /** `row`: Cancel + action side by side (confirm / notice). `column`: stacked choices (chooseAsync). */
  layout: 'row' | 'column';
};

/** Shows a dialog; resolves the pressed button's value, or null when it was cancelled or dismissed. */
export type WebDialogPresenter = (request: WebDialogRequest) => Promise<string | null>;

let webPresenter: WebDialogPresenter | null = null;

/** WebDialogHost (web) registers itself while mounted; without it the browser's own boxes are used. */
export function setWebDialogPresenter(presenter: WebDialogPresenter | null): void {
  webPresenter = presenter;
}

function browserText(title: string, message?: string): string {
  return message ? `${title}\n\n${message}` : title;
}

/**
 * Two-button confirmation that works everywhere: `Alert.alert` (Cancel + confirm) on iOS / Android; in the
 * browser the admin's in-app dialog (real labels, red destructive button, Escape = cancel), or
 * `window.confirm` when no dialog host is mounted. Resolves true on confirm.
 */
export function confirmAsync({
  title,
  message,
  confirmLabel = 'OK',
  cancelLabel = 'Cancel',
  destructive = false,
}: ConfirmOptions): Promise<boolean> {
  if (Platform.OS === 'web') {
    if (webPresenter) {
      return webPresenter({
        title,
        message,
        layout: 'row',
        buttons: [
          { value: 'cancel', label: cancelLabel, tone: 'cancel' },
          { value: 'confirm', label: confirmLabel, tone: destructive ? 'destructive' : 'primary' },
        ],
      }).then((value) => value === 'confirm');
    }
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

/** Single-button info alert: `Alert.alert` on native; the in-app dialog (or `window.alert`) in the browser. */
export function notify(title: string, message?: string): void {
  if (Platform.OS === 'web') {
    if (webPresenter) {
      void webPresenter({ title, message, layout: 'row', buttons: [{ value: 'ok', label: 'OK', tone: 'primary' }] });
      return;
    }
    if (typeof window !== 'undefined' && typeof window.alert === 'function') {
      window.alert(browserText(title, message));
    }
    return;
  }
  Alert.alert(title, message);
}

export type ChoiceOption<T extends string> = { label: string; value: T; destructive?: boolean };

/**
 * Multi-choice alert (option buttons, then Cancel last). Resolves the picked value, or null on Cancel.
 * Native: `Alert.alert`. Browser: the in-app dialog with one button per option; without a dialog host,
 * one OK/Cancel box per option (first accepted wins).
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
    if (webPresenter) {
      return webPresenter({
        title,
        message,
        layout: 'column',
        buttons: [
          ...options.map(
            (option): WebDialogButton => ({
              value: option.value,
              label: option.label,
              tone: option.destructive ? 'destructive' : 'default',
            }),
          ),
          { value: '', label: cancelLabel, tone: 'cancel' },
        ],
      }).then((value) => options.find((option) => option.value === value)?.value ?? null);
    }
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
