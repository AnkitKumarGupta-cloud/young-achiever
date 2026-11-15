import { createClient } from '@supabase/supabase-js';

// Never let Next.js cache Supabase responses: pages must always show the latest data.
const noStore: typeof fetch = (input, init) => fetch(input, { ...init, cache: 'no-store' });

/** Anonymous client with no cookies/session. Used by the public page so it behaves exactly like a stranger. */
export function supabasePublic() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: noStore },
  });
}
