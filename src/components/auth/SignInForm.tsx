'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation'; // Keep router import
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function SignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter(); // Keep router hook

  // eslint-disable-next-line @typescript-eslint/no-unused-vars // Added to suppress false positive
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      if (data?.user) {
        // Fetching admin status here might be redundant if AuthRedirector handles it,
        // but keep it for logging or if needed before AuthProvider state updates fully.
        console.log("SignInForm: Fetching admin status for user:", data.user.id);
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', data.user.id)
          .single();

        if (profileError) { console.error("SignInForm: Error fetching admin status:", profileError.message); }
        else if (profileData?.is_admin) { console.log("SignInForm: Sign in successful for ADMIN user."); }
        else { console.log("SignInForm: Sign in successful for NON-ADMIN user."); }

        // Redirect logic removed - handled by AuthRedirector after state update
      } else {
         console.error("SignInForm: Sign in succeeded but no user data found in response.");
         setError("Sign in succeeded but failed to retrieve user data.");
         setLoading(false);
      }

    } catch (err: unknown) {
      let message = 'An error occurred during sign in. Please check your credentials.';
      if (typeof err === 'object' && err !== null && 'message' in err) { message = err.message as string; }
      else if (err instanceof Error) { message = err.message; }
      console.error("SignInForm: Sign in catch block:", err);
      setError(message);
      setLoading(false);
    }
     // Let AuthProvider handle main loading state
  };

  // --- JSX ---
  return ( /* ... JSX remains the same ... */ );
}