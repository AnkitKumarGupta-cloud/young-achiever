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
    loadImages(sb, a.id),
  ]);

  if (o.error) console.error('other_ratings load failed', o.error);
  if (r.error) console.error('tournament_results load failed', r.error);
  const rows = p;
  let photos: PhotoItem[] = [];
  let certificates: PhotoItem[] = [];
  if (rows.length) {
    const { data: signed } = await sb.storage.from('photos').createSignedUrls(
      rows.map((x) => x.path),
      3600,
    );
    const byPath = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));
    const items = rows
      .filter((x) => byPath.get(x.path))
      .map((x) => ({ id: x.id, url: byPath.get(x.path)!, caption: x.caption, kind: x.kind }));
    photos = items.filter((x) => x.kind !== 'certificate').map(({ kind: _k, ...x }) => x);
    certificates = items.filter((x) => x.kind === 'certificate').map(({ kind: _k, ...x }) => x);
  }

  return {
    achiever: a,
    other: (o.data ?? []) as OtherRating[],
    results: (r.data ?? []) as TournamentResult[],
    photos,
    certificates,
  };
}

type ImageRow = { id: string; path: string; caption: string | null; kind: string };

/** Photos and certificates. Falls back gracefully if the certificates migration (004) has not been run yet. */
async function loadImages(sb: SupabaseClient, achieverId: string): Promise<ImageRow[]> {
  const q = (cols: string) =>
    sb.from('photos').select(cols).eq('achiever_id', achieverId).order('sort').order('created_at');
  const withKind = await q('id, path, caption, kind');
  if (!withKind.error) return (withKind.data ?? []) as unknown as ImageRow[];
  const plain = await q('id, path, caption');
  return ((plain.data ?? []) as unknown as Omit<ImageRow, 'kind'>[]).map((r) => ({ ...r, kind: 'photo' }));
}
