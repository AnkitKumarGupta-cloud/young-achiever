// Usage: npm run create-admin -- <username> <password>
// Creates the single owner/admin account. Run once, locally, with .env.local filled in.
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

async function main() {
  const [username, password] = process.argv.slice(2);
  if (!username || !password || password.length < 10) {
    console.error('Usage: npm run create-admin -- <username> <password (10+ chars)>');
    process.exit(1);
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');

  const admin = createClient(url, key, { auth: { persistSession: false } });
  const u = username.trim().toLowerCase();
  const domain = process.env.AUTH_EMAIL_DOMAIN || 'parents.youngachievers.local';
  const email = u.includes('@') ? u : `${u}@${domain}`;

  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) throw new Error(error?.message ?? 'Could not create user');
  const { error: pErr } = await admin.from('profiles').insert({ id: data.user.id, username: u, role: 'admin' });
  if (pErr) {
    await admin.auth.admin.deleteUser(data.user.id);
    throw new Error(pErr.message);
  }
  console.log(`Admin created. Log in at /login with username "${u}".`);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
