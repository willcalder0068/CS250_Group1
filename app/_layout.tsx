// app/_layout.tsx

import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      {/* The index route, which is your login screen */}
      <Stack.Screen name="index" options={{ headerShown: false }} />

      {/* The (app) group, which contains your dashboard */}
      <Stack.Screen name="(app)" options={{ headerShown: false }} />
    </Stack>
  );
}