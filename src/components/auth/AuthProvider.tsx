'use client';

// Ensure all necessary hooks are imported from React
import React, { createContext, useEffect, useState, useCallback, useMemo, useContext, useRef } from 'react';
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

// Use React.createContext directly here
const AuthContext = React.createContext<AuthContextType>(defaultAuthContextValue);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // fetchProfile using direct fetch API (with type/lint fixes from previous step)
  const fetchProfile = useCallback(async (userId: string | undefined, currentSession: Session | null) => {
    if (!userId || !currentSession?.access_token) {
      console.log("AuthProvider (Direct Fetch): fetchProfile called without userId or session/token, clearing profile.");
      setProfile(null);
      return;
    }
    console.log(`AuthProvider (Direct Fetch): Fetching profile for user ID: ${userId}`);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error("AuthProvider (Direct Fetch): Supabase URL or Anon Key missing.");
        setProfile(null);
        return;
    }

    const headers: HeadersInit = {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${currentSession.access_token}`,
      'Accept': 'application/vnd.pgrst.object+json'
    };
    const selectColumns = 'id,company_name,contact_email,contact_phone,is_admin,created_at,updated_at';
    const url = `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=${selectColumns}`;

    try {
      console.log("AuthProvider: Making direct fetch to Supabase profiles...");
      const response = await fetch(url, { headers: headers });
      console.log("AuthProvider: Direct fetch response status:", response.status, response.statusText);

      if (!response.ok) {
        let errorPayload: { message: string; code?: string; [key: string]: unknown } = { message: `HTTP error ${response.status}` };
        try {
            errorPayload = await response.json();
            console.error('AuthProvider: Direct fetch Supabase error payload:', errorPayload);
        } catch { // Removed unused _e variable name
            const textError = await response.text();
            console.error('AuthProvider: Could not parse error response body:', textError);
            errorPayload.message = textError || errorPayload.message;
        }

        if (errorPayload.code === 'PGRST116') {
           console.warn(`AuthProvider: Profile not found (direct fetch) for user ${userId} or RLS denied access.`);
        } else {
           console.error('AuthProvider: Error fetching profile (direct fetch):', errorPayload);
        }
        setProfile(null);
      } else {
         if (response.status === 204 || response.headers.get('content-length') === '0') {
              console.warn(`AuthProvider: Profile not found (direct fetch, empty 2xx response) for user ${userId}.`);
              setProfile(null);
         } else {
              const profileData = await response.json();
              console.log("AuthProvider: Profile data fetched (direct fetch):", profileData);
              setProfile(profileData as Profile);
         }
      }
    } catch (catchError) {
      console.error("AuthProvider: Caught exception fetching profile (direct fetch):", catchError);
      setProfile(null);
    }
  }, []); // End useCallback

  // Effect solely for onAuthStateChange listener
  useEffect(() => {
      // Use useRef for mount status
      const isMountedRef = useRef(true);
      console.log("AuthProvider: Setting up onAuthStateChange listener (V5 - Lint Fixes).");
      let initialCheckDone = false;

      // Use underscore prefix for unused subscription variable
      const { data: { subscription: _subscription } } = supabase.auth.onAuthStateChange(
          async (_event, session) => {
              // Use ref to check mount status
              if (!isMountedRef.current) {
                  console.log("AuthProvider: Unmounted, ignoring auth state change.");
                  return;
              }
              console.log("AuthProvider: Auth state changed (V5):", _event, session ? "Got session" : "No session");

              setSession(session);
              setUser(session?.user ?? null);
              const profileUserId = session?.user?.id;

              if (session) {
                  const expiresIn = session.expires_at ? (session.expires_at * 1000 - Date.now()) / 1000 : 'N/A';
                  console.log(`AuthProvider: Session details before fetch (V5) - User ID: ${profileUserId}, ExpiresIn: ${expiresIn}s`);
              } else {
                  console.log("AuthProvider: No session before fetch (V5).");
              }

              console.log(`AuthProvider: >>> Calling fetchProfile (direct fetch) for ${profileUserId} (V5)...`);
              await fetchProfile(profileUserId, session);
              console.log(`AuthProvider: <<< fetchProfile (direct fetch) call completed for ${profileUserId} (V5).`);

              if (!initialCheckDone) {
                  console.log("AuthProvider: Initial auth state processed, setting loading false (V5).");
                  setIsLoading(false);
                  initialCheckDone = true;
              }
          }
      );

      // Cleanup function for listener
      return () => {
          console.log("AuthProvider: Unsubscribing from onAuthStateChange.");
          isMountedRef.current = false; // Set ref on unmount
          _subscription.unsubscribe(); // Use underscored variable
      };
  }, [fetchProfile]); // Dependency array

  // signOut function
  const signOut = useCallback(async () => {
      console.log("AuthProvider: Signing out.");
      setIsLoading(true); // Indicate loading
      await supabase.auth.signOut();
      // Let onAuthStateChange handle setting user/profile to null and isLoading to false
      router.push('/signin');
  }, [router]); // Keep router dependency

  // Memoized context value
  // Ignore exhaustive-deps warning if lint complains; these deps are correct
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const value = useMemo(() => ({
      user,
      session,
      profile,
      signOut,
      isLoading
  }), [user, session, profile, signOut, isLoading]); // These dependencies ARE correct

  // --- RESTORED JSX HERE ---
  return (
      <AuthContext.Provider value={value}>
          {!isLoading ? children : <div>Loading...</div>} {/* Basic loading indicator */}
      </AuthContext.Provider>
  );
};

// useAuth hook
export const useAuth = () => {
  const context = useContext(AuthContext); // Use standard useContext from React import
  if (context === undefined) {
      throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};