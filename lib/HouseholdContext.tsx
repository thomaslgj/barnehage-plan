"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

interface HouseholdContextValue {
  user: User | null;
  householdId: string | null;
  childId: string | null;
  needsOnboarding: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const HouseholdContext = createContext<HouseholdContextValue>({
  user: null,
  householdId: null,
  childId: null,
  needsOnboarding: false,
  loading: true,
  error: null,
  refresh: async () => {},
});

export function useHousehold() {
  return useContext(HouseholdContext);
}

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [childId, setChildId] = useState<string | null>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHousehold = useCallback(async (currentUser: User) => {
    setError(null);

    // Query household_members where user_id = auth.uid()
    const { data: members, error: membersError } = await supabase
      .from("household_members")
      .select("household_id")
      .eq("user_id", currentUser.id);

    if (membersError) {
      setError(membersError.message);
      setLoading(false);
      return;
    }

    if (!members || members.length === 0) {
      setNeedsOnboarding(true);
      setHouseholdId(null);
      setChildId(null);
      setLoading(false);
      return;
    }

    // Pick first household_id as active
    const activeHouseholdId = members[0].household_id;
    setHouseholdId(activeHouseholdId);

    // Query children for that household; pick first child_id
    const { data: childrenData, error: childrenError } = await supabase
      .from("children")
      .select("id")
      .eq("household_id", activeHouseholdId);

    if (childrenError) {
      setError(childrenError.message);
      setLoading(false);
      return;
    }

    if (childrenData && childrenData.length > 0) {
      setChildId(childrenData[0].id);
    } else {
      setChildId(null);
    }

    setNeedsOnboarding(false);
    setLoading(false);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();
    if (currentUser) {
      setUser(currentUser);
      await loadHousehold(currentUser);
    } else {
      setLoading(false);
    }
  }, [loadHousehold]);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        loadHousehold(session.user);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        loadHousehold(session.user);
      } else {
        setUser(null);
        setHouseholdId(null);
        setChildId(null);
        setNeedsOnboarding(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadHousehold]);

  return (
    <HouseholdContext.Provider
      value={{
        user,
        householdId,
        childId,
        needsOnboarding,
        loading,
        error,
        refresh,
      }}
    >
      {children}
    </HouseholdContext.Provider>
  );
}

