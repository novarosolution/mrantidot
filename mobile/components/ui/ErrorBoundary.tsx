import { Component, type ErrorInfo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { ListEmptyRetry } from './ListEmptyRetry';
import { colors } from '@/constants/theme';
import { DEFAULT_CUSTOMER_UI_COPY } from '@/constants/customerUiCopy';

/**
 * This boundary sits above the content providers (they unmount when it catches), so it uses the
 * built-in defaults of the admin's error copy rather than the live CMS values.
 */
const COPY = DEFAULT_CUSTOMER_UI_COPY;

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary]', error.message, info.componentStack);
  }

  render() {
    if (this.state.error) {
      const detail = __DEV__ ? this.state.error.message : 'Please close and reopen the app.';
      return (
        <View style={styles.wrap}>
          <ListEmptyRetry
            title={COPY.systemErrorTitle}
            message={detail}
            onRetry={() => this.setState({ error: null })}
            retryLabel={COPY.systemRetry}
          />
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.bg,
  },
});
