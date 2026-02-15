import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { HouseholdProvider, useHousehold } from './src/contexts/HouseholdProvider';
import AuthScreen from './src/screens/AuthScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import MainScreen from './src/screens/MainScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import PersonalInfoScreen from './src/screens/PersonalInfoScreen';
import NotificationsSettingsScreen from './src/screens/NotificationsSettingsScreen';
import EquipmentManagementScreen from './src/screens/EquipmentManagementScreen';
import SplashScreen from './src/components/SplashScreen';
import { View, ActivityIndicator, Animated } from 'react-native';
import tw from './src/lib/tw';
import { useFonts, Manrope_300Light, Manrope_400Regular, Manrope_500Medium } from '@expo-google-fonts/manrope';
import * as Notifications from 'expo-notifications';
import {
  setupNotificationChannel,
  getNotificationSettings,
  scheduleEquipmentNotification,
} from './src/services/notifications';

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
  const { user, needsOnboarding, loading, householdId, members } = useHousehold();
  const [minSplashTimeElapsed, setMinSplashTimeElapsed] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [fadeComplete, setFadeComplete] = useState(false);
  const prevLoadingRef = useRef<boolean | null>(null);
  const splashTimerRef = useRef<NodeJS.Timeout | null>(null);
  const notificationInitializedRef = useRef(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Initialize notifications when user is logged in
  // NOTE: When running in Expo Go, you'll see warnings about remote push notifications
  // not being supported. These can be safely ignored - local scheduled notifications
  // (which we use) work perfectly fine in Expo Go.
  useEffect(() => {
    if (user && householdId && members.length > 0 && !needsOnboarding) {
      // Prevent double initialization
      if (notificationInitializedRef.current) {
        console.log('Notification already initialized, skipping...');
        return;
      }

      const initializeNotifications = async () => {
        try {
          console.log('\n=== APP INITIALIZATION: NOTIFICATIONS ===');

          // Mark as initialized
          notificationInitializedRef.current = true;

          // Set up notification channel (Android)
          await setupNotificationChannel();

          // Get current member
          const currentMember = members.find(m => m.user_id === user.id);
          if (!currentMember) {
            console.log('No current member found, skipping notification initialization');
            return;
          }

          // Get notification settings
          const settings = await getNotificationSettings(currentMember.id);
          console.log('Notification settings:', settings);

          // Only schedule if enabled
          if (settings.enabled) {
            console.log('Notifications enabled, checking permissions...');

            // Check if we have permission (but don't request it here at app start)
            const { status } = await Notifications.getPermissionsAsync();
            console.log('Current permission status:', status);

            if (status === 'granted') {
              console.log('Permission granted, scheduling notification...');
              await scheduleEquipmentNotification(householdId, settings.time);
            } else {
              console.log('⚠️  Permission not granted. User needs to enable notifications in settings.');
            }
          } else {
            console.log('Notifications disabled in settings');
          }

          console.log('=== END APP INITIALIZATION ===\n');
        } catch (error) {
          console.error('Error initializing notifications:', error);
        }
      };

      initializeNotifications();
    }
  }, [user, householdId, members, needsOnboarding]);

  // Start timer when loading begins
  useEffect(() => {
    const isFirstRender = prevLoadingRef.current === null;
    const loadingStarted = loading && !prevLoadingRef.current;

    if (isFirstRender || loadingStarted) {
      // Clear any existing timer
      if (splashTimerRef.current) {
        clearTimeout(splashTimerRef.current);
      }

      // Reset the elapsed flag and fade states
      setMinSplashTimeElapsed(false);
      setIsFadingOut(false);
      setFadeComplete(false);
      fadeAnim.setValue(1);

      // Start new timer
      splashTimerRef.current = setTimeout(() => {
        setMinSplashTimeElapsed(true);
      }, 3000);
    }

    prevLoadingRef.current = loading;
  }, [loading, fadeAnim]);

  // Trigger fade-out when ready to show main content
  useEffect(() => {
    if (!loading && minSplashTimeElapsed && !isFadingOut) {
      setIsFadingOut(true);
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setFadeComplete(true);
        }
      });
    }
  }, [loading, minSplashTimeElapsed, isFadingOut, fadeAnim]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (splashTimerRef.current) {
        clearTimeout(splashTimerRef.current);
      }
    };
  }, []);

  const shouldShowSplash = loading || !minSplashTimeElapsed || !fadeComplete;

  return (
    <View style={{ flex: 1 }}>
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
            <Stack.Screen
              name="PersonalInfo"
              component={PersonalInfoScreen}
              options={{
                headerShown: false,
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen
              name="NotificationsSettings"
              component={NotificationsSettingsScreen}
              options={{
                headerShown: false,
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen
              name="EquipmentManagement"
              component={EquipmentManagementScreen}
              options={{
                headerShown: false,
                animation: 'slide_from_right',
              }}
            />
          </>
        )}
      </Stack.Navigator>

      {/* Splash screen overlay with fade-out animation */}
      {shouldShowSplash && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: fadeAnim,
          }}
          pointerEvents={isFadingOut ? 'none' : 'auto'}
        >
          <SplashScreen />
        </Animated.View>
      )}
    </View>
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <HouseholdProvider>
          <NavigationContainer theme={WarmNavigationTheme}>
            <AppNavigator />
          </NavigationContainer>
          <StatusBar style="light" />
        </HouseholdProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
