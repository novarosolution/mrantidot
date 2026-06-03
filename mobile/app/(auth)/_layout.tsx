import { Stack } from 'expo-router';
import { design } from '@/constants/theme';

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: design.screenBg } }} />;
}
