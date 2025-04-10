'use client';

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

// Profile type remains the same
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
  // isLoading determines if we know the initial auth state yet
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // fetchProfile function remains the same
  const fetchProfile = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      console.log("AuthProvider: fetchProfile called without userId, clearing profile.");
      setProfile(null);
      return;
    }
    console.log(`AuthProvider: Fetching profile for user ID: ${userId}`);
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, company_name, contact_email, contact_phone, is_admin, created_at, updated_at')
        .eq('id', userId)
        .single();

      if (profileError) {
        if (profileError.code === 'PGRST116') {
           console.warn(`AuthProvider: Profile not found for user ${userId} or RLS denied access.`);
        } else {
           console.error('AuthProvider: Error fetching profile:', profileError);
        }
        setProfile(null);
      } else {
        console.log("AuthProvider: Profile data fetched:", profileData);
        setProfile(profileData as Profile);
      }
    } catch (catchError) {
      console.error("AuthProvider: Caught exception fetching profile:", catchError);
      setProfile(null);
    }
  }, []);

  // *** REMOVED the separate useEffect for getSession ***

  // Effect solely for onAuthStateChange listener - handles initial state too
  useEffect(() => {
    let isMounted = true;
    console.log("AuthProvider: Setting up onAuthStateChange listener.");

    // Flag to ensure setIsLoading(false) is only called once after the initial state is processed
    let initialCheckDone = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        // Ignore updates if component is unmounted
        if (!isMounted) {
          console.log("AuthProvider: Unmounted, ignoring auth state change.");
          return;
        }
        console.log("AuthProvider: Auth state changed:", _event, session ? "Got session" : "No session");

        // Update session and user state
        setSession(session);
        setUser(session?.user ?? null);

        // Fetch profile based on the current session state
        // fetchProfile handles the case where session?.user?.id is undefined
        await fetchProfile(session?.user?.id);

        // Crucially, mark loading as false *after* the first event is processed
        // This handles both initial load (with or without session) and subsequent changes
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
      isMounted = false;
      subscription.unsubscribe();
    };
  // Rerun effect only if fetchProfile or router changes (which they shouldn't frequently)
  }, [fetchProfile, router]);

  // signOut function remains the same
  const signOut = useCallback(async () => {
    console.log("AuthProvider: Signing out.");
    setIsLoading(true); // Indicate loading
    await supabase.auth.signOut();
    // Let onAuthStateChange handle setting user/profile to null and isLoading to false
    router.push('/signin');
  }, [router]);

  // Memoized context value remains the same
  const value = useMemo(() => ({
    user,
    session,
    profile,
    signOut,
    isLoading
  }), [user, session, profile, signOut, isLoading]);

  return (
    <AuthContext.Provider value={value}>
      {/* Show loading indicator until the initial auth state is known */}
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