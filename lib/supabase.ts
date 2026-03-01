import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser client - for use in Client Components only
export const supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey);

// Server client factory - for use in Server Components and API routes
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

// Legacy export - do not use in new code
export const supabaseServer = supabaseClient;

export default supabaseClient;
