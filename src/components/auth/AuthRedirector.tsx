'use client';
import { useEffect } from 'react'; // Removed useRef
import { useAuth } from '@/components/auth/AuthProvider'; // Adjust path if needed
import { usePathname, useRouter } // Use Next.js router
    from 'next/navigation';

// Define public paths accessible when logged OUT
const publicPaths = ['/signin', '/signup', '/reset-password', '/auth/callback'];
// Define paths accessible ONLY by admins
const adminPaths = ['/admin'];

export default function AuthRedirector({ children }: { children: React.ReactNode }) {
  const { user, profile, isLoading } = useAuth();
  const router = useRouter(); // Use the router
  const pathname = usePathname();
  // Removed redirectingRef - let router handle potential duplicate calls if needed
  // const redirectingRef = useRef(false);

  useEffect(() => {
    // Log dependencies on every run
    console.log(`AuthRedirector Effect RUN: isLoading=${isLoading}, user=${!!user}, profile=${!!profile}, isAdmin=${profile?.is_admin ?? 'N/A'}, path=${pathname}`);

    // --- WAIT until loading is definitively false ---
    if (isLoading) {
      console.log("AuthRedirector: Still loading auth state...");
      // redirectingRef.current = false; // Removed
      return;
    }

    // --- AND ensure that IF a user exists, the profile is no longer null ---
    // (profile will be null initially, then Object if found, potentially null again if error)
    // This check prevents deciding based on user=true but profile=null
    if (user && profile === null) {
        // This might happen briefly between SIGNED_IN and profile fetch completion
        // OR if profile fetch failed. The console logs from AuthProvider will show why.
        console.log("AuthRedirector: User exists but profile state is null, waiting/skipping redirect logic.");
        // We might get stuck here if profile fetch consistently fails - check AuthProvider logs
        // redirectingRef.current = false; // Removed this leftover line
        return;
    }
    
    // --- Now we know: isLoading is false, and if user exists, profile state is set (either object or null after fetch) ---

    const isAdmin = profile?.is_admin ?? false; // Safely check admin status
    const isPublic = publicPaths.some(p => pathname.startsWith(p));
    const isAdminPath = adminPaths.some(p => pathname === p || pathname.startsWith(p + '/'));
    const isRoot = pathname === '/';

    let targetPath: string | null = null;

    if (user) {
      // --- User is Logged In (and profile state is determined) ---
      console.log(`AuthRedirector: User logged in, profile loaded (isAdmin=${isAdmin}).`);
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

    // Perform redirect if needed
    if (targetPath && targetPath !== pathname) {
       // redirectingRef.current = true; // Removed ref logic
       console.log(`AuthRedirector: >>> Attempting router.replace('${targetPath}')... Current path: ${pathname}`);
       router.replace(targetPath); // Use router.replace for client-side navigation
    } else if (targetPath) {
       console.log(`AuthRedirector: Already on target path '${pathname}'.`);
       // Removed ref logic
    } else {
       console.log(`AuthRedirector: No redirect target path determined.`);
       // redirectingRef.current = false; // Removed ref logic
    }

  // Dependencies: Re-run when loading finishes, user changes, profile changes, or path changes
  }, [isLoading, user, profile, pathname, router]); // Add router to dependency array

  // Render loading indicator OR children
  if (isLoading) {
      return <div>Loading Application...</div>; // Consider a better loading UI
  }

  return <>{children}</>;
}