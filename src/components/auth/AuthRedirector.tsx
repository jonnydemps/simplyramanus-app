'use client';
import { useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider'; // Adjust path if needed
import { usePathname, useRouter } from 'next/navigation';

export default function AuthRedirector({ children }: { children: React.ReactNode }) {
  // Re-added profile to useAuth() destructuring
  const { user, profile, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Re-added profile to log
    console.log(`AuthRedirector Effect RUN (Restored): isLoading=${isLoading}, user=${!!user}, profile=${!!profile}, isAdmin=${profile?.is_admin ?? 'N/A'}, path=${pathname}`);

    // Wait until loading is complete
    if (isLoading) {
      console.log("AuthRedirector (Restored): Still loading auth state...");
      return;
    }

    // Wait for profile state if user exists but profile hasn't loaded yet
    if (user && profile === null) {
        console.log("AuthRedirector (Restored): User exists but profile state is null, waiting/skipping redirect logic.");
        return;
    }

    // --- Client-side redirect logic ---
    // Redirect authenticated users away from auth pages
    // Now checks profile state is resolved (not null) before checking is_admin
    if (user && profile && (pathname === '/signin' || pathname === '/signup')) {
      const isAdmin = profile.is_admin === true; // Check admin status from profile
      const targetPath = isAdmin ? '/admin' : '/dashboard'; // Redirect based on admin status
      console.log(`AuthRedirector (Restored): Replacing URL for authenticated ${isAdmin ? 'admin' : 'user'} from ${pathname} to ${targetPath}...`);
      router.replace(targetPath); // Use replace
      return;
    }

  // Dependencies ensure effect runs when state resolves or path changes
  }, [isLoading, user, profile, pathname, router]); // Added profile back to dependencies

  // Render loading indicator OR children
  if (isLoading) {
      return <div>Loading Authentication...</div>;
  }

  // If user exists but profile is still null after loading, show loading (or handle error)
  if (user && profile === null) {
      console.log("AuthRedirector (Restored): Rendering loading state while profile is null after initial load.");
      return <div>Loading Profile...</div>;
  }


  return <>{children}</>;
}
