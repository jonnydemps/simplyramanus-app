'use client';

// Keep all necessary hooks imported, remove unused createContext if using React.createContext
import React, { useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();

  // fetchProfile function (using direct fetch)
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
          console.log(`AuthProvider: Making direct fetch to Supabase profiles URL: ${url}`);
          const response = await fetch(url, { headers: headers });
          console.log(`AuthProvider: Direct fetch response status: ${response.status} ${response.statusText}`);
          console.log("AuthProvider: Direct fetch response headers:", Object.fromEntries(response.headers.entries())); // Log headers

          if (!response.ok) {
              console.error(`AuthProvider: Direct fetch failed with status ${response.status}. Attempting to read error body...`);
              let errorPayload: { message: string; code?: string; [key: string]: unknown } = { message: `HTTP error ${response.status}` };
              try {
                  errorPayload = await response.json();
                  console.error('AuthProvider: Direct fetch Supabase error payload:', errorPayload);
              } catch { // Removed unused variable name
                  const textError = await response.text();
                  console.error('AuthProvider: Could not parse error response body:', textError);
                  errorPayload.message = textError || errorPayload.message;
              }

              if (errorPayload.code === 'PGRST116') {
                 console.warn(`AuthProvider: Profile not found (direct fetch) for user ${userId} or RLS denied access.`);
              } else {
                 console.error('AuthProvider: Error fetching profile (direct fetch):', errorPayload);
              }
              setProfile(null); // Clear profile on error
              console.log("AuthProvider: Set profile to null due to fetch error."); // Log state change
          } else {
               const responseBody = await response.text(); // Read body as text first
               console.log("AuthProvider: Direct fetch successful response body (text):", responseBody);

               if (response.status === 204 || responseBody.length === 0) {
                    console.warn(`AuthProvider: Profile not found (direct fetch, empty 2xx response or empty body) for user ${userId}.`);
                    setProfile(null);
                    console.log("AuthProvider: Set profile to null due to empty success response."); // Log state change
               } else {
                    try {
                        const profileData = JSON.parse(responseBody); // Parse text body
                        console.log("AuthProvider: Profile data fetched and parsed (direct fetch):", profileData);
                        setProfile(profileData as Profile);
                        console.log("AuthProvider: Set profile state with fetched data:", profileData); // Log state change
                    } catch (parseError) {
                        console.error("AuthProvider: Error parsing profile JSON response:", parseError, "Body was:", responseBody);
                        setProfile(null);
                        console.log("AuthProvider: Set profile to null due to JSON parse error."); // Log state change
                    }
               }
          }
      } catch (catchError) {
          console.error("AuthProvider: Caught exception during fetchProfile (direct fetch):", catchError);
          setProfile(null);
          console.log("AuthProvider: Set profile to null due to caught exception."); // Log state change
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
              }

              console.log(`AuthProvider: >>> Calling fetchProfile (direct fetch) for ${profileUserId} (V7)...`);
              await fetchProfile(profileUserId, session);
              console.log(`AuthProvider: <<< fetchProfile (direct fetch) call completed for ${profileUserId} (V7).`);

              if (!initialCheckDone) {
                  console.log("AuthProvider: Initial auth state processed, setting loading false (V7).");
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
  }, [fetchProfile]); // Dependency array

  // signOut function
  const signOut = useCallback(async () => {
      console.log("AuthProvider: Signing out.");
      setIsLoading(true);
      await supabase.auth.signOut();
      router.push('/signin');
  }, [router]);

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