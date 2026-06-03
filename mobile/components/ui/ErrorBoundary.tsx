import { Component, type ErrorInfo, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { colors, fonts, spacing } from '@/constants/theme';

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
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>{detail}</Text>
          <Button title="Try again" onPress={() => this.setState({ error: null })} style={styles.btn} />
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.bg,
  },
  title: { fontFamily: fonts.display, fontSize: 18, color: colors.ink, textAlign: 'center' },
  message: { fontFamily: fonts.body, fontSize: 14, color: colors.muted, marginTop: 8, textAlign: 'center' },
  btn: { marginTop: spacing.lg, minWidth: 160 },
});
