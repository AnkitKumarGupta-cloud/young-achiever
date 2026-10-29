import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireParent } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase/server';
import { loadProfile } from '@/lib/profile';
import ProfileView from '@/components/ProfileView';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };

export default async function ParentPreview() {
  const me = await requireParent();
  const profile = await loadProfile(supabaseServer(), { ownerId: me.id });
  if (!profile) notFound();
  const a = profile.achiever;
  const state = a.taken_down ? 'taken down' : a.published ? 'live' : 'a draft (only you can see it)';
  return (
    <>
      <div className="preview-bar">
        Preview. Your page is currently <b>{state}</b>. <Link href="/parent">← Back to dashboard</Link>
      </div>
      <ProfileView profile={profile} />
    </>
  );
}
