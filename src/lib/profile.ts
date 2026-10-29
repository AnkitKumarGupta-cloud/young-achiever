import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Achiever, LoadedProfile, OtherRating, PhotoItem, TournamentResult } from './types';

type By = { slug?: string; id?: string; ownerId?: string };

/** Loads a profile through whatever client is passed, so RLS decides what is visible. */
export async function loadProfile(sb: SupabaseClient, by: By): Promise<LoadedProfile | null> {
  let q = sb.from('achievers').select('*');
  if (by.slug) q = q.eq('slug', by.slug);
  if (by.id) q = q.eq('id', by.id);
  if (by.ownerId) q = q.eq('owner_id', by.ownerId);
  const { data: achiever } = await q.maybeSingle();
  if (!achiever) return null;
  const a = achiever as Achiever;

  const [o, r, p] = await Promise.all([
    sb.from('other_ratings').select('id, label, value').eq('achiever_id', a.id).order('sort'),
    sb.from('tournament_results').select('id, year, event, result').eq('achiever_id', a.id).order('year', { ascending: false }).order('sort'),
    sb.from('photos').select('id, path, caption').eq('achiever_id', a.id).order('sort').order('created_at'),
  ]);

  const rows = (p.data ?? []) as { id: string; path: string; caption: string | null }[];
  let photos: PhotoItem[] = [];
  if (rows.length) {
    const { data: signed } = await sb.storage.from('photos').createSignedUrls(
      rows.map((x) => x.path),
      3600,
    );
    const byPath = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));
    photos = rows
      .filter((x) => byPath.get(x.path))
      .map((x) => ({ id: x.id, url: byPath.get(x.path)!, caption: x.caption }));
  }

  return {
    achiever: a,
    other: (o.data ?? []) as OtherRating[],
    results: (r.data ?? []) as TournamentResult[],
    photos,
  };
}
