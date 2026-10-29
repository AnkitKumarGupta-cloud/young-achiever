import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { supabaseServer } from './supabase/server';
import type { Me } from './types';

// cache(): one lookup per request, even if several server components ask for the user.
export const getMe = cache(async (): Promise<Me | null> => {
  const sb = supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await sb.from('profiles').select('id, username, role').eq('id', user.id).maybeSingle();
  return (data as Me | null) ?? null;
});

export async function requireAdmin(): Promise<Me> {
  const me = await getMe();
  if (!me) redirect('/login');
  if (me.role !== 'admin') redirect('/parent');
  return me;
}

export async function requireParent(): Promise<Me> {
  const me = await getMe();
  if (!me) redirect('/login');
  if (me.role !== 'parent') redirect('/admin');
  return me;
}
