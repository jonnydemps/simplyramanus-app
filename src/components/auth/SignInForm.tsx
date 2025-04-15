'use client';

import { useState } from 'react';
// No useRouter needed as AuthRedirector handles navigation
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function SignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // const router = useRouter(); // Not needed here

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
        // Optional: Fetch admin status here just for logging or immediate checks if needed.
        // The actual redirect logic is handled by AuthRedirector based on AuthProvider state.
        console.log("SignInForm: Fetching admin status for user:", data.user.id);
        const { data: profileData, error: profileError } = await supabase
          .from('profiles').select('is_admin').eq('id', data.user.id).single();

        if (profileError) {
            console.error("SignInForm: Error fetching admin status:", profileError.message);
        } else if (profileData?.is_admin) {
            console.log("SignInForm: Sign in successful for ADMIN user. AuthRedirector will handle navigation.");
        } else {
            console.log("SignInForm: Sign in successful for NON-ADMIN user. AuthRedirector will handle navigation.");
        }
        // Set loading false here to reset button state after successful background processing
        setLoading(false);
      } else {
         // Should not happen if signInError is null, but handle defensively
         console.error("SignInForm: Sign in succeeded but no user data found in response.");
         setError("Sign in succeeded but failed to retrieve user data.");
         setLoading(false); // Also stop loading here
      }
    } catch (err: unknown) {
         let message = 'An error occurred. Please check credentials.';
         if (typeof err === 'object' && err !== null && 'message' in err) { message = err.message as string; }
         else if (err instanceof Error) { message = err.message; }
         console.error("SignInForm: Sign in catch block:", err);
         setError(message);
         setLoading(false); // Stop loading on error
    }
    // No finally block needed if all paths handle setLoading
  };

  // --- JSX ---
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSignIn}>
          <div className="rounded-md shadow-sm -space-y-px">
            {/* Email Input */}
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input id="email-address" name="email" type="email" autoComplete="email" required className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            {/* Password Input */}
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input id="password" name="password" type="password" autoComplete="current-password" required className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>

          {/* Error Display */}
          {error && (<div className="text-red-500 text-sm mt-2">{error}</div>)}

          {/* Links */}
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link href="/reset-password" className="font-medium text-blue-600 hover:text-blue-500">Forgot your password?</Link>
            </div>
            <div className="text-sm">
              <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500">Don&apos;t have an account? Sign up</Link>
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button type="submit" disabled={loading} className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}