import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser client - uses cookies for session persistence (via @supabase/ssr)
export const supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey);

// For server components - use this in API routes and server components
export const createSupabaseServerClient = async () => {
  const { createServerClient } = await import('@supabase/ssr');
  const { cookies } = await import('next/headers');
  
  const cookieStore = await cookies();
  
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Handle cookie errors in server components
        }
      },
    },
  });
};

// Legacy export for backward compatibility
export const supabaseServer = supabaseClient;

export default supabaseClient;
