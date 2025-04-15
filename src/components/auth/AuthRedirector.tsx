'use client';
import { useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider'; // Adjust path if needed
import { usePathname, useRouter } from 'next/navigation';

// Define public paths accessible when logged OUT
const publicPaths = ['/signin', '/signup', '/reset-password'];
// Define paths accessible ONLY by admins
const adminPaths = ['/admin']; // Add '/admin/...' if needed
// Define paths for regular logged-in users (non-admin)
const protectedPaths = ['/dashboard', '/formulations', '/payment']; // Add '/formulations/upload', etc.

export default function AuthRedirector({ children }: { children: React.ReactNode }) {
  const { user, profile, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) {
      console.log("AuthRedirector: Auth state loading...");
      return; // Wait for auth state to load
    }

    const isPublic = publicPaths.some(p => pathname.startsWith(p));
    const isAdminPath = adminPaths.some(p => pathname.startsWith(p));
    // Add check for root path '/' explicitly if it should be treated differently
    const isRoot = pathname === '/'; 

    console.log(`AuthRedirector: Check - User: ${!!user}, Admin: ${profile?.is_admin}, Path: ${pathname}`);

    if (user) {
      // --- User is Logged In ---
      const isAdmin = profile?.is_admin ?? false;

      if (isPublic) {
        // Logged in, but on a public auth page (signin/signup/reset) -> redirect
        const target = isAdmin ? '/admin' : '/dashboard';
        console.log(`AuthRedirector: User on public auth page (${pathname}), redirecting to ${target}`);
        router.replace(target);
      } else if (isAdminPath && !isAdmin) {
        // Logged in, NOT admin, but on an admin path -> redirect
        console.log(`AuthRedirector: Non-admin on admin path (${pathname}), redirecting to /dashboard`);
        router.replace('/dashboard');
      }
      // Allow admins on admin paths
      // Allow non-admins on non-admin protected paths and root
      // Allow admins on non-admin protected paths and root

    } else {
      // --- User is Logged Out ---
      // Middleware should handle redirecting from protected paths,
      // but this is a client-side fallback. Allow public paths and root.
      if (!isPublic && !isRoot) {
          console.log(`AuthRedirector: No user on protected path (${pathname}), redirecting to /signin`);
          router.replace('/signin');
      }
    }
  }, [isLoading, user, profile, pathname, router]); // Re-run when auth state or path changes

  // Render children only after loading complete to prevent flashes, or show a global spinner
  if (isLoading) {
      return <div>Loading Application...</div>; // Or your global loading spinner
  }

  return <>{children}</>; // Render the actual page content
}
