import { Stack } from 'expo-router';

export default function CreateLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="reels/index" />
      <Stack.Screen name="reels/preview" />
      <Stack.Screen name="reels/post" />
    </Stack>
  );
}
