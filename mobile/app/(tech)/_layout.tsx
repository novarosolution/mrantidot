import { Stack } from 'expo-router';
import { design } from '@/constants/theme';

export default function TechLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: design.screenBg } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="analytics" />
      <Stack.Screen name="job/[id]" />
    </Stack>
  );
}
