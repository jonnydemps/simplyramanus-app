'use client';

// Keep all necessary hooks imported, remove unused createContext if using React.createContext
import React, { useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
// import { useRouter, usePathname } from 'next/navigation'; // Removed useRouter, usePathname not needed here

// Profile type
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
  isLoading: true,
};

// Use React.createContext directly (createContext from import is unused)
const AuthContext = React.createContext<AuthContextType>(defaultAuthContextValue);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // --- MOVED useRef to Top Level ---
  const isMountedRef = useRef(true); // Define useRef here

  // State hooks
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // const router = useRouter(); // Removed - not used

  // fetchProfile function (using Supabase client)
  const fetchProfile = useCallback(async (userId: string | undefined) => {
      if (!userId) {
          console.log("AuthProvider (Supabase Client): fetchProfile called without userId, clearing profile.");
          setProfile(null);
          return;
      }
      console.log(`AuthProvider (Supabase Client): Fetching profile for user ID: ${userId}`);

      try {
          const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('id, company_name, contact_email, contact_phone, is_admin, created_at, updated_at') // Select all needed fields
              .eq('id', userId)
              .single(); // Expect a single profile

          if (profileError) {
              // Handle specific errors like RLS denial or not found
              if (profileError.code === 'PGRST116') { // PostgREST code for "Not Found"
                  console.warn(`AuthProvider (Supabase Client): Profile not found for user ${userId} or RLS denied access.`);
              } else {
                  console.error('AuthProvider (Supabase Client): Error fetching profile:', profileError);
              }
              setProfile(null); // Clear profile on error
              console.log("AuthProvider: Set profile to null due to fetch error.");
          } else if (profileData) {
              console.log("AuthProvider (Supabase Client): Profile data fetched:", profileData);
              setProfile(profileData as Profile);
              console.log("AuthProvider: Set profile state with fetched data:", profileData);
          } else {
              // Handle case where no error but data is null (shouldn't happen with .single() unless RLS issue)
              console.warn(`AuthProvider (Supabase Client): Profile data was null without error for user ${userId}.`);
              setProfile(null);
              console.log("AuthProvider: Set profile to null due to null data without error.");
          }
      } catch (catchError) {
          console.error("AuthProvider (Supabase Client): Caught exception during fetchProfile:", catchError);
          setProfile(null);
          console.log("AuthProvider: Set profile to null due to caught exception.");
      }
  }, []); // End useCallback

  // Effect solely for onAuthStateChange listener
  useEffect(() => {
      // Set mount status ref to true when effect runs
      isMountedRef.current = true;
      console.log("AuthProvider: Setting up onAuthStateChange listener (V7 - Hook Fix).");
      let initialCheckDone = false;

      // Keep subscription variable - it's used in cleanup
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (_event, session) => {
              // Use ref to check mount status
              if (!isMountedRef.current) {
                  console.log("AuthProvider: Unmounted, ignoring auth state change.");
                  return;
              }
              console.log("AuthProvider: Auth state changed (V7):", _event, session ? "Got session" : "No session");

              setSession(session);
              setUser(session?.user ?? null);
              const profileUserId = session?.user?.id;

              if (session) {
                  const expiresIn = session.expires_at ? (session.expires_at * 1000 - Date.now()) / 1000 : 'N/A';
                  console.log(`AuthProvider: Session details before fetch (V7) - User ID: ${profileUserId}, ExpiresIn: ${expiresIn}s`);
              } else {
                  console.log("AuthProvider: No session before fetch (V7).");
                  // If session becomes null (logout), clear profile immediately
                  setProfile(null);
              }

              // Fetch profile only if there's a user ID
              if (profileUserId) {
                  console.log(`AuthProvider: >>> Calling fetchProfile (Supabase Client) for ${profileUserId} (V7)...`);
                  await fetchProfile(profileUserId); // Pass only userId now
                  console.log(`AuthProvider: <<< fetchProfile (Supabase Client) call completed for ${profileUserId} (V7).`);
              } else {
                  // Ensure profile is null if there's no user
                  setProfile(null);
              }


              // --- MOVED Loading state update ---
              // Set loading false only after the first successful auth state check (session or no session)
              // AND profile fetch attempt is complete (or skipped if no user), regardless of profile success/failure.
              if (!initialCheckDone) {
                  console.log("AuthProvider: Initial auth state processed (incl. profile fetch attempt), setting loading false (V7).");
                  setIsLoading(false);
                  initialCheckDone = true;
              }
          }
      );

      // Cleanup function for listener
      return () => {
          console.log("AuthProvider: Unsubscribing from onAuthStateChange.");
          isMountedRef.current = false; // Set ref on unmount
          subscription.unsubscribe(); // Use original variable name
      };
  // Added fetchProfile to dependency array as it's used inside
  }, [fetchProfile]); // Dependency array

  // signOut function
  const signOut = useCallback(async () => {
      console.log("AuthProvider: Signing out.");
      setIsLoading(true); // Set loading true during sign out
      setProfile(null); // Clear profile immediately on sign out action
      setUser(null); // Clear user immediately
      setSession(null); // Clear session immediately
      await supabase.auth.signOut();
      // No need to push here, onAuthStateChange will trigger and middleware/redirector will handle it
      // router.push('/signin');
      setIsLoading(false); // Set loading false after sign out completes
  }, []); // Removed router dependency

  // Memoized context value
  // Ignore exhaustive-deps warning if needed
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const value = useMemo(() => ({
      user,
      session,
      profile,
      signOut,
      isLoading
  }), [user, session, profile, signOut, isLoading]); // Dependencies are correct

  // --- REMOVED: Effect for handling redirects ---

  return (
      <AuthContext.Provider value={value}>
          {!isLoading ? children : <div>Loading...</div>}
      </AuthContext.Provider>
  );
};

// useAuth hook
export const useAuth = () => {
  const context = useContext(AuthContext); // useContext needs to be imported from React
  if (context === undefined) {
      throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
