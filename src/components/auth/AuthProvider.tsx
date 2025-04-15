'use client';

// Import React itself, and needed hooks EXCEPT createContext
import React, { useEffect, useState, useCallback, useMemo, useContext } from 'react';
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

// Use React.createContext directly here
const AuthContext = React.createContext<AuthContextType>(defaultAuthContextValue);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // fetchProfile using direct fetch API
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
        // Give errorPayload a more specific type structure
        let errorPayload: { message: string; code?: string; details?: string; hint?: string, [key: string]: unknown } = { 
            message: `HTTP error ${response.status}` 
        };
        try {
            errorPayload = await response.json();
            console.error('AuthProvider: Direct fetch Supabase error payload:', errorPayload);
        } catch (_e) { // Use underscore prefix for unused catch variable 'e'
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
    let isMounted = true;
    console.log("AuthProvider: Setting up onAuthStateChange listener (V4 - Direct Fetch Test).");
    let initialCheckDone = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!isMounted) return;
        console.log("AuthProvider: Auth state changed (V4):", _event, session ? "Got session" : "No session");

        setSession(session);
        setUser(session?.user ?? null);
        const profileUserId = session?.user?.id;

        if (session) {
            const expiresIn = session.expires_at ? (session.expires_at * 1000 - Date.now()) / 1000 : 'N/A';
            console.log(`AuthProvider: Session details before fetch (V4) - User ID: ${profileUserId}, ExpiresIn: ${expiresIn}s`);
        } else {
            console.log("AuthProvider: No session before fetch (V4).");
        }

        console.log(`AuthProvider: >>> Calling fetchProfile (direct fetch) for ${profileUserId} (V4)...`);
        await fetchProfile(profileUserId, session); // Pass session
        console.log(`AuthProvider: <<< fetchProfile (direct fetch) call completed for ${profileUserId} (V4).`);

        if (!initialCheckDone) {
          console.log("AuthProvider: Initial auth state processed, setting loading false (V4).");
          setIsLoading(false);
          initialCheckDone = true;
        }
      }
    );

    return () => { /* Cleanup as before */ };
  }, [fetchProfile]);

  // signOut function
  const signOut = useCallback(async () => { /* ... as before ... */ }, [router]);

  // Memoized context value
  const value = useMemo(() => ({ /* ... as before ... */ }), [user, session, profile, signOut, isLoading]);

  return (
    <AuthContext.Provider value={value}>
      {!isLoading ? children : <div>Loading...</div>}
    </AuthContext.Provider>
  );
};

// useAuth hook - uses standard useContext import now
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};