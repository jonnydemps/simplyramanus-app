'use client';
import { useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider'; // Adjust path if needed
import { usePathname } // No longer need useRouter //, useRouter 
    from 'next/navigation';

// Define public paths accessible when logged OUT
const publicPaths = ['/signin', '/signup', '/reset-password', '/auth/callback'];
// Define paths accessible ONLY by admins
const adminPaths = ['/admin']; // Add '/admin/...' patterns if needed

export default function AuthRedirector({ children }: { children: React.ReactNode }) {
  const { user, profile, isLoading } = useAuth();
  // const router = useRouter(); // Removed router
  const pathname = usePathname();

  useEffect(() => {
    console.log(`AuthRedirector Effect RUN: isLoading=${isLoading}, user=${!!user}, profile=${!!profile}, isAdmin=${profile?.is_admin ?? 'N/A'}, path=${pathname}`);

    if (isLoading) {
      console.log("AuthRedirector: Still loading auth state...");
      return;
    }

    const isAdmin = profile?.is_admin ?? false;
    const isPublic = publicPaths.some(p => pathname.startsWith(p));
    const isAdminPath = adminPaths.some(p => pathname === p || pathname.startsWith(p + '/'));
    const isRoot = pathname === '/';

    let targetPath: string | null = null;

    if (user) {
      // --- User is Logged In ---
      console.log("AuthRedirector: User is logged in.");
      if (isPublic && !isRoot) {
        targetPath = isAdmin ? '/admin' : '/dashboard';
        console.log(`AuthRedirector: Condition MET: User on public auth page (${pathname}). Target: ${targetPath}`);
      } else if (isAdminPath && !isAdmin) {
        targetPath = '/dashboard';
        console.log(`AuthRedirector: Condition MET: Non-admin on admin path (${pathname}). Target: ${targetPath}`);
      } else {
         console.log(`AuthRedirector: Conditions NOT MET for logged-in redirect.`);
      }
    } else {
      // --- User is Logged Out ---
      console.log("AuthRedirector: User is logged out.");
      if (!isPublic && !isRoot) {
        targetPath = '/signin';
        console.log(`AuthRedirector: Condition MET: No user on protected path (${pathname}). Target: ${targetPath}`);
      } else {
         console.log(`AuthRedirector: Conditions NOT MET for logged-out redirect.`);
      }
    }

    // Perform redirect using window.location.replace if target is set
    if (targetPath && targetPath !== pathname) {
       console.log(`AuthRedirector: >>> Attempting window.location.replace('${targetPath}')... Current path: ${pathname}`);
       // Use window.location.replace for a full navigation, clearing history stack for this step
       window.location.replace(targetPath);
       // Execution effectively stops here due to navigation
    } else if (targetPath) {
       console.log(`AuthRedirector: Already on target path '${pathname}', no redirect needed.`);
    } else {
       console.log(`AuthRedirector: No redirect target path determined.`);
    }

  }, [isLoading, user, profile, pathname]); // Removed router dependency

  // Render loading indicator OR children
  if (isLoading) {
      return <div>Loading Application...</div>;
  }

  return <>{children}</>;
}