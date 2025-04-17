'use client';
import { useEffect, useState } from 'react'; // Added useState
import { useAuth } from '@/components/auth/AuthProvider'; // Adjust path if needed
import { usePathname, useRouter } from 'next/navigation';

export default function AuthRedirector({ children }: { children: React.ReactNode }) {
  const { user, profile, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);

  useEffect(() => {
    console.log(`AuthRedirector Effect RUN: isLoading=${isLoading}, user=${!!user}, profile=${!!profile}, isAdmin=${profile?.is_admin ?? 'N/A'}, path=${pathname}`);

    // Wait until loading is complete
    if (isLoading) {
      console.log("AuthRedirector: Still loading auth state...");
      return;
    }

    // Wait for profile state if user exists but profile hasn't loaded yet
    if (user && profile === null) {
        console.log("AuthRedirector: User exists but profile state is null, waiting/skipping redirect logic.");
        return;
    }

    // --- Client-side redirect logic ---
    // Redirect authenticated users away from auth pages
    // Now checks profile state is resolved (not null) before checking is_admin
    if (user && profile && (pathname === '/signin' || pathname === '/signup')) {
      const isAdmin = profile.is_admin === true;
      const targetPath = isAdmin ? '/admin' : '/dashboard';
      console.log(`AuthRedirector: Setting state to trigger redirect for authenticated ${isAdmin ? 'admin' : 'user'} from ${pathname} to ${targetPath}...`);
      setRedirectPath(targetPath);
      setShouldRedirect(true);
      // No direct navigation call here anymore
    }

  // Dependencies ensure effect runs when state resolves or path changes
  }, [isLoading, user, profile, pathname]); // Removed router from this effect's dependencies

  // New effect to handle the actual navigation when shouldRedirect becomes true
  useEffect(() => {
    if (shouldRedirect && redirectPath) {
      console.log(`AuthRedirector: Executing redirect navigation to ${redirectPath}...`);
      router.replace(redirectPath);
    }
  }, [shouldRedirect, redirectPath, router]);

  // Render loading indicator OR children
  // AuthProvider also renders a loading state, but this ensures nothing renders until redirect logic runs
  if (isLoading) {
      return <div>Loading Authentication...</div>; // Or a more sophisticated spinner
  }

  // If user exists but profile is still null after loading, show loading (or handle error)
  // This prevents rendering children prematurely if profile fetch failed but isLoading became false
  if (user && profile === null) {
      console.log("AuthRedirector: Rendering loading state while profile is null after initial load.");
      return <div>Loading Profile...</div>; // Indicate profile loading specifically
  }

  // If redirect state is set, show redirecting message (navigation happens in the effect above)
  if (shouldRedirect) {
      return <div>Redirecting...</div>;
  }

  return <>{children}</>;
}
