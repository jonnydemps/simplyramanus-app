'use client';

import React, { useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { createClient } from '@/lib/supabase/client'; // Corrected import path
import { Session, User, AuthChangeEvent, SupabaseClient } from '@supabase/supabase-js'; // Import necessary types

// Profile type - Keep this defined
type Profile = {
  id: string;
  company_name: string;
  contact_email: string;
  contact_phone?: string | null;
  is_admin: boolean;
  created_at?: string | null;
  updated_at?: string | null;
};

// AuthContextType - Keep this defined
type AuthContextType = {
  supabase: SupabaseClient;
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  signOut: () => Promise<void>;
  isLoading: boolean;
};

// Default Context Value - Needs to be defined BEFORE AuthContext
const defaultAuthContextValue: AuthContextType = {
  // No longer expect an error here as placeholder is typed
  supabase: {} as SupabaseClient, // Placeholder
  user: null,
  session: null,
  profile: null,
  signOut: async () => { console.warn("signOut called on default AuthContext"); },
  isLoading: true,
};

// AuthContext - Needs to be created using React.createContext
const AuthContext = React.createContext<AuthContextType>(defaultAuthContextValue);


// Hook to create a stable Supabase client instance
function useStableSupabaseClient() {
  const [client] = useState(() => createClient());
  return client;
}


export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const supabaseClient = useStableSupabaseClient(); // Get stable client instance
  const isMountedRef = useRef(true);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // fetchProfile function now uses the passed-in client
  const fetchProfile = useCallback(async (userId: string | undefined) => {
      if (!userId) {
          console.log("AuthProvider: fetchProfile called without userId, clearing profile.");
          setProfile(null);
          return;
      }
      console.log(`AuthProvider: Fetching profile for user ID: ${userId}`);

      try {
          // Use the stable client instance
          const { data: profileData, error: profileError } = await supabaseClient
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
          } else if (profileData) {
              setProfile(profileData as Profile);
          } else {
              console.warn(`AuthProvider: Profile data was null without error for user ${userId}.`);
              setProfile(null);
          }
      } catch (catchError) {
          console.error("AuthProvider: Caught exception during fetchProfile:", catchError);
          setProfile(null);
      }
  }, [supabaseClient]); // Depend on the client instance

  // Effect solely for onAuthStateChange listener
  useEffect(() => {
      isMountedRef.current = true;
      console.log("AuthProvider: Setting up onAuthStateChange listener.");
      let initialCheckDone = false;

      // Use the stable client instance
      const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
          async (event: AuthChangeEvent, session: Session | null) => { // Added types
              if (!isMountedRef.current) return;
              console.log("AuthProvider: Auth state changed:", event, session ? "Got session" : "No session");

              setSession(session);
              setUser(session?.user ?? null);
              const profileUserId = session?.user?.id;

              if (session) {
                  // Fetch profile only if session exists and user ID is present
                  if (profileUserId) {
                      await fetchProfile(profileUserId);
                  } else {
                      // Clear profile if session exists but user ID is missing (shouldn't happen)
                      setProfile(null);
                  }
              } else {
                  // Clear profile if session is null (logout)
                  setProfile(null);
              }

              if (!initialCheckDone) {
                  console.log("AuthProvider: Initial auth state processed, setting loading false.");
                  setIsLoading(false);
                  initialCheckDone = true;
              }
          }
      );

      // Initial check in case the listener doesn't fire immediately
      // Use stable client instance
      supabaseClient.auth.getSession().then(({ data: { session } }) => {
          if (!initialCheckDone) {
              console.log("AuthProvider: Initial getSession check completed.", session ? "Got session" : "No session");
              setSession(session);
              setUser(session?.user ?? null);
              const profileUserId = session?.user?.id;
              if (profileUserId) {
                  fetchProfile(profileUserId);
              } else {
                  setProfile(null);
              }
              console.log("AuthProvider: Initial auth state processed (from getSession), setting loading false.");
              setIsLoading(false);
              initialCheckDone = true;
          }
      });


      // Cleanup function
      return () => {
          console.log("AuthProvider: Unsubscribing from onAuthStateChange.");
          isMountedRef.current = false;
          subscription.unsubscribe();
      };
  // Added fetchProfile to dependency array
  }, [fetchProfile, supabaseClient]);

  // signOut function
  const signOut = useCallback(async () => {
      console.log("AuthProvider: Signing out.");
      setIsLoading(true);
      setProfile(null);
      setUser(null);
      setSession(null);
      // Use stable client instance
      await supabaseClient.auth.signOut();
      setIsLoading(false); // Set loading false after sign out completes
  // Depend on client instance
  }, [supabaseClient]);

  // Memoized context value
  const value = useMemo(() => ({
      supabase: supabaseClient, // Provide client via context
      user,
      session,
      profile,
      signOut,
      isLoading
  // Depend on client instance
  }), [supabaseClient, user, session, profile, signOut, isLoading]);


  return (
      // Use the value with the actual client instance
      <AuthContext.Provider value={value}>
          {!isLoading ? children : <div>Loading Auth...</div>}
      </AuthContext.Provider>
  );
};

// useAuth hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
      // This error means useAuth was called outside of AuthProvider context
      throw new Error('useAuth must be used within an AuthProvider');
  }
  // Now context is guaranteed to be defined, including the supabase client
  return context;
};
