'use client';
import { useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider'; // Adjust path if needed
import { usePathname, useRouter } from 'next/navigation';

export default function AuthRedirector({ children }: { children: React.ReactNode }) {
  const { user, profile, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

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
      console.log(`AuthRedirector: Replacing URL for authenticated ${isAdmin ? 'admin' : 'user'} from ${pathname} to ${targetPath}...`);
      router.replace(targetPath); // Use replace
      return; // Prevent potential duplicate runs if state updates rapidly
    }

  // Dependencies ensure effect runs when state resolves or path changes
  }, [isLoading, user, profile, pathname, router]);

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


  return <>{children}</>;
}
