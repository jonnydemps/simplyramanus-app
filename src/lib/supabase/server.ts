import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '../database.types' // Adjust path relative to this file

// Function to create a Supabase client for Server Components, Server Actions, Route Handlers
// Reads cookies from next/headers
export function createServerActionClient() {
  const cookieStore = cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (_error) { // Prefixed unused variable
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
            console.warn(`ServerActionClient: Failed to set cookie '${name}' from Server Component/Action.`);
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (_error) { // Prefixed unused variable
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
            console.warn(`ServerActionClient: Failed to delete cookie '${name}' from Server Component/Action.`);
          }
        },
      },
    }
  )
}

// Note: You might need a separate function for Route Handlers if they don't have access to `cookies()` from `next/headers`
// In that case, you'd create a client similar to the middleware pattern, passing request/response objects.
