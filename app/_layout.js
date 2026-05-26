import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="index"    options={{ animation: 'none' }} />
        <Stack.Screen name="welcome"  options={{ animation: 'fade' }} />
        <Stack.Screen name="signup"   />
        <Stack.Screen name="signin"   />
        <Stack.Screen name="name"     />
        <Stack.Screen name="birthday" />
        <Stack.Screen name="avatar"   />
        <Stack.Screen name="setup"    />
        <Stack.Screen name="pairing"  />
        <Stack.Screen name="tutorial" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="(tabs)"   options={{ animation: 'fade', gestureEnabled: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}
