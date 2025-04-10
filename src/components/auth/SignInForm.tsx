'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link'; // Keep existing Link import

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
          // Consider if showing an error to the user is more appropriate
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
  };

  // --- JSX for the form (remains the same as your original) ---
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">