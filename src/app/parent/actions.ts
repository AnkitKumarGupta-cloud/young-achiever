'use server';

import { randomUUID } from 'crypto';
import sharp from 'sharp';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireParent } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase/server';
import { siteOrigin } from '@/lib/site';
import type { Achiever, FormState } from '@/lib/types';
import { refreshBio, syncFide } from '@/lib/sync';

const MAX_PHOTOS = 8;
const MAX_CERTS = 12;
const MAX_ROWS = 50;

const optInt = (label: string) =>
  z
    .string()
    .trim()
    .transform((v) => (v === '' ? null : Number(v)))
    .refine(
      (v) => v === null || (Number.isInteger(v) && v >= 1000 && v <= 3500),
      `${label} rating must be a whole number from 1000 to 3500. Leave it blank if there is no rating yet.`,
    );

const baseSchema = z.object({
  full_name: z.string().trim().min(2, 'Enter the full name.').max(100),
  fide_id: z
    .string()
    .trim()
    .refine((v) => v === '' || /^[0-9]{1,10}$/.test(v), 'FIDE ID must be digits only.')
    .transform((v) => (v === '' ? null : v)),
  fide_standard: optInt('Standard rating'),
  fide_rapid: optInt('Rapid rating'),
  fide_blitz: optInt('Blitz rating'),
});

function str(fd: FormData, k: string) {
  return String(fd.get(k) ?? '');
}

export async function saveProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const me = await requireParent();
  const sb = supabaseServer(); // acts as the parent; RLS limits everything to their own child
  const intent = str(formData, 'intent');

  const { data: ach } = await sb.from('achievers').select('id, taken_down, slug, fide_id, full_name').eq('owner_id', me.id).maybeSingle();
  if (!ach) return { error: 'No page found for this account. Contact the administrator.' };

  const parsed = baseSchema.safeParse({
    full_name: str(formData, 'full_name'),
    fide_id: str(formData, 'fide_id'),
    fide_standard: str(formData, 'fide_standard'),
    fide_rapid: str(formData, 'fide_rapid'),
    fide_blitz: str(formData, 'fide_blitz'),
  });
  // Ratings are normally synced from FIDE; only touch them if the form actually sent them.
  const manualRatings = formData.has('fide_standard') || formData.has('fide_rapid') || formData.has('fide_blitz');
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // Other ratings: label + value
  const labels = formData.getAll('other_label').map(String);
  const values = formData.getAll('other_value').map(String);
  const other: { label: string; value: string; sort: number }[] = [];
  for (let i = 0; i < Math.max(labels.length, values.length); i++) {
    const label = (labels[i] ?? '').trim();
    const value = (values[i] ?? '').trim();
    if (!label && !value) continue;
    if (!label || !value) return { error: 'Each other rating needs both a label and a value.' };
    if (label.length > 80 || value.length > 40) return { error: 'An other rating label or value is too long.' };
    other.push({ label, value, sort: other.length });
  }

  // Tournament results: year, event, result
  const years = formData.getAll('res_year').map(String);
  const events = formData.getAll('res_event').map(String);
  const outcomes = formData.getAll('res_result').map(String);
  const results: { year: number; event: string; result: string; sort: number }[] = [];
  for (let i = 0; i < Math.max(years.length, events.length, outcomes.length); i++) {
    const y = (years[i] ?? '').trim();
    const event = (events[i] ?? '').trim();
    const result = (outcomes[i] ?? '').trim();
    if (!y && !event && !result) continue;
    const year = Number(y);
    if (!y || !event || !result) return { error: 'Each tournament result needs a year, an event and a result.' };
    if (!Number.isInteger(year) || year < 1990 || year > new Date().getFullYear() + 1)
      return { error: `"${y}" is not a valid year.` };
    if (event.length > 160 || result.length > 160) return { error: 'A tournament event or result is too long.' };
    results.push({ year, event, result, sort: results.length });
  }
  if (other.length > MAX_ROWS || results.length > MAX_ROWS) return { error: `At most ${MAX_ROWS} rows each.` };

  if (intent === 'publish' && ach.taken_down) {
    return { error: 'This page was taken down by the administrator and can’t be published. Please contact them.' };
  }

  const { fide_standard, fide_rapid, fide_blitz, ...basics } = parsed.data;
  const update: Record<string, unknown> = { ...basics, ...(manualRatings ? { fide_standard, fide_rapid, fide_blitz } : {}) };
  if (intent === 'publish') update.published = true;
  if (intent === 'unpublish') update.published = false;

  const { error: uErr } = await sb.from('achievers').update(update).eq('id', ach.id);
  if (uErr) return { error: 'Could not save. Please try again.' };

  // Replace child rows (RLS only allows the owner to touch these)
  const d1 = await sb.from('other_ratings').delete().eq('achiever_id', ach.id);
  const d2 = await sb.from('tournament_results').delete().eq('achiever_id', ach.id);
  if (d1.error || d2.error) return { error: 'Could not save ratings/results. Please try again.' };
  if (other.length) {
    const { error } = await sb.from('other_ratings').insert(other.map((r) => ({ ...r, achiever_id: ach.id })));
    if (error) return { error: 'Could not save other ratings.' };
  }
  if (results.length) {
    const { error } = await sb.from('tournament_results').insert(results.map((r) => ({ ...r, achiever_id: ach.id })));
    if (error) return { error: 'Could not save tournament results.' };
  }

  // A new or changed FIDE ID pulls ratings from FIDE straight away.
  if (basics.fide_id && basics.fide_id !== ach.fide_id) await syncFide(sb, { id: ach.id, fide_id: basics.fide_id, full_name: basics.full_name });
  await refreshBio(sb, ach.id);

  revalidatePath('/parent');
  if (intent === 'publish') return { ok: `Published. Your page is live at ${siteOrigin()}/achievers/${ach.slug}` };
  if (intent === 'unpublish') return { ok: 'Unpublished. Your page is no longer public.' };
  return { ok: 'Saved.' };
}

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function uploadPhoto(_prev: FormState, formData: FormData): Promise<FormState> {
  const me = await requireParent();
  const sb = supabaseServer();
  const cert = str(formData, 'kind') === 'certificate';
  const word = cert ? 'certificate' : 'photo';
  const limit = cert ? MAX_CERTS : MAX_PHOTOS;
  const files = formData.getAll('photo').filter((f): f is File => f instanceof File && f.size > 0);
  const captions = formData.getAll('caption').map((c) => String(c).trim().slice(0, 160));
  if (!files.length) return { error: `Choose a ${word} first.` };

  const { data: ach } = await sb.from('achievers').select('id').eq('owner_id', me.id).maybeSingle();
  if (!ach) return { error: 'No page found for this account.' };

  // Count only this kind. Before migration 004 there is no kind column: photos still work, certificates can't be saved yet.
  const counted = await sb.from('photos').select('id', { count: 'exact', head: true }).eq('achiever_id', ach.id).eq('kind', cert ? 'certificate' : 'photo');
  const hasKind = !counted.error;
  let count = counted.count;
  if (!hasKind) {
    if (cert) return { error: 'Certificates need a quick database update first. Please ask the administrator.' };
    const plain = await sb.from('photos').select('id', { count: 'exact', head: true }).eq('achiever_id', ach.id);
    count = plain.count;
  }
  let have = count ?? 0;
  if (have >= limit) return { error: `You can add up to ${limit} ${word}s. Remove one first.` };

  let added = 0;
  let skipped = 0;
  let lastError = '';
  for (const [i, file] of files.entries()) {
    if (have >= limit) {
      skipped++;
      continue;
    }
    if (!ALLOWED.has(file.type)) { lastError = 'Files must be JPG, PNG or WebP images.'; skipped++; continue; }
    if (file.size > 6 * 1024 * 1024) { lastError = 'A file was too large (max 6 MB).'; skipped++; continue; }
    let body: Buffer;
    try {
      // Re-encode: fixes orientation, caps size, and strips all metadata (including GPS location).
      // Certificates keep more pixels so the small print stays readable.
      const max = cert ? 2000 : 1600;
      body = await sharp(Buffer.from(await file.arrayBuffer()))
        .rotate()
        .resize({ width: max, height: max, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: cert ? 88 : 85 })
        .toBuffer();
    } catch {
      lastError = 'A file could not be read as an image.';
      skipped++;
      continue;
    }
    const path = `${ach.id}/${randomUUID()}.jpg`;
    const up = await sb.storage.from('photos').upload(path, body, { contentType: 'image/jpeg' });
    if (up.error) { lastError = 'Upload failed. Please try again.'; skipped++; continue; }
    const row: Record<string, unknown> = { achiever_id: ach.id, path, caption: captions[i] || null, sort: have };
    if (hasKind) row.kind = cert ? 'certificate' : 'photo';
    const { error } = await sb.from('photos').insert(row);
    if (error) {
      await sb.storage.from('photos').remove([path]);
      lastError = `Could not save a ${word}.`;
      skipped++;
      continue;
    }
    have++;
    added++;
  }
  if (added && cert) await refreshBio(sb, ach.id);
  revalidatePath('/parent');
  if (!added) return { error: lastError || `No ${word}s were added.` };
  return { ok: `${added} ${word}${added > 1 ? 's' : ''} added.${skipped ? ` ${skipped} skipped${lastError ? ` (${lastError})` : ` (limit of ${limit})`}.` : ''}` };
}

export async function deletePhoto(formData: FormData) {
  await requireParent();
  const sb = supabaseServer();
  const id = str(formData, 'id');
  const { data: photo } = await sb.from('photos').select('id, path').eq('id', id).maybeSingle(); // RLS: own only
  if (!photo) return;
  await sb.storage.from('photos').remove([photo.path]);
  await sb.from('photos').delete().eq('id', photo.id);
  revalidatePath('/parent');
}

/** Makes a photo the main one (the hero of the page) by sorting it first. */
export async function setMainPhoto(formData: FormData) {
  await requireParent();
  const sb = supabaseServer();
  const id = str(formData, 'id');
  const { data: photo } = await sb.from('photos').select('id, achiever_id').eq('id', id).maybeSingle(); // RLS: own only
  if (!photo) return;
  const { data: first } = await sb.from('photos').select('sort').eq('achiever_id', photo.achiever_id).order('sort').limit(1).maybeSingle();
  await sb.from('photos').update({ sort: (first?.sort ?? 0) - 1 }).eq('id', photo.id);
  revalidatePath('/parent');
}

/** Where the child's face is in the main photo, so every crop keeps it in view. */
export async function saveFocus(x: number, y: number): Promise<FormState> {
  const me = await requireParent();
  const sb = supabaseServer();
  const cl = (v: number) => Math.max(0, Math.min(100, Math.round(Number(v) || 0)));
  const { error } = await sb.from('achievers').update({ hero_x: cl(x), hero_y: cl(y) }).eq('owner_id', me.id);
  if (error) return { error: 'Could not save. Ask the administrator to finish the database update.' };
  revalidatePath('/parent');
  return { ok: 'Saved.' };
}


/** Adds tournament results read from certificates (skips ones already on the page) and refreshes the About text. */
export async function addResults(rows: { year: string; event: string; result: string }[]): Promise<FormState> {
  const me = await requireParent();
  const sb = supabaseServer();
  const { data: ach } = await sb.from('achievers').select('id').eq('owner_id', me.id).maybeSingle();
  if (!ach) return { error: 'No page found for this account.' };
  const { data: existing } = await sb.from('tournament_results').select('event, sort').eq('achiever_id', ach.id);
  const seen = new Set((existing ?? []).map((r) => String(r.event).trim().toLowerCase()));
  let sort = Math.max(-1, ...(existing ?? []).map((r) => Number(r.sort) || 0)) + 1;
  const fresh = [];
  for (const r of rows.slice(0, 20)) {
    const event = String(r.event ?? '').trim().slice(0, 160);
    const result = String(r.result ?? '').trim().slice(0, 160) || 'Participated';
    const year = Number(r.year) || new Date().getFullYear();
    if (!event || seen.has(event.toLowerCase()) || year < 1990 || year > new Date().getFullYear() + 1) continue;
    seen.add(event.toLowerCase());
    fresh.push({ achiever_id: ach.id, year, event, result, sort: sort++ });
  }
  if (fresh.length) {
    const { error } = await sb.from('tournament_results').insert(fresh);
    if (error) return { error: 'Could not save the tournament results.' };
    await refreshBio(sb, ach.id);
  }
  revalidatePath('/parent');
  return { ok: fresh.length ? `${fresh.length} result${fresh.length > 1 ? 's' : ''} added.` : 'Already on the page.' };
}

/** Fetches the latest ratings from FIDE now. */
export async function syncMyFide(fideId?: string): Promise<FormState> {
  const me = await requireParent();
  const sb = supabaseServer();
  const { data: ach } = await sb.from('achievers').select('id, fide_id, full_name').eq('owner_id', me.id).maybeSingle();
  if (!ach) return { error: 'No page found for this account.' };
  // Use the ID typed in the box (and save it), so parents don't have to press Save first.
  const typed = (fideId ?? '').trim();
  if (typed) {
    if (!/^[0-9]{3,10}$/.test(typed)) return { error: 'FIDE ID must be digits only.' };
    if (typed !== ach.fide_id) {
      await sb.from('achievers').update({ fide_id: typed }).eq('id', ach.id);
      ach.fide_id = typed;
    }
  }
  const r = await syncFide(sb, ach);
  if (r.ok) await refreshBio(sb, ach.id);
  revalidatePath('/parent');
  return r.ok ? { ok: r.message } : { error: r.message };
}
