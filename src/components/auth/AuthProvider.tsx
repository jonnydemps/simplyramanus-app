'use client';

import React, { useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
// Removed useRouter, usePathname as they are not needed in this simplified version

// REMOVED Profile type

type AuthContextType = {
  user: User | null;
  session: Session | null;
  // REMOVED profile from context
  signOut: () => Promise<void>;
  isLoading: boolean;
};

const defaultAuthContextValue: AuthContextType = {
  user: null,
  session: null,
  // REMOVED profile default
  signOut: async () => {},
  isLoading: true,
};

const AuthContext = React.createContext<AuthContextType>(defaultAuthContextValue);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const isMountedRef = useRef(true);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  // REMOVED profile state
  const [isLoading, setIsLoading] = useState(true);
  // REMOVED router

  // REMOVED fetchProfile function

  // Effect solely for onAuthStateChange listener
  useEffect(() => {
      isMountedRef.current = true;
      console.log("AuthProvider (Simplified): Setting up onAuthStateChange listener.");
      let initialCheckDone = false;

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (_event, session) => {
              if (!isMountedRef.current) {
                  console.log("AuthProvider (Simplified): Unmounted, ignoring auth state change.");
                  return;
              }
              console.log("AuthProvider (Simplified): Auth state changed:", _event, session ? "Got session" : "No session");

              setSession(session);
              setUser(session?.user ?? null);
              // REMOVED profile fetch call

              // Set loading false after first auth check
              if (!initialCheckDone) {
                  console.log("AuthProvider (Simplified): Initial auth state processed, setting loading false.");
                  setIsLoading(false);
                  initialCheckDone = true;
              }
          }
      );

      // Cleanup function
      return () => {
          console.log("AuthProvider (Simplified): Unsubscribing from onAuthStateChange.");
          isMountedRef.current = false;
          subscription.unsubscribe();
      };
  // REMOVED fetchProfile dependency
  }, []);

  // signOut function
  const signOut = useCallback(async () => {
      console.log("AuthProvider (Simplified): Signing out.");
      setIsLoading(true);
      // REMOVED profile clear
      setUser(null);
      setSession(null);
      await supabase.auth.signOut();
      // Redirect will be handled by AuthRedirector or middleware after state update
      setIsLoading(false);
  }, []);

  // Memoized context value
  const value = useMemo(() => ({
      user,
      session,
      // REMOVED profile
      signOut,
      isLoading
  // REMOVED profile dependency
  }), [user, session, signOut, isLoading]);

  // REMOVED redirect useEffect

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
