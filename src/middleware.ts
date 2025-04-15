import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(req: NextRequest) {
  // Create an outgoing response object based on the incoming request
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  // Create a Supabase client configured to use cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // If `set` is called, the incoming request's cookies are potentially outdated
          // So we need to set the cookie on the latest request object
          req.cookies.set({ name, value, ...options });
          // And set the cookie on the response object to send it back to the browser
          response = NextResponse.next({
            request: { headers: req.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          // If `remove` is called, the incoming request's cookies are potentially outdated
          // So we need to update the request object (removing the cookie)
          req.cookies.set({ name, value: '', ...options });
          // And set the cookie on the response object to actually remove it from the browser
          response = NextResponse.next({
            request: { headers: req.headers },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Use getUser() instead of getSession(). getUser() validates the JWT server-side.
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = req.nextUrl;

  // Define paths that are accessible without authentication
  const isPublicPath =
      pathname === '/' ||
      pathname.startsWith('/signin') ||
      pathname.startsWith('/signup') ||
      pathname.startsWith('/reset-password') ||
      pathname === '/auth/callback' || // Add your auth callback path
      pathname === '/favicon.ico' ||
      pathname.startsWith('/api/webhooks/'); // Allow webhook routes

  // --- Route Protection Logic ---

  // If user is NOT logged in and trying to access a protected path
  if (!user && !isPublicPath) {
    console.log(`Middleware: No user, accessing protected path ${pathname}, redirecting to /signin`);
    return NextResponse.redirect(new URL('/signin', req.url));
  }

  // If user IS logged in and tries to access signin/signup pages
  if (user && (pathname.startsWith('/signin') || pathname.startsWith('/signup'))) {
     console.log(`Middleware: User logged in, accessing auth path ${pathname}, redirecting to /dashboard`);
     // Redirect to dashboard (or admin if you prefer as default for admin)
     return NextResponse.redirect(new URL('/dashboard', req.url)); 
  }

  // --- Admin Route Protection (Optional - Basic Check) ---
  // Note: Fetching profile data here can be slow/complex. 
  // It's often better to handle fine-grained checks within the /admin layout or pages.
  // This basic check just ensures a user *exists* if they try to access /admin.
  if (!user && pathname.startsWith('/admin')) {
      console.log(`Middleware: No user, accessing /admin path, redirecting to /signin`);
      return NextResponse.redirect(new URL('/signin', req.url));
  }
  // If you uncomment the check below, you need service_role key access in middleware securely.
  // if (user && pathname.startsWith('/admin')) {
  //   const { data: profile, error } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
  //   if (error || !profile?.is_admin) {
  //     console.log(`Middleware: Non-admin user (${user.id}) attempting to access ${pathname}, redirecting`);
  //     return NextResponse.redirect(new URL('/dashboard', req.url)); // Redirect non-admins away
  //   }
  //   console.log(`Middleware: Admin user (${user.id}) accessing ${pathname}`);
  // }


  // If none of the above conditions caused a redirect, allow the request to proceed.
  // Return the potentially modified 'response' object which includes any cookies set by Supabase helpers.
  return response;
}

// --- Config (Adjust matcher as needed) ---
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes, except webhooks handled above)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)', // Adjusted to exclude more api routes but allow middleware on pages
  ],
};