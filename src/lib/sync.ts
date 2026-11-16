import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { fetchFide, nameMatches } from './fide';
import { writeBio } from './ai';
import type { Achiever } from './types';

export const FIDE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

/** Pulls ratings from FIDE and saves them. Returns a short status for the parent. */
export async function syncFide(sb: SupabaseClient, a: Pick<Achiever, 'id' | 'fide_id' | 'full_name'>): Promise<{ ok: boolean; message: string; changed: boolean }> {
  if (!a.fide_id) return { ok: false, message: 'Add the FIDE ID to fetch ratings automatically.', changed: false };
  const p = await fetchFide(a.fide_id);
  if (!p) return { ok: false, message: 'Could not find this FIDE ID on the FIDE website. Please check the number.', changed: false };
  const { data: before } = await sb.from('achievers').select('fide_standard, fide_rapid, fide_blitz').eq('id', a.id).maybeSingle();
  const next = { fide_standard: p.standard, fide_rapid: p.rapid, fide_blitz: p.blitz };
  const changed = !before || before.fide_standard !== next.fide_standard || before.fide_rapid !== next.fide_rapid || before.fide_blitz !== next.fide_blitz;
  const { error } = await sb.from('achievers').update({ ...next, fide_synced_at: new Date().toISOString() }).eq('id', a.id);
  if (error) return { ok: false, message: 'Could not save the FIDE ratings.', changed: false };
  const warn = nameMatches(p.name, a.full_name) ? '' : ` Note: FIDE lists this ID as "${p.name}". Please check it is the right player.`;
  return { ok: true, message: `Ratings updated from FIDE${p.period ? ` (${p.period} list)` : ''}.${warn}`, changed };
}

/** Rewrites the About paragraph from what is saved now (AI if configured, otherwise the standard text is used). */
export async function refreshBio(sb: SupabaseClient, achieverId: string) {
  const [{ data: a }, { data: other }, { data: results }, { data: certs }] = await Promise.all([
    sb.from('achievers').select('*').eq('id', achieverId).maybeSingle(),
    sb.from('other_ratings').select('id, label, value').eq('achiever_id', achieverId).order('sort'),
    sb.from('tournament_results').select('id, year, event, result').eq('achiever_id', achieverId).order('year', { ascending: false }).order('sort'),
    sb.from('photos').select('caption').eq('achiever_id', achieverId).eq('kind', 'certificate'),
  ]);
  if (!a) return;
  const bio = await writeBio(a as Achiever, other ?? [], results ?? [], (certs ?? []).map((c) => c.caption as string).filter(Boolean));
  await sb.from('achievers').update({ bio: bio ?? '' }).eq('id', achieverId);
}
