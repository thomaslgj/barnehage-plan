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
import BiometricSettingsScreen from './src/screens/BiometricSettingsScreen';
import PrivacySettingsScreen from './src/screens/PrivacySettingsScreen';
import NotificationsSettingsScreen from './src/screens/NotificationsSettingsScreen';
import EquipmentManagementScreen from './src/screens/EquipmentManagementScreen';
import SplashScreen from './src/components/SplashScreen';
import { View, ActivityIndicator, Animated, Linking, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

function LoadingScreen() {
  return <View style={{ flex: 1, backgroundColor: '#2d2520' }} />;
}
import tw from './src/lib/tw';
import { useFonts, PlusJakartaSans_300Light, PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans';
import * as Notifications from 'expo-notifications';
import {
  setupNotificationChannel,
  getNotificationSettings,
  scheduleEquipmentNotification,
} from './src/services/notifications';
import { supabase } from './src/lib/supabase';

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
  const splashCompletedRef = useRef(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Handle deep links for auth callbacks
  useEffect(() => {
    // Handle initial URL (app opened via link)
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    // Handle subsequent URLs (app already open)
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleDeepLink = async (url: string) => {
    console.log('Deep link received:', url);

    // Check for errors in the deep link (e.g., expired confirmation link)
    if (url.includes('#error=') || url.includes('?error=')) {
      try {
        const urlObj = new URL(url);
        const params = new URLSearchParams(urlObj.hash.substring(1) || urlObj.search);

        const error = params.get('error');
        const errorCode = params.get('error_code');
        const errorDescription = params.get('error_description');

        console.log('Deep link error:', error, errorCode, errorDescription);

        if (errorCode === 'otp_expired') {
          Alert.alert(
            'Lenken har utløpt',
            'Bekreftelses-lenken er for gammel. Registrer deg på nytt for å få en ny lenke.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            'Feil',
            errorDescription || 'Noe gikk galt med lenken.',
            [{ text: 'OK' }]
          );
        }
      } catch (error) {
        console.error('Error parsing deep link error:', error);
      }
      return;
    }

    // Check for invite code in deep link (flyt://onboarding?code=xxx)
    const codeMatch = url.match(/[?&]code=([^&]+)/);
    if (codeMatch) {
      const code = decodeURIComponent(codeMatch[1]);
      console.log('Invite code from deep link:', code);
      await AsyncStorage.setItem('@pending_invite_code', code);
      return;
    }

    // Check if it's an auth callback with tokens
    if (url.includes('#access_token') || url.includes('?access_token')) {
      try {
        // Extract the URL params
        const urlObj = new URL(url);
        const params = new URLSearchParams(urlObj.hash.substring(1) || urlObj.search);

        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const type = params.get('type');

        if (accessToken && refreshToken) {
          console.log('Setting session from deep link, type:', type);

          // Set the session with Supabase
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('Error setting session:', error);
            Alert.alert('Feil', 'Kunne ikke bekrefte e-posten din. Prøv igjen.');
          } else {
            console.log('✅ Session set successfully! User:', data.user?.email);
            console.log('Auth state change will trigger, HouseholdProvider will handle navigation');
            // HouseholdProvider's onAuthStateChange will detect this and load household data
          }
        }
      } catch (error) {
        console.error('Error handling deep link:', error);
      }
    }
  };

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

  // Start timer when loading begins (but only on first render, never reset after splash completes)
  useEffect(() => {
    const isFirstRender = prevLoadingRef.current === null;
    const loadingStarted = loading && !prevLoadingRef.current;

    // Only initialize splash on first render, never reset after completion
    if ((isFirstRender || loadingStarted) && !splashCompletedRef.current) {
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
      }, 100); // Reduced from 2000ms to 100ms for faster startup
    }

    prevLoadingRef.current = loading;
  }, [loading, fadeAnim]);

  // Trigger fade-out when ready to show main content
  useEffect(() => {
    if (!loading && minSplashTimeElapsed && !isFadingOut && !splashCompletedRef.current) {
      // Mark as completed immediately to prevent any resets during fade
      splashCompletedRef.current = true;
      setIsFadingOut(true);

      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200, // Reduced from 500ms for faster startup
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

  const shouldShowSplash = !splashCompletedRef.current && (loading || !minSplashTimeElapsed || !fadeComplete);

  // Linking configuration for deep links
  const linking = {
    prefixes: ['flyt://', 'https://flytfamilie.no'],
    config: {
      screens: {
        Auth: 'auth',
        Main: '',
        Onboarding: 'onboarding',
      },
    },
  };

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
        ) : loading ? (
          // Keep showing a blank screen while determining onboarding status
          <Stack.Screen
            name="Loading"
            component={LoadingScreen}
          />
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
              name="BiometricSettings"
              component={BiometricSettingsScreen}
              options={{
                headerShown: false,
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen
              name="PrivacySettings"
              component={PrivacySettingsScreen}
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
            zIndex: 9999,
            backgroundColor: '#2B1E16', // Match splash background color
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
    PlusJakartaSans_300Light,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  // Linking configuration for deep links
  const linking = {
    prefixes: ['flyt://', 'https://flytfamilie.no'],
    config: {
      screens: {
        Auth: 'auth',
        Main: '',
        Onboarding: 'onboarding',
      },
    },
  };

  if (!fontsLoaded) {
    return null; // or return a loading screen
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <HouseholdProvider>
          <NavigationContainer theme={WarmNavigationTheme} linking={linking}>
            <AppNavigator />
          </NavigationContainer>
          <StatusBar style="light" />
        </HouseholdProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
