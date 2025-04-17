'use client';

// Keep all necessary hooks imported, remove unused createContext if using React.createContext
import React, { useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
// import { useRouter, usePathname } from 'next/navigation'; // Keep useRouter for signOut

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
  profile: Profile | null; // Re-added profile
  signOut: () => Promise<void>;
  isLoading: boolean;
};

const defaultAuthContextValue: AuthContextType = {
  user: null,
  session: null,
  profile: null, // Re-added profile default
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
  const [profile, setProfile] = useState<Profile | null>(null); // Re-added profile state
  const [isLoading, setIsLoading] = useState(true);
  // const router = useRouter(); // Keep for signOut? No, signOut doesn't redirect anymore

  // fetchProfile function (using Supabase client)
  const fetchProfile = useCallback(async (userId: string | undefined) => {
      if (!userId) {
          console.log("AuthProvider (Restored): fetchProfile called without userId, clearing profile.");
          setProfile(null);
          return;
      }
      console.log(`AuthProvider (Restored): Fetching profile for user ID: ${userId}`);

      try {
          const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('id, company_name, contact_email, contact_phone, is_admin, created_at, updated_at') // Select all needed fields
              .eq('id', userId)
              .single(); // Expect a single profile

          if (profileError) {
              // Handle specific errors like RLS denial or not found
              if (profileError.code === 'PGRST116') { // PostgREST code for "Not Found"
                  console.warn(`AuthProvider (Restored): Profile not found for user ${userId} or RLS denied access.`);
              } else {
                  console.error('AuthProvider (Restored): Error fetching profile:', profileError);
              }
              setProfile(null); // Clear profile on error
              console.log("AuthProvider (Restored): Set profile to null due to fetch error.");
          } else if (profileData) {
              console.log("AuthProvider (Restored): Profile data fetched:", profileData);
              setProfile(profileData as Profile);
              console.log("AuthProvider (Restored): Set profile state with fetched data:", profileData);
          } else {
              // Handle case where no error but data is null (shouldn't happen with .single() unless RLS issue)
              console.warn(`AuthProvider (Restored): Profile data was null without error for user ${userId}.`);
              setProfile(null);
              console.log("AuthProvider (Restored): Set profile to null due to null data without error.");
          }
      } catch (catchError) {
          console.error("AuthProvider (Restored): Caught exception during fetchProfile:", catchError);
          setProfile(null);
          console.log("AuthProvider (Restored): Set profile to null due to caught exception.");
      }
  }, []); // End useCallback

  // Effect solely for onAuthStateChange listener
  useEffect(() => {
      // Set mount status ref to true when effect runs
      isMountedRef.current = true;
      console.log("AuthProvider (Restored): Setting up onAuthStateChange listener.");
      let initialCheckDone = false;

      // Keep subscription variable - it's used in cleanup
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (_event, session) => {
              // Use ref to check mount status
              if (!isMountedRef.current) {
                  console.log("AuthProvider (Restored): Unmounted, ignoring auth state change.");
                  return;
              }
              console.log("AuthProvider (Restored): Auth state changed:", _event, session ? "Got session" : "No session");

              setSession(session);
              setUser(session?.user ?? null);
              const profileUserId = session?.user?.id;

              if (session) {
                  const expiresIn = session.expires_at ? (session.expires_at * 1000 - Date.now()) / 1000 : 'N/A';
                  console.log(`AuthProvider (Restored): Session details - User ID: ${profileUserId}, ExpiresIn: ${expiresIn}s`);
              } else {
                  console.log("AuthProvider (Restored): No session.");
                  // If session becomes null (logout), clear profile immediately
                  setProfile(null);
              }

              // Fetch profile only if there's a user ID
              if (profileUserId) {
                  console.log(`AuthProvider (Restored): >>> Calling fetchProfile for ${profileUserId}...`);
                  await fetchProfile(profileUserId); // Pass only userId now
                  console.log(`AuthProvider (Restored): <<< fetchProfile call completed for ${profileUserId}.`);
              } else {
                  // Ensure profile is null if there's no user
                  setProfile(null);
              }


              // Set loading false only after the first successful auth state check
              // AND profile fetch attempt is complete (or skipped if no user)
              if (!initialCheckDone) {
                  console.log("AuthProvider (Restored): Initial auth state processed, setting loading false.");
                  setIsLoading(false);
                  initialCheckDone = true;
              }
          }
      );

      // Cleanup function
      return () => {
          console.log("AuthProvider (Restored): Unsubscribing from onAuthStateChange.");
          isMountedRef.current = false;
          subscription.unsubscribe();
      };
  // Added fetchProfile to dependency array
  }, [fetchProfile]);

  // signOut function
  const signOut = useCallback(async () => {
      console.log("AuthProvider (Restored): Signing out.");
      setIsLoading(true);
      setProfile(null); // Clear profile immediately
      setUser(null);
      setSession(null);
      await supabase.auth.signOut();
      // Redirect is handled by AuthRedirector now
      setIsLoading(false);
  }, []);

  // Memoized context value
  const value = useMemo(() => ({
      user,
      session,
      profile, // Re-added profile
      signOut,
      isLoading
  // Re-added profile dependency
  }), [user, session, profile, signOut, isLoading]);

  // --- NO redirect logic here ---

  return (
      <AuthContext.Provider value={value}>
          {!isLoading ? children : <div>Loading Auth...</div>}
      </AuthContext.Provider>
  );
};

// useAuth hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
      throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
