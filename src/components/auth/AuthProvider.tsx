'use client';

import { useEffect, useState } from 'react';
import { getCurrentUser, signOut } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AuthProvider({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for current user on component mount
    const checkUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser || null);
      } catch (error) {
        console.error('Error checking authentication:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    // Clean up subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push('/signin');
  };

  // Create an auth context value
  const value = {
    user,
    loading,
    signOut: handleSignOut,
  };

  return (
    <div>
      {children}
    </div>
  );
}
