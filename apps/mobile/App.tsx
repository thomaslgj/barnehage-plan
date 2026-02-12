import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HouseholdProvider, useHousehold } from './src/contexts/HouseholdProvider';
import AuthScreen from './src/screens/AuthScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import MainScreen from './src/screens/MainScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import { View, ActivityIndicator } from 'react-native';
import tw from './src/lib/tw';

// Custom dark theme to prevent white flash
const DarkNavigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#10b981', // emerald-500
    background: '#0f172a', // slate-900
    card: '#1e293b', // slate-800
    text: '#ffffff',
    border: '#334155', // slate-700
    notification: '#10b981', // emerald-500
  },
};

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { user, needsOnboarding, loading } = useHousehold();

  if (loading) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-background`}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0f172a' }, // bg-background color
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
        <NavigationContainer theme={DarkNavigationTheme}>
          <AppNavigator />
        </NavigationContainer>
        <StatusBar style="light" />
      </HouseholdProvider>
    </SafeAreaProvider>
  );
}
