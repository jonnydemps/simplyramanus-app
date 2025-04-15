'use client';

// Use React import that includes useContext for the hook later
import React, { createContext, useEffect, useState, useCallback, useMemo } from 'react';
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

const AuthContext = React.createContext<AuthContextType>(defaultAuthContextValue); // Use React.createContext

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // --- Modified fetchProfile using direct fetch API ---
  const fetchProfile = useCallback(async (userId: string | undefined, currentSession: Session | null) => {
    // Need userId AND the session containing the access token
    if (!userId || !currentSession?.access_token) {
      console.log("AuthProvider (Direct Fetch): fetchProfile called without userId or session/token, clearing profile.");
      setProfile(null);
      return;
    }
    console.log(`AuthProvider (Direct Fetch): Fetching profile for user ID: ${userId}`);

    // Get Supabase URL and Anon Key from environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error("AuthProvider (Direct Fetch): Supabase URL or Anon Key missing in environment variables.");
        setProfile(null);
        return;
    }

    // Construct headers for direct fetch
    const headers: HeadersInit = {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${currentSession.access_token}`,
      'Accept': 'application/vnd.pgrst.object+json' // Mimic .single() behavior - expects only one row
    };
    // Construct URL for direct fetch
    const selectColumns = 'id,company_name,contact_email,contact_phone,is_admin,created_at,updated_at';
    const url = `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=${selectColumns}`;

    try {
      console.log("AuthProvider: Making direct fetch to:", url.split('?')[0] + "?..."); // Log URL without query params potentially containing secrets
      const response = await fetch(url, { headers: headers });
      console.log("AuthProvider: Direct fetch response status:", response.status, response.statusText);

      if (!response.ok) {
        let errorPayload: any = { message: `HTTP error ${response.status}` };
        try {
            errorPayload = await response.json();
            console.error('AuthProvider: Direct fetch Supabase error payload:', errorPayload);
        } catch (e) {
            const textError = await response.text();
            console.error('AuthProvider: Could not parse error response body:', textError);
            errorPayload.message = textError || errorPayload.message;
        }
        // Check specific error code if available in payload
        if (errorPayload.code === 'PGRST116') {
           console.warn(`AuthProvider: Profile not found (direct fetch) for user ${userId} or RLS denied access.`);
        } else {
           console.error('AuthProvider: Error fetching profile (direct fetch):', errorPayload);
        }
        setProfile(null);
      } else {
         // Handle potential empty 2xx response when using Accept header for single object
         if (response.status === 204 || response.headers.get('content-length') === '0') {
              console.warn(`AuthProvider: Profile not found (direct fetch, empty 2xx response) for user ${userId}.`);
              setProfile(null);
         } else {
              const profileData = await response.json();
              console.log("AuthProvider: Profile data fetched (direct fetch):", profileData);
              setProfile(profileData as Profile); // Assume structure matches Profile type
         }
      }
    } catch (catchError) {
      console.error("AuthProvider: Caught exception fetching profile (direct fetch):", catchError);
      setProfile(null);
    }
  }, []); // Dependency array


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
        // Pass the current session to fetchProfile for the access token
        await fetchProfile(profileUserId, session);
        console.log(`AuthProvider: <<< fetchProfile (direct fetch) call completed for ${profileUserId} (V4).`);

        if (!initialCheckDone) {
          console.log("AuthProvider: Initial auth state processed, setting loading false (V4).");
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
  // Rerun effect only if fetchProfile reference changes
  }, [fetchProfile]);

  // signOut function remains the same
  const signOut = useCallback(async () => {
      console.log("AuthProvider: Signing out.");
      setIsLoading(true);
      await supabase.auth.signOut();
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
      {!isLoading ? children : <div>Loading...</div>}
    </AuthContext.Provider>
  );
};

// useAuth hook needs useContext imported correctly
import { useContext } from 'react';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};