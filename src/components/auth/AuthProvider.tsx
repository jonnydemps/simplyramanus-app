'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react'; // Added useCallback
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

// Updated Profile type to match the database schema (using 'id' as the link to auth.users)
type Profile = {
  id: string; // This IS the user's auth ID (PK, FK)
  company_name: string;
  contact_email: string; // Added based on schema
  contact_phone?: string | null; // Added based on schema
  is_admin: boolean;
  created_at?: string | null; // Added based on schema
  updated_at?: string | null; // Added based on schema
  // Remove user_id if it's not a separate column
};

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  signOut: () => Promise<void>;
  isLoading: boolean;
};

// Default context value - ensure types match AuthContextType
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

  // Memoized fetchProfile function
  const fetchProfile = useCallback(async (userId: string | undefined) => {
    if (!userId) {
        console.log("fetchProfile called without userId, clearing profile.");
        setProfile(null); // Clear profile if no user ID
        return;
    }

    console.log(`AuthProvider: Fetching profile for user ID: ${userId}`); // Debug log
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        // Select specific columns, ensure 'id' is the key column
        .select('id, company_name, contact_email, contact_phone, is_admin, created_at, updated_at')
        .eq('id', userId) // Corrected: Filter by 'id' column matching auth.uid()
        .single();

      if (profileError) {
        // Handle specific errors, e.g., RLS or not found
        // PGRST116 is the code for "relation does not exist or restricted by RLS" or "0 rows requested but more/less returned" with .single()
        if (profileError.code === 'PGRST116') {
            console.warn(`AuthProvider: Profile not found for user ${userId} or RLS denied access. Does profile exist and RLS allow select?`);
        } else {
            console.error('AuthProvider: Error fetching profile:', profileError);
        }
        setProfile(null); // Set profile to null if error or not found
      } else {
        console.log("AuthProvider: Profile data fetched:", profileData); // Debug log
        setProfile(profileData as Profile); // Assuming data matches Profile type
      }
    } catch (catchError) {
        console.error("AuthProvider: Caught exception fetching profile:", catchError);
        setProfile(null); // Clear profile on exception
    }
  }, []); // Empty dependency array as supabase client is stable


  // Effect for initial session load
  useEffect(() => {
    let isMounted = true;
    console.log("AuthProvider: Initializing session check.");
    setIsLoading(true);
    supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (!isMounted) return;
        if (error) {
            console.error("AuthProvider: Error getting initial session:", error);
        } else {
            console.log("AuthProvider: Initial session received:", session ? "Got session" : "No session");
            setSession(session);
            setUser(session?.user ?? null);
            // Fetch profile only after setting the user based on initial session
            fetchProfile(session?.user?.id).finally(() => {
              if (isMounted) setIsLoading(false);
            });
        }
        // Ensure loading is set false even if initial profile fetch fails or no session
        if (!session?.user && isMounted) {
            setIsLoading(false);
        }
    }).catch(error => {
        console.error("AuthProvider: Exception getting initial session:", error);
        if (isMounted) setIsLoading(false);
    });

    return () => { isMounted = false; }; // Cleanup mount status
  }, [fetchProfile]); // Depend on memoized fetchProfile


  // Effect for auth state changes
  useEffect(() => {
      let isMounted = true;
      console.log("AuthProvider: Setting up onAuthStateChange listener.");
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (_event, session) => {
              if (!isMounted) return;
              console.log("AuthProvider: Auth state changed:", _event, session ? "Got session" : "No session");

              // Update session and user state first
              setSession(session);
              setUser(session?.user ?? null);

              // Fetch profile based on the new session state
              await fetchProfile(session?.user?.id);

              // Optional: Refresh router if needed, consider potential loops
              // router.refresh();
          }
      );

      // Cleanup function for listener
      return () => {
          console.log("AuthProvider: Unsubscribing from onAuthStateChange.");
          isMounted = false;
          subscription.unsubscribe();
      };
  }, [fetchProfile, router]); // Add router if refresh() is used inside


  const signOut = useCallback(async () => {
    console.log("AuthProvider: Signing out.");
    setIsLoading(true); // Indicate loading during sign out
    await supabase.auth.signOut();
    // State updates (user, session, profile to null) will be handled by onAuthStateChange listener
    // No need to manually set state here
    router.push('/signin'); // Redirect after sign out
    // setIsLoading(false); // Let listener handle final loading state
  }, [router]);

  // Memoize context value
  const value = useMemo(() => ({
      user,
      session,
      profile,
      signOut,
      isLoading
  }), [user, session, profile, signOut, isLoading]);

  return (
    <AuthContext.Provider value={value}>
      {!isLoading ? children : <div>Loading...</div>} {/* Basic loading state */}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
      throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};