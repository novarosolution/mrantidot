import { LogBox } from 'react-native';
import { getApiErrorMessage } from './api';

let installed = false;

type ErrorUtilsLike = {
  getGlobalHandler?: () => (error: Error, isFatal?: boolean) => void;
  setGlobalHandler?: (handler: (error: Error, isFatal?: boolean) => void) => void;
};

type GlobalWithHandlers = typeof globalThis & {
  ErrorUtils?: ErrorUtilsLike;
  HermesInternal?: {
    enablePromiseRejectionTracker?: (opts: {
      allRejections: boolean;
      onUnhandled: (id: number, error: unknown) => void;
      onHandled: () => void;
    }) => void;
  };
};

/** Suppress duplicate console noise; screen-level handlers show user-facing errors. */
export function registerGlobalErrorHandlers(): void {
  if (installed) return;
  installed = true;

  LogBox.ignoreLogs(['Uncaught (in promise']);

  const g = globalThis as GlobalWithHandlers;
  const prevHandler = g.ErrorUtils?.getGlobalHandler?.();

  g.ErrorUtils?.setGlobalHandler?.((error: Error, isFatal?: boolean) => {
    console.error('[global]', error?.message ?? error);
    prevHandler?.(error, isFatal);
  });

  g.HermesInternal?.enablePromiseRejectionTracker?.({
    allRejections: true,
    onUnhandled: (_id, error) => {
      if (__DEV__) {
        console.warn('[unhandled rejection]', getApiErrorMessage(error));
      }
    },
    onHandled: () => {},
  });
}
