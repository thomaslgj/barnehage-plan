import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
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

  const refresh = async () => {
    setLoading(true);
    forcedOnboardingRef.current = false; // Reset forced onboarding flag
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser) {
      await loadHouseholdData(currentUser);
    }
    setLoading(false);
  };

  const forceOnboarding = () => {
    forcedOnboardingRef.current = true;
    setNeedsOnboarding(true);
    setHouseholdId(null);
    setChildId(null);
    setMembers([]);
  };

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
        setError(err instanceof Error ? err.message : 'Failed to initialize');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);

      if (session?.user) {
        setUser(session.user);
        setLoading(true);
        await loadHouseholdData(session.user);
        setLoading(false);
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

  const value: HouseholdContextValue = {
    user,
    householdId,
    childId,
    members,
    needsOnboarding,
    loading,
    error,
    refresh,
    forceOnboarding,
  };

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
