import { Stack } from 'expo-router';

export default function AppLayout() {
  // This layout applies to all screens inside the (app) folder.
  // For now, it just makes them part of a stack.
  return <Stack screenOptions={{ headerShown: false }} />;
}