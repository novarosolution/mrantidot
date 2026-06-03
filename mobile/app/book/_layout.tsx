import { Stack } from 'expo-router';
import { design } from '@/constants/theme';

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: design.screenBg },
      }}
    />
  );
}
