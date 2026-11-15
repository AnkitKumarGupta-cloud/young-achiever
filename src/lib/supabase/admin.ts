import 'server-only';
import { createClient } from '@supabase/supabase-js';

// Never let Next.js cache Supabase responses: pages must always show the latest data.
const noStore: typeof fetch = (input, init) => fetch(input, { ...init, cache: 'no-store' });

/**
 * Service-role client. Bypasses RLS. SERVER ONLY: `server-only` makes the build fail
 * if this is ever imported from a client component. Only call after requireAdmin().
 */
export function supabaseAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: noStore },
  });
}
