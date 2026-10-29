'use server';

import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { getMe } from '@/lib/auth';
import { toEmail } from '@/lib/username';
import type { FormState } from '@/lib/types';

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const username = String(formData.get('username') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  if (!username || !password) return { error: 'Enter your username and password.' };

  const sb = supabaseServer();
  const { error } = await sb.auth.signInWithPassword({ email: toEmail(username), password });
  if (error) return { error: 'Incorrect username or password.' };

  const me = await getMe();
  if (!me) {
    await sb.auth.signOut();
    return { error: 'This account is not set up. Contact the administrator.' };
  }
  redirect(me.role === 'admin' ? '/admin' : '/parent');
}

export async function logout() {
  await supabaseServer().auth.signOut();
  redirect('/login');
}
