'use client';
import { useEffect } from 'react'; // Removed useState
import { useAuth } from '@/components/auth/AuthProvider'; // Adjust path if needed
import { usePathname, useRouter } // Use Next.js router
    from 'next/navigation';

// Public/Admin paths are now handled by middleware
// const publicPaths = ['/signin', '/signup', '/reset-password', '/auth/callback'];
// const adminPaths = ['/admin'];

export default function AuthRedirector({ children }: { children: React.ReactNode }) {
  const { user, profile, isLoading } = useAuth();
  const router = useRouter(); // Use the router
  const pathname = usePathname();
  // Removed unused redirectInitiated state
  // const [redirectInitiated, setRedirectInitiated] = useState(false);

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

    // Middleware now handles redirects based on auth status and path.
    // This component now primarily ensures children are rendered only after
    // the initial auth state is resolved (isLoading is false).
    console.log(`AuthRedirector: State check - isLoading=${isLoading}, user=${!!user}, profile=${!!profile}`);

    // No redirection logic needed here anymore.

  // Dependencies: Re-run when loading finishes, user changes, profile changes, or path changes
  }, [isLoading, user, profile, pathname, router]); // Add router to dependency array

  // Render loading indicator OR children
  if (isLoading) {
      return <div>Loading Application...</div>; // Consider a better loading UI
  }

  return <>{children}</>;
}