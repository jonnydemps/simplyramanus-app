'use client';

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

// Profile type (ensure this matches database.types.ts and your actual schema)
type Profile = {
  id: string;
  company_name: string;
  contact_email: string;
  contact_phone?: string | null;
  is_admin: boolean;
  created_at?: string | null;
  updated_at?: string | null;
};

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  signOut: () => Promise<void>;
  isLoading: boolean;
};

const defaultAuthContextValue: AuthContextType = {
  user: null,
  session: null,
  profile: null,
  signOut: async () => {},
  isLoading: true, // Start loading initially
};

const AuthContext = createContext<AuthContextType>(defaultAuthContextValue);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Memoized fetchProfile function
  const fetchProfile = useCallback(async (userId: string | undefined) => {
    // Added check for isMounted flag at the beginning if needed, but managing via useEffect cleanup is typical
    if (!userId) {
        console.log("AuthProvider: fetchProfile called without userId, clearing profile.");
        setProfile(null); // Clear profile if no user ID
        return;
    }

    console.log(`AuthProvider: Fetching profile for user ID: ${userId}`); // Debug log
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, company_name, contact_email, contact_phone, is_admin, created_at, updated_at')
        .eq('id', userId) // Correct: Filter by 'id' column
        .single();

      if (profileError) {
        if (profileError.code === 'PGRST116') { // Profile not found / RLS denies row
           console.warn(`AuthProvider: Profile not found for user ${userId} or RLS denied access. Trigger might not have run or RLS incorrect.`);
        } else {
           console.error('AuthProvider: Error fetching profile:', profileError);
        }
        setProfile(null); // Set profile to null if error or not found
      } else {
        console.log("AuthProvider: Profile data fetched:", profileData); // Debug log
        setProfile(profileData as Profile); // Assuming data structure matches
      }
    } catch (catchError) {
        console.error("AuthProvider: Caught exception fetching profile:", catchError);
        setProfile(null); // Clear profile on exception
    }
  }, []); // Dependencies for useCallback (supabase client is stable)

  // Effect solely for onAuthStateChange listener - handles initial state too
  useEffect(() => {
      let isMounted = true; // Flag to prevent state updates after unmount
      console.log("AuthProvider: Setting up onAuthStateChange listener (sole handler).");

      // Flag to ensure setIsLoading(false) only called once after initial check
      let initialCheckDone = false;

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (_event, session) => {
              // Ignore updates if component is unmounted
              if (!isMounted) {
                  console.log("AuthProvider: Unmounted, ignoring auth state change.");
                  return;
              }
              console.log("AuthProvider: Auth state changed:", _event, session ? "Got session" : "No session");

              // Update session and user state regardless
              setSession(session);
              setUser(session?.user ?? null);

              // --- ADDED LOGS BEFORE FETCH ---
              if (session) {
                  const expiresIn = session.expires_at ? (session.expires_at * 1000 - Date.now()) / 1000 : 'N/A';
                  console.log(`AuthProvider: Session details before fetch - User ID: ${session.user.id}, ExpiresIn: ${expiresIn}s`);
              } else {
                  console.log("AuthProvider: No session before fetch.");
              }
              // --- END ADDED LOGS ---

              // Fetch profile based on the current session state
              // fetchProfile handles the case where session?.user?.id is undefined
              await fetchProfile(session?.user?.id);

              // Crucially, mark loading as false *after* the first event is processed
              if (!initialCheckDone) {
                  console.log("AuthProvider: Initial auth state processed, setting loading false.");
                  setIsLoading(false);
                  initialCheckDone = true;
              }
          }
      );

      // Cleanup function for listener
      return () => {
          console.log("AuthProvider: Unsubscribing from onAuthStateChange.");
          isMounted = false; // Set flag on unmount
          subscription.unsubscribe();
      };
  // Rerun effect only if fetchProfile reference changes (it shouldn't with useCallback)
  // Removed router dependency as refresh() wasn't used inside here
  }, [fetchProfile]);

  // signOut function (memoized)
  const signOut = useCallback(async () => {
      console.log("AuthProvider: Signing out.");
      setIsLoading(true); // Indicate loading during sign out process
      await supabase.auth.signOut();
      // onAuthStateChange listener will handle setting user/session/profile to null
      // and setting isLoading to false after the SIGNED_OUT event is processed.
      router.push('/signin'); // Redirect after sign out request initiated
  }, [router]);

  // Memoized context value
  const value = useMemo(() => ({
      user,
      session,
      profile,
      signOut,
      isLoading
  }), [user, session, profile, signOut, isLoading]);

  return (
    <AuthContext.Provider value={value}>
      {/* Show loading indicator until the initial auth state is determined */}
      {!isLoading ? children : <div>Loading...</div>}
    </AuthContext.Provider>
  );
};

// useAuth hook remains the same
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
      throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};