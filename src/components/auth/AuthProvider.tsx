'use client';

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

// Profile type should match your database.types.ts
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


  // Effect solely for onAuthStateChange listener
  useEffect(() => {
    let isMounted = true;
    console.log("AuthProvider: Setting up onAuthStateChange listener (sole handler).");
    let initialCheckDone = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!isMounted) return;
        console.log("AuthProvider: Auth state changed:", _event, session ? "Got session" : "No session");

        let currentSession = session;
        let profileUserId = session?.user?.id;

        // --- TRY EXPLICIT REFRESH ON INITIAL/SIGN_IN EVENTS ---
        // Only attempt if we received a session and it wasn't just due to a refresh completing
        if (currentSession && (_event === 'INITIAL_SESSION' || _event === 'SIGNED_IN')) {
             console.log(`AuthProvider: Attempting explicit token refresh for event: ${_event}`);
             // refreshSession uses the token stored internally by the client
             const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

             if (refreshError) {
                 console.error("AuthProvider: Explicit refresh failed:", refreshError.message);
                 // If refresh fails (e.g., token truly invalid), sign out
                 if (isMounted) { // Check mount status again before async operation result
                    await supabase.auth.signOut();
                    // State updates (session, user, profile) will be handled by the SIGNED_OUT event firing
                    currentSession = null; // Ensure subsequent logic uses null session
                    profileUserId = undefined;
                 }
             } else if (refreshData.session) {
                 console.log("AuthProvider: Explicit refresh succeeded.");
                 currentSession = refreshData.session; // Use the potentially newer session
                 profileUserId = currentSession.user.id;
                 // Update state immediately with refreshed data *before* fetchProfile
                 // This might cause an extra re-render but ensures fetchProfile uses latest user ID
                 setSession(currentSession); 
                 setUser(currentSession.user ?? null);
             } else {
                 // If refresh succeeds but returns no session (edge case?)
                 console.warn("AuthProvider: Refresh returned no error but also no session?");
                 if (isMounted) {
                    await supabase.auth.signOut();
                    currentSession = null;
                    profileUserId = undefined;
                 }
             }
        }
        // --- END EXPLICIT REFRESH ---

        // Ensure state reflects the potentially updated session before fetching profile
        // Checking mount status again before state updates triggered by the listener itself
         if (!isMounted) return;
         setSession(currentSession); 
         setUser(currentSession?.user ?? null);
         
         // Log details *after* potential refresh attempt
         if (currentSession) {
             const expiresIn = currentSession.expires_at ? (currentSession.expires_at * 1000 - Date.now()) / 1000 : 'N/A';
             console.log(`AuthProvider: Session details before fetch - User ID: ${profileUserId}, ExpiresIn: ${expiresIn}s`);
         } else {
             console.log("AuthProvider: No session before fetch.");
         }

        // Fetch profile based on the final user ID (could be undefined if refresh failed)
        // If profileUserId is undefined, fetchProfile will handle it gracefully
        await fetchProfile(profileUserId);

        // Set loading false after the first event is processed and profile fetch is attempted/completed
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
  // Rerun effect only if fetchProfile reference changes
  }, [fetchProfile]); // Removed router dependency as it wasn't used here

  // signOut function
  const signOut = useCallback(async () => {
    console.log("AuthProvider: Signing out.");
    setIsLoading(true);
    await supabase.auth.signOut();
    // Let onAuthStateChange handle state clearing and setting isLoading false
    router.push('/signin');
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