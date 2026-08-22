import { Component, type ErrorInfo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { ListEmptyRetry } from './ListEmptyRetry';
import { colors } from '@/constants/theme';

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
            title="Something went wrong"
            message={detail}
            onRetry={() => this.setState({ error: null })}
            retryLabel="Try again"
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
