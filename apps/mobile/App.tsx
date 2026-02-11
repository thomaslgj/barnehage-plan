import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HouseholdProvider, useHousehold } from './src/contexts/HouseholdProvider';
import AuthScreen from './src/screens/AuthScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import MainScreen from './src/screens/MainScreen';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { user, needsOnboarding, loading } = useHousehold();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="Auth" component={AuthScreen} />
      ) : needsOnboarding ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : (
        <Stack.Screen
          name="Main"
          component={MainScreen}
          options={{
            headerShown: true,
            title: 'Barnehage Plan',
            headerStyle: {
              backgroundColor: '#fff',
            },
            headerTintColor: '#111827',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <HouseholdProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
        <StatusBar style="auto" />
      </HouseholdProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
});
