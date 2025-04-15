'use client';
import { useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider'; // Adjust path if needed
import { usePathname, useRouter } from 'next/navigation';

// Define public paths accessible when logged OUT
const publicPaths = ['/signin', '/signup', '/reset-password', '/auth/callback'];
// Define paths accessible ONLY by admins
const adminPaths = ['/admin'];

export default function AuthRedirector({ children }: { children: React.ReactNode }) {
  const { user, profile, isLoading } = useAuth();
  const router = useRouter(); // Keep router for non-admin -> dashboard redirect
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) {
      console.log("AuthRedirector: Auth state loading...");
      return;
    }

    const isAdmin = profile?.is_admin ?? false;
    const isPublic = publicPaths.some(p => pathname.startsWith(p));
    const isAdminPath = adminPaths.some(p => pathname === p || pathname.startsWith(p + '/'));
    const isRoot = pathname === '/';

    console.log(`AuthRedirector Check (V8 - No Public Redirect): isLoading=${isLoading}, user=${!!user}, isAdmin=${isAdmin}, path=${pathname}, isPublic=${isPublic}, isAdminPath=${isAdminPath}`);

    let targetPath: string | null = null;

    if (user) {
      // --- User is Logged In ---
      console.log("AuthRedirector: User is logged in.");
      // **REMOVED:** Condition that redirects logged-in users away from /signin etc.
      // if (isPublic && !isRoot) { ... }

      // **KEEP:** Redirect non-admins trying to access admin paths
      if (isAdminPath && !isAdmin) {
        targetPath = '/dashboard';
        console.log(`AuthRedirector: Condition MET: Non-admin on admin path (${pathname}). Target: ${targetPath}`);
      } else {
         console.log(`AuthRedirector: Conditions NOT MET for logged-in redirect.`);
      }
    } else {
      // --- User is Logged Out ---
      console.log("AuthRedirector: User is logged out.");
      // Redirect if on a protected path (middleware fallback)
      if (!isPublic && !isRoot) {
        targetPath = '/signin';
        console.log(`AuthRedirector: Condition MET: No user on protected path (${pathname}). Target: ${targetPath}`);
      } else {
         console.log(`AuthRedirector: Conditions NOT MET for logged-out redirect.`);
      }
    }

    // Perform redirect only if target path is set AND we aren't already there
    if (targetPath && targetPath !== pathname) {
       console.log(`AuthRedirector: >>> Attempting window.location.replace('${targetPath}') from path '${pathname}'...`);
       window.location.replace(targetPath); // Stick with window.location.replace
    } else if (targetPath) {
       console.log(`AuthRedirector: Already on target path '${pathname}', no redirect needed.`);
    } else {
       console.log(`AuthRedirector: No redirect target path determined this cycle.`);
    }

  }, [isLoading, user, profile, pathname, router]); // Dependencies

  // Render loading indicator OR children
  if (isLoading) {
      return <div>Loading Application...</div>;
  }

  return <>{children}</>;
}