import React, { createContext, useContext, useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { HouseholdMember, Child } from '../types/db';

interface HouseholdContextValue {
  user: User | null;
  householdId: string | null;
  childId: string | null;
  members: HouseholdMember[];
  needsOnboarding: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  forceOnboarding: () => void;
}

const HouseholdContext = createContext<HouseholdContextValue | undefined>(undefined);

export function HouseholdProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [childId, setChildId] = useState<string | null>(null);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const forcedOnboardingRef = useRef(false);

  // Update last_active_at timestamp for activity tracking
  const updateLastActive = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('household_members')
        .update({ last_active_at: new Date().toISOString() })
        .eq('user_id', userId)
        .select();

      if (error) {
        // Silently fail - this is not critical for app functionality
        console.log('Could not update last_active_at (non-critical):', error.message);
        return;
      }

      // If no rows were updated, user might not have a household_member record yet
      if (!data || data.length === 0) {
        console.log('No household_member found for user, skipping last_active_at update');
        return;
      }
    } catch (err) {
      // Silently fail - this is not critical for app functionality
      console.log('Could not update last_active_at (non-critical)');
    }
  };

  const loadHouseholdData = async (currentUser: User) => {
    // Skip if in forced onboarding mode
    if (forcedOnboardingRef.current) {
      return;
    }

    try {
      setError(null);

      // 1. Fetch household memberships for current user
      const { data: memberships, error: membershipsError } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', currentUser.id);

      if (membershipsError) throw membershipsError;

      if (!memberships || memberships.length === 0) {
        // No household found, needs onboarding
        setNeedsOnboarding(true);
        setHouseholdId(null);
        setChildId(null);
        setMembers([]);
        return;
      }

      // Update last active timestamp (only if user has a household)
      // Run in background - don't await or block on errors
      updateLastActive(currentUser.id).catch(() => {
        // Silently ignore - not critical
      });

      // Pick first household
      const activeHouseholdId = memberships[0].household_id;
      setHouseholdId(activeHouseholdId);
      setNeedsOnboarding(false);

      // 2. Fetch children for this household
      const { data: childrenData, error: childrenError } = await supabase
        .from('children')
        .select('id, name')
        .eq('household_id', activeHouseholdId)
        .order('created_at', { ascending: true });

      if (childrenError) throw childrenError;

      if (childrenData && childrenData.length > 0) {
        setChildId(childrenData[0].id);
      } else {
        setChildId(null);
      }

      // 3. Fetch all household members for display names
      const { data: membersData, error: membersError } = await supabase
        .from('household_members')
        .select('*')
        .eq('household_id', activeHouseholdId);

      if (membersError) throw membersError;

      setMembers(membersData || []);
    } catch (err) {
      console.error('Error loading household data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load household data');
    }
  };

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      forcedOnboardingRef.current = false; // Reset forced onboarding flag
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        await loadHouseholdData(currentUser);
      }
    } catch (err) {
      console.error('Error in refresh:', err);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- loadHouseholdData uses only stable refs and setters
  }, []);

  const forceOnboarding = useCallback(() => {
    forcedOnboardingRef.current = true;
    setNeedsOnboarding(true);
    setHouseholdId(null);
    setChildId(null);
    setMembers([]);
  }, []);

  // Periodic activity tracking - update every 5 minutes while app is active
  useEffect(() => {
    if (!user || needsOnboarding || !householdId) return;

    const activityInterval = setInterval(() => {
      updateLastActive(user.id).catch(() => {
        // Silently ignore - not critical
      });
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(activityInterval);
  }, [user, needsOnboarding, householdId]);

  useEffect(() => {
    // Check initial session
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          setUser(session.user);

          // Check for URL parameter to force onboarding (for testing) - web only
          let forceOnboardingMode = false;
          if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
            const params = new URLSearchParams(window.location.search);
            if (params.get('onboarding') === 'true') {
              // Remove the parameter from URL
              params.delete('onboarding');
              const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
              window.history.replaceState({}, '', newUrl);
              forceOnboardingMode = true;
            }
          }

          if (forceOnboardingMode) {
            // Force onboarding mode
            forcedOnboardingRef.current = true;
            setNeedsOnboarding(true);
            setHouseholdId(null);
            setChildId(null);
            setMembers([]);
          } else {
            await loadHouseholdData(session.user);
          }
        } else {
          setUser(null);
          setNeedsOnboarding(false);
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        // Don't show error for missing/invalid refresh token - just treat as logged out
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize';
        if (!errorMessage.includes('Refresh Token') && !errorMessage.includes('refresh token')) {
          setError(errorMessage);
        }
        // Set user to null so app shows login screen
        setUser(null);
        setNeedsOnboarding(false);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state changed:', event, 'User:', session?.user?.email);

      // Skip refetch on token refresh (but NOT initial session from deep link)
      // TOKEN_REFRESHED happens frequently and we don't want to reload data each time
      if (event === 'TOKEN_REFRESHED') {
        // Just update the user object, don't reload household data
        if (session?.user) {
          setUser(session.user);
        }
        return;
      }

      // Handle INITIAL_SESSION separately - this can come from deep links
      if (event === 'INITIAL_SESSION') {
        if (session?.user) {
          console.log('📱 Initial session detected, loading user data...');
          setUser(session.user);
          setLoading(true);
          try {
            await loadHouseholdData(session.user);
          } catch (err) {
            console.error('Error loading data from initial session:', err);
          } finally {
            setLoading(false);
          }
        }
        return;
      }

      if (session?.user) {
        setUser(session.user);
        setLoading(true);
        try {
          await loadHouseholdData(session.user);
        } catch (err) {
          console.error('Error in auth state change handler:', err);
        } finally {
          setLoading(false);
        }
      } else {
        setUser(null);
        setHouseholdId(null);
        setChildId(null);
        setMembers([]);
        setNeedsOnboarding(false);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<HouseholdContextValue>(() => ({
    user,
    householdId,
    childId,
    members,
    needsOnboarding,
    loading,
    error,
    refresh,
    forceOnboarding,
  }), [user, householdId, childId, members, needsOnboarding, loading, error, refresh, forceOnboarding]);

  return (
    <HouseholdContext.Provider value={value}>
      {children}
    </HouseholdContext.Provider>
  );
}

export function useHousehold() {
  const context = useContext(HouseholdContext);
  if (context === undefined) {
    throw new Error('useHousehold must be used within a HouseholdProvider');
  }
  return context;
}
