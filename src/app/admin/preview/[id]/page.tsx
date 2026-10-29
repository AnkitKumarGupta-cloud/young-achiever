import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase/server';
import { loadProfile } from '@/lib/profile';
import ProfileView from '@/components/ProfileView';

export const dynamic = 'force-dynamic';

export const metadata = { robots: { index: false, follow: false } };

export default async function Preview({ params }: { params: { id: string } }) {
  await requireAdmin();
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) notFound();
  const profile = await loadProfile(supabaseServer(), { id: params.id });
  if (!profile) notFound();
  const a = profile.achiever;
  const state = a.taken_down ? 'taken down' : a.published ? 'live' : 'a draft (not public)';

  return (
    <>
      <div className="preview-bar">
        Admin preview. This page is currently <b>{state}</b>. <Link href="/admin">← Back to admin</Link>
      </div>
      <ProfileView profile={profile} />
    </>
  );
}
