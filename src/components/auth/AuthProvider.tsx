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
  isLoading: true,
};

const AuthContext = createContext<AuthContextType>(defaultAuthContextValue);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
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


  // Effect solely for onAuthStateChange listener (REMOVED explicit refresh)
  useEffect(() => {
      let isMounted = true;
      console.log("AuthProvider: Setting up onAuthStateChange listener (V3 - No explicit refresh).");
      let initialCheckDone = false;

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (_event, session) => {
              if (!isMounted) return;
              console.log("AuthProvider: Auth state changed (V3):", _event, session ? "Got session" : "No session");

              setSession(session);
              setUser(session?.user ?? null);
              const profileUserId = session?.user?.id;

              // Log session details before fetch
              if (session) {
                  const expiresIn = session.expires_at ? (session.expires_at * 1000 - Date.now()) / 1000 : 'N/A';
                  console.log(`AuthProvider: Session details before fetch (V3) - User ID: ${profileUserId}, ExpiresIn: ${expiresIn}s`);
              } else {
                  console.log("AuthProvider: No session before fetch (V3).");
              }

              // Fetch profile based on the current user ID
              console.log(`AuthProvider: >>> Calling fetchProfile for ${profileUserId} (V3)...`); // Log BEFORE await
              await fetchProfile(profileUserId);
              console.log(`AuthProvider: <<< fetchProfile call completed for ${profileUserId} (V3).`); // Log AFTER await

              // Set loading false after first event processed
              if (!initialCheckDone) {
                  console.log("AuthProvider: Initial auth state processed, setting loading false (V3).");
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
  }, [fetchProfile]); // Removed router dependency again

  // signOut function remains the same
  const signOut = useCallback(async () => { /* ... */ }, [router]);
  // Memoized context value remains the same
  const value = useMemo(() => ({ /* ... */ }), [user, session, profile, signOut, isLoading]);

  return (
      <AuthContext.Provider value={value}>
          {!isLoading ? children : <div>Loading...</div>}
      </AuthContext.Provider>
  );
};

// useAuth hook remains the same
export const useAuth = () => { /* ... */ };