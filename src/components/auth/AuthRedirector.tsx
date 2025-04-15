'use client';
import { useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider'; // Adjust path if needed
import { usePathname, useRouter } from 'next/navigation';

// Define public paths accessible when logged OUT
const publicPaths = ['/signin', '/signup', '/reset-password', '/auth/callback']; // Added callback
// Define paths accessible ONLY by admins
const adminPaths = ['/admin']; // Add '/admin/...' patterns if needed

// REMOVED unused protectedPaths definition
// const protectedPaths = ['/dashboard', '/formulations', '/payment']; 

export default function AuthRedirector({ children }: { children: React.ReactNode }) {
  const { user, profile, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) {
      console.log("AuthRedirector: Auth state loading...");
      return;
    }

    const isPublic = publicPaths.some(p => pathname.startsWith(p));
    const isAdminPath = adminPaths.some(p => pathname === p || pathname.startsWith(p + '/'));
    const isRoot = pathname === '/';

    console.log(`AuthRedirector: Check - User: ${!!user}, Admin: ${profile?.is_admin}, Path: ${pathname}, isPublic: ${isPublic}, isAdminPath: ${isAdminPath}`);

    if (user) {
      // User IS logged in
      const isAdmin = profile?.is_admin ?? false;

      if (isPublic) {
        const target = isAdmin ? '/admin' : '/dashboard';
        console.log(`AuthRedirector: User on public auth page (${pathname}), redirecting to ${target}`);
        router.replace(target);
      } else if (isAdminPath && !isAdmin) {
        console.log(`AuthRedirector: Non-admin on admin path (${pathname}), redirecting to /dashboard`);
        router.replace('/dashboard');
      }
      // Allow admins on admin paths & non-admins on non-admin protected paths

    } else {
      // User IS NOT logged in
      // Allow access only to public paths and root
      if (!isPublic && !isRoot) {
          console.log(`AuthRedirector: No user on protected path (${pathname}), redirecting to /signin`);
          router.replace('/signin');
      }
    }
  }, [isLoading, user, profile, pathname, router]);

  // Render children or loading state
  if (isLoading) {
      return <div>Loading Application...</div>; // Or your global loading spinner
  }

  return <>{children}</>;
}