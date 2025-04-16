'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link'; // Keep Link for other links

export default function SignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [redirectPath, setRedirectPath] = useState('/dashboard');
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoginSuccess(false);
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
        console.log("SignInForm: Sign in API successful for user:", data.user.id);
        const { data: profileData, error: profileError } = await supabase
          .from('profiles').select('is_admin').eq('id', data.user.id).single();

        if (profileError) {
            console.error("SignInForm: Error fetching admin status (defaulting to /dashboard):", profileError.message);
            setRedirectPath('/dashboard');
        } else if (profileData?.is_admin) {
            console.log("SignInForm: User is admin.");
            setRedirectPath('/admin');
        } else {
            console.log("SignInForm: User is not admin.");
            setRedirectPath('/dashboard');
        }
        setLoginSuccess(true);

      } else {
         console.error("SignInForm: Sign in succeeded but no user data found.");
         setError("Sign in succeeded but failed to retrieve user data.");
      }
    } catch (err: unknown) {
         let message = 'An error occurred. Please check credentials.';
         if (typeof err === 'object' && err !== null && 'message' in err) { message = err.message as string; }
         else if (err instanceof Error) { message = err.message; }
         console.error("SignInForm: Sign in catch block:", err);
         setError(message);
    } finally {
       setLoading(false);
    }
  };

  // Effect to automatically redirect after successful login
  useEffect(() => {
    if (loginSuccess) {
      const timer = setTimeout(() => {
        console.log(`SignInForm: Auto-redirecting to ${redirectPath} after login success`);
        router.push(redirectPath);
      }, 1500); // Short delay for user to see success message
      
      return () => clearTimeout(timer);
    }
  }, [loginSuccess, redirectPath, router]);

  // --- JSX ---
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">

        {!loginSuccess ? (
          // --- Sign In Form ---
          <>
            <div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Sign in to your account
              </h2>
            </div>
            <form className="mt-8 space-y-6" onSubmit={handleSignIn}>
               {/* Email Input */}
               <div className="rounded-md shadow-sm -space-y-px">
                 <div><label htmlFor="email-address" className="sr-only">Email address</label><input id="email-address" name="email" type="email" autoComplete="email" required className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                 <div><label htmlFor="password" className="sr-only">Password</label><input id="password" name="password" type="password" autoComplete="current-password" required className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
               </div>

              {/* Error Display */}
              {error && (<div className="text-red-500 text-sm mt-2">{error}</div>)}

              {/* Links */}
              <div className="flex items-center justify-between">
                <div className="text-sm"><Link href="/reset-password" className="font-medium text-blue-600 hover:text-blue-500">Forgot your password?</Link></div>
                <div className="text-sm"><Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500">Don&apos;t have an account? Sign up</Link></div>
              </div>

              {/* Submit Button */}
              <div>
                <button type="submit" disabled={loading} className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
              </div>
            </form>
          </>
        ) : (
          // --- Success Message with automatic redirect ---
          <div>
            <h2 className="mt-6 text-center text-2xl font-bold text-green-700">
              Sign In Successful!
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Redirecting you to {redirectPath === '/admin' ? 'Admin Dashboard' : 'Dashboard'}...
            </p>
            <div className="mt-6">
              <button
                onClick={() => {
                  console.log(`SignInForm: Manual redirect button clicked. Navigating to: ${redirectPath}`);
                  router.push(redirectPath);
                }}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {redirectPath === '/admin' ? 'Go to Admin Dashboard' : 'Go to Dashboard'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
