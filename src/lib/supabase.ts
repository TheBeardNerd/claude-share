import { createServerClient, parseCookieHeader } from '@supabase/ssr';
import type { CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { AstroCookies } from 'astro';

interface AstroContext {
  request: Request;
  cookies: AstroCookies;
}

export function createSupabaseClient({ request, cookies }: AstroContext) {
  return createServerClient(
    import.meta.env.SUPABASE_URL,
    import.meta.env.SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => parseCookieHeader(request.headers.get('cookie') ?? ''),
        setAll: (cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            // CookieOptions from @supabase/ssr is Partial<CookieSerializeOptions>, compatible with Astro's cookie options
            cookies.set(name, value, options as Parameters<AstroCookies['set']>[2])
          );
        },
      },
    }
  );
}

// Server-side only — never expose to the client
export function createServiceClient() {
  return createClient(
    import.meta.env.SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}

export async function requireAuth(ctx: AstroContext) {
  const client = createSupabaseClient(ctx);
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) return null;
  if (!user.email?.endsWith('@grizzlies.com')) return null;
  return user;
}
