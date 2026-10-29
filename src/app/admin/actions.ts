'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { slugify, toEmail } from '@/lib/username';
import type { FormState } from '@/lib/types';

const createSchema = z.object({
  child: z.string().trim().min(2, 'Enter the child\'s full name.').max(100),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9._-]{3,30}$/, 'Username: 3-30 letters, numbers, dot, dash or underscore.'),
  password: z.string().min(8, 'Password must be at least 8 characters.').max(72),
});

async function uniqueSlug(admin: ReturnType<typeof supabaseAdmin>, name: string) {
  const base = slugify(name);
  for (let i = 0; i < 50; i++) {
    const slug = i === 0 ? base : `${base}-${i + 1}`;
    const { data } = await admin.from('achievers').select('id').eq('slug', slug).maybeSingle();
    if (!data) return slug;
  }
  return `${base}-${Date.now()}`;
}

export async function createParent(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = createSchema.safeParse({
    child: formData.get('child'),
    username: formData.get('username'),
    password: formData.get('password'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { child, username, password } = parsed.data;

  const admin = supabaseAdmin();
  const { data: existing } = await admin.from('profiles').select('id').eq('username', username).maybeSingle();
  if (existing) return { error: 'That username is already taken.' };

  const { data: created, error } = await admin.auth.admin.createUser({
    email: toEmail(username),
    password,
    email_confirm: true,
  });
  if (error || !created.user) return { error: 'Could not create the login. Try a different username.' };
  const uid = created.user.id;

  const { error: pErr } = await admin.from('profiles').insert({ id: uid, username, role: 'parent' });
  const slug = await uniqueSlug(admin, child);
  const { error: aErr } = pErr
    ? { error: pErr }
    : await admin.from('achievers').insert({ owner_id: uid, slug, full_name: child });
  if (pErr || aErr) {
    await admin.auth.admin.deleteUser(uid); // cascades to profile
    return { error: 'Could not create the profile. Nothing was saved.' };
  }

  revalidatePath('/admin');
  return { ok: `Created login "${username}" and page /achievers/${slug}. Share the username and password with the parent.` };
}

export async function resetPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const userId = String(formData.get('userId') ?? '');
  const password = String(formData.get('password') ?? '');
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return { error: 'Bad request.' };
  if (password.length < 8 || password.length > 72) return { error: 'Password must be 8-72 characters.' };

  const admin = supabaseAdmin();
  const { data: target } = await admin.from('profiles').select('role').eq('id', userId).maybeSingle();
  if (!target || target.role !== 'parent') return { error: 'Not a parent account.' };

  const { error } = await admin.auth.admin.updateUserById(userId, { password });
  if (error) return { error: 'Could not reset the password.' };
  return { ok: 'Password changed. Share the new one with the parent.' };
}

export async function takeDown(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  await supabaseAdmin().from('achievers').update({ taken_down: true, published: false }).eq('id', id);
  revalidatePath('/admin');
}

/** Lifts the take-down. The page stays unpublished; the parent has to press Publish again. */
export async function restore(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  await supabaseAdmin().from('achievers').update({ taken_down: false }).eq('id', id);
  revalidatePath('/admin');
}
