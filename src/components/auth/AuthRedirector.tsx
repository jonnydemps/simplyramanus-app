'use client';
import { useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider'; // Adjust path if needed
import { usePathname, useRouter } from 'next/navigation';

// Define public paths accessible when logged OUT
const publicPaths = ['/signin', '/signup', '/reset-password', '/auth/callback'];
// Define paths accessible ONLY by admins
const adminPaths = ['/admin']; // Add '/admin/...' patterns if needed

export default function AuthRedirector({ children }: { children: React.ReactNode }) {
  const { user, profile, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Log dependencies on every run
    console.log(`AuthRedirector Effect RUN: isLoading=${isLoading}, user=${!!user}, profile=${!!profile}, isAdmin=${profile?.is_admin ?? 'N/A'}, path=${pathname}`);

    if (isLoading) {
      console.log("AuthRedirector: Still loading auth state...");
      return; // Wait for auth state to load
    }

    const isAdmin = profile?.is_admin ?? false; // Use loaded profile safely
    const isPublic = publicPaths.some(p => pathname.startsWith(p));
    const isAdminPath = adminPaths.some(p => pathname === p || pathname.startsWith(p + '/'));
    const isRoot = pathname === '/';

    let targetPath: string | null = null;

    if (user) {
      // --- User is Logged In ---
      console.log("AuthRedirector: User is logged in.");
      if (isPublic && !isRoot) { // Don't redirect from root '/' for now
        targetPath = isAdmin ? '/admin' : '/dashboard';
        console.log(`AuthRedirector: Condition MET: User on public auth page (${pathname}). Target: ${targetPath}`);
      } else if (isAdminPath && !isAdmin) {
        targetPath = '/dashboard';
        console.log(`AuthRedirector: Condition MET: Non-admin on admin path (${pathname}). Target: ${targetPath}`);
      } else {
         console.log(`AuthRedirector: Conditions NOT MET for logged-in redirect (path=${pathname}, isAdmin=${isAdmin}, isAdminPath=${isAdminPath}).`);
      }
    } else {
      // --- User is Logged Out ---
      console.log("AuthRedirector: User is logged out.");
      if (!isPublic && !isRoot) {
        targetPath = '/signin';
        console.log(`AuthRedirector: Condition MET: No user on protected path (${pathname}). Target: ${targetPath}`);
      } else {
         console.log(`AuthRedirector: Conditions NOT MET for logged-out redirect (path=${pathname}, isPublic=${isPublic}).`);
      }
    }

    // Perform redirect only if a target is set AND we aren't already there
    if (targetPath && targetPath !== pathname) {
       console.log(`AuthRedirector: >>> Attempting router.replace('${targetPath}') from path '${pathname}'...`);
       try {
           router.replace(targetPath);
           // NOTE: Log below might not appear if navigation succeeds immediately
           console.log(`AuthRedirector: <<< router.replace('${targetPath}') called.`);
       } catch (redirectError) {
           console.error(`AuthRedirector: Error during router.replace('${targetPath}'):`, redirectError);
       }
    } else if (targetPath && targetPath === pathname) {
       console.log(`AuthRedirector: Already on target path '${pathname}', no redirect needed.`);
    } else {
       console.log(`AuthRedirector: No redirect target path determined.`);
    }

  // Include all dependencies that the effect reads
  }, [isLoading, user, profile, pathname, router]);

  // Render loading indicator OR children
  if (isLoading) {
      return <div>Loading Application...</div>; // Or your global loading spinner
  }

  return <>{children}</>;
}