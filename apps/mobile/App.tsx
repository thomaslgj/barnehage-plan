import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HouseholdProvider, useHousehold } from './src/contexts/HouseholdProvider';
import AuthScreen from './src/screens/AuthScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import MainScreen from './src/screens/MainScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SplashScreen from './src/components/SplashScreen';
import { View, ActivityIndicator } from 'react-native';
import tw from './src/lib/tw';
import { useFonts, Manrope_300Light, Manrope_400Regular, Manrope_500Medium } from '@expo-google-fonts/manrope';

// Custom warm theme to prevent white flash
const WarmNavigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#7fa884', // sage green
    background: '#2d2520', // warm chocolate brown
    card: '#3d332d', // warm brown
    text: '#f5f1ed', // warm cream
    border: '#4a3f38', // warm brown
    notification: '#7fa884', // sage green
  },
};

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { user, needsOnboarding, loading } = useHousehold();
  const [minSplashTimeElapsed, setMinSplashTimeElapsed] = useState(false);
  const prevLoadingRef = useRef<boolean | null>(null);
  const splashTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Start timer when loading begins
  useEffect(() => {
    const isFirstRender = prevLoadingRef.current === null;
    const loadingStarted = loading && !prevLoadingRef.current;

    if (isFirstRender || loadingStarted) {
      // Clear any existing timer
      if (splashTimerRef.current) {
        clearTimeout(splashTimerRef.current);
      }

      // Reset the elapsed flag
      setMinSplashTimeElapsed(false);

      // Start new timer
      splashTimerRef.current = setTimeout(() => {
        setMinSplashTimeElapsed(true);
      }, 2500);
    }

    prevLoadingRef.current = loading;
  }, [loading]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (splashTimerRef.current) {
        clearTimeout(splashTimerRef.current);
      }
    };
  }, []);

  // Show splash until both loading is done AND minimum time has elapsed
  if (loading || !minSplashTimeElapsed) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#2d2520' }, // bg-background color (warm brown)
      }}
    >
      {!user ? (
        <Stack.Screen name="Auth" component={AuthScreen} />
      ) : needsOnboarding ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : (
        <>
          <Stack.Screen
            name="Main"
            component={MainScreen}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Manrope_300Light,
    Manrope_400Regular,
    Manrope_500Medium,
  });

  if (!fontsLoaded) {
    return null; // or return a loading screen
  }

  return (
    <SafeAreaProvider>
      <HouseholdProvider>
        <NavigationContainer theme={WarmNavigationTheme}>
          <AppNavigator />
        </NavigationContainer>
        <StatusBar style="light" />
      </HouseholdProvider>
    </SafeAreaProvider>
  );
}
