import React, { useState, useEffect } from 'react';
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

  // Ensure splash screen shows for at least 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinSplashTimeElapsed(true);
    }, 3000);

    return () => clearTimeout(timer);
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
