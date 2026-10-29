import { createClient } from '@supabase/supabase-js';

/** Anonymous client with no cookies/session. Used by the public page so it behaves exactly like a stranger. */
export function supabasePublic() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
