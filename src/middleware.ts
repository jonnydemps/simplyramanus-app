import { NextRequest, NextResponse } from 'next/server';
import { getSession } from './lib/supabase';

// Define which routes should be protected (require authentication)
const protectedRoutes = ['/dashboard', '/formulations', '/profile', '/admin'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the requested path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  if (isProtectedRoute) {
    // Get the session from Supabase
    const session = await getSession();
    
    // If no session exists, redirect to the sign-in page
    if (!session) {
      const signInUrl = new URL('/signin', request.url);
      signInUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(signInUrl);
    }
    
    // For admin routes, check if user has admin role
    if (pathname.startsWith('/admin')) {
      // This would be implemented when we set up the database schema
      // For now, we'll just check if the user's email contains 'admin'
      const isAdmin = session.user.email?.includes('admin');
      
      if (!isAdmin) {
        // Redirect non-admin users to dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
  }
  
  return NextResponse.next();
}
