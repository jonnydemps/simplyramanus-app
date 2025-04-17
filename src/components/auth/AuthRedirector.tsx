'use client';
import { useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider'; // Adjust path if needed
import { usePathname, useRouter } from 'next/navigation';

export default function AuthRedirector({ children }: { children: React.ReactNode }) {
  // Removed profile from useAuth() destructuring
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Removed profile from log
    console.log(`AuthRedirector Effect RUN (Simplified): isLoading=${isLoading}, user=${!!user}, path=${pathname}`);

    // Wait until loading is complete
    if (isLoading) {
      console.log("AuthRedirector (Simplified): Still loading auth state...");
      return;
    }

    // --- Simplified Client-side redirect logic ---
    // Redirect authenticated users away from auth pages
    // No profile check needed in this simplified version
    if (user && (pathname === '/signin' || pathname === '/signup')) {
      const targetPath = '/dashboard'; // Always redirect to dashboard for now
      console.log(`AuthRedirector (Simplified): Replacing URL for authenticated user from ${pathname} to ${targetPath}...`);
      router.replace(targetPath);
      return;
    }

  // Dependencies updated - removed profile
  }, [isLoading, user, pathname, router]);

  // Render loading indicator OR children
  if (isLoading) {
      return <div>Loading Authentication...</div>;
  }

  // REMOVED check for profile === null as profile is no longer tracked here

  return <>{children}</>;
}
