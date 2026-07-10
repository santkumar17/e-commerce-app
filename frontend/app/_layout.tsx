import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { PlayfairDisplay_500Medium } from '@expo-google-fonts/playfair-display';
import { DMSans_400Regular, DMSans_500Medium } from '@expo-google-fonts/dm-sans';
import { useEffect } from 'react';
import { LogBox, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useIconFonts } from '@/src/hooks/use-icon-fonts';
import { AuthProvider } from '@/src/auth';
import { ResponsiveFrame } from '@/src/components/ResponsiveFrame';

LogBox.ignoreAllLogs(true);
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [iconsLoaded, iconsError] = useIconFonts();
  const [displayFontsLoaded, displayFontsError] = useFonts({
    PlayfairDisplay_500Medium,
    DMSans_400Regular,
    DMSans_500Medium,
  });

  const loaded = iconsLoaded && displayFontsLoaded;
  const error = iconsError || displayFontsError;

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar barStyle="dark-content" backgroundColor="#FAF9F6" />
          <ResponsiveFrame>
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FAF9F6' } }} />
          </ResponsiveFrame>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
