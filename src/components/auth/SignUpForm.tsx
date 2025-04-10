'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState(''); // State for company name input
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Sign up the user, passing companyName in options.data for the trigger
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // This data gets stored in auth.users.raw_user_meta_data
          // The database trigger 'handle_new_user' reads this
          data: {
            company_name: companyName
          },
          // This is where Supabase sends the confirmation link
          // Ensure this path exists or change to your desired callback/confirmation URL
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) {
        // Handle potential errors like user already registered, weak password etc.
        throw signUpError;
      }

      // --- Manual Profile Insert Block REMOVED ---
      // The database trigger 'handle_new_user' now handles profile creation automatically.

      // If signUp was successful, Supabase sends a confirmation email (if email confirmations are enabled).
      // Redirect to a page telling the user to check their email.
      console.log("SignUpForm: Sign up successful (user created/email sent), redirecting...");
      router.push('/signup/confirmation'); // Redirect user to check email/confirm

    } catch (err: unknown) { // Catch block for sign-up errors
      let message = 'An error occurred during sign up. Please check your details.';
      if (typeof err === 'object' && err !== null && 'message' in err) {
         message = err.message as string;
      } else if (err instanceof Error) {
         message = err.message;
      } else if (typeof err === 'string') {
         message = err;
      }
      console.error("SignUpForm: Sign up catch block:", err);
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
            Create your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSignUp}>
          <div className="rounded-md shadow-sm -space-y-px">
            {/* Company Name Input */}
            <div>
              <label htmlFor="company-name" className="sr-only">
                Company Name
              </label>
              <input
                id="company-name"
                name="company-name"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Company Name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
            {/* Email Input */}
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
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {/* Password Input */}
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
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
                href="/signin"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Already have an account? Sign in
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Sign up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}