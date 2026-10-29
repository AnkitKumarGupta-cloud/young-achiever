import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabasePublic } from '@/lib/supabase/public';
import { loadProfile } from '@/lib/profile';
import ProfileView from '@/components/ProfileView';

// One load per request: the page and its metadata share it instead of querying twice.
const getProfile = cache((slug: string) => loadProfile(supabasePublic(), { slug }));

// Always fresh: a take-down or unpublish must take effect immediately.
export const dynamic = 'force-dynamic';

// Parent-submitted names are shown, but search engines must not list the children.
const NOINDEX = { index: false, follow: false, noarchive: true, noimageindex: true, nocache: true } as const;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const profile = await getProfile(params.slug);
  return {
    title: profile ? `${profile.achiever.full_name} · Young Achievers` : 'Not found',
    robots: NOINDEX,
  };
}

export default async function PublicProfile({ params }: { params: { slug: string } }) {
  // Anonymous client: RLS only returns pages that are published and not taken down.
  const profile = await getProfile(params.slug);
  if (!profile) notFound();
  return <ProfileView profile={profile} />;
}
