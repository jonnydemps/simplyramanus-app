'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function SignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Attempt sign in
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // Handle sign-in specific errors first
      if (signInError) {
        throw signInError; // Throw to be caught by the catch block
      }

      // Check if user data exists after successful sign in
      if (data?.user) {
        // Check if user is admin using the correct 'id' column
        console.log("SignInForm: Fetching admin status for user:", data.user.id); // Debug log
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', data.user.id) // Corrected: Use 'id' column
          .single();

        // Handle potential error fetching profile
        if (profileError) {
          console.error("SignInForm: Error fetching admin status:", profileError.message);
          // Default redirect to dashboard if admin status check fails
          router.push('/dashboard');
        } else if (profileData?.is_admin) { // Check profileData exists
          console.log("SignInForm: User is admin, redirecting to /admin"); // Debug log
          router.push('/admin');
        } else {
          console.log("SignInForm: User is not admin, redirecting to /dashboard"); // Debug log
          router.push('/dashboard');
        }
      } else {
         // This case should ideally not happen if signInError is null, but handle defensively
         console.error("SignInForm: Sign in succeeded but no user data found in response.");
         setError("Sign in succeeded but failed to retrieve user data.");
      }

    } catch (err: unknown) { // Catch block for any error (signInError or profileError if re-thrown)
      let message = 'An error occurred during sign in. Please check your credentials.';
      // Try to get message from Supabase error structure
      if (typeof err === 'object' && err !== null && 'message' in err) {
         message = err.message as string;
      } else if (err instanceof Error) {
         message = err.message; // Fallback for standard errors
      }
      console.error("SignInForm: Sign in catch block:", err); // Log the actual error structure
      setError(message);
    } finally {
      setLoading(false);
    }
  }; // <<<< SEMICOLON ADDED HERE

  // --- JSX for the form ---
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
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm mt-2">{error}</div>
          )}

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link
                href="/reset-password"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Forgot your password?
              </Link>
            </div>
            <div className="text-sm">
              <Link
                href="/signup"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Don&apos;t have an account? Sign up
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}