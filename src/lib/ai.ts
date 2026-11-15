import 'server-only';
import { z } from 'zod';
import type { Achiever, OtherRating, TournamentResult } from './types';

/*
 * Optional AI via Google Gemini's free tier (no card needed): set GEMINI_API_KEY in Vercel.
 * Without a key everything still works: certificates are read by free OCR in the browser and
 * the About text uses the standard template.
 */
const KEY = () => process.env.GEMINI_API_KEY;
const MODEL = () => process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';
export const aiEnabled = () => Boolean(KEY());

async function gemini(parts: unknown[], system: string, json: boolean, temperature: number): Promise<string | null> {
  const key = KEY();
  if (!key) return null;
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL()}:generateContent`, {
      method: 'POST',
      cache: 'no-store',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
      signal: AbortSignal.timeout(20000),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts }],
        generationConfig: { temperature, ...(json ? { responseMimeType: 'application/json' } : {}) },
      }),
    });
    if (!res.ok) {
      console.error('Gemini error', res.status, (await res.text()).slice(0, 500));
      return null;
    }
    const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    return data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('').trim() || null;
  } catch (e) {
    console.error('Gemini request failed', e);
    return null;
  }
}

const certSchema = z.object({
  isCertificate: z.boolean().catch(true),
  playerName: z.string().catch(''),
  event: z.string().catch(''),
  place: z.string().catch(''),
  year: z.string().catch(''),
  category: z.string().catch(''),
  timeControl: z.string().catch(''),
  rank: z.string().catch(''),
  points: z.string().catch(''),
  rounds: z.string().catch(''),
});
export type CertReading = z.infer<typeof certSchema>;

export async function readCertificateImage(jpeg: Buffer): Promise<CertReading | null> {
  const out = await gemini(
    [
      { text: 'Read this chess certificate.' },
      { inline_data: { mime_type: 'image/jpeg', data: jpeg.toString('base64') } },
    ],
    'Extract only what is printed on the certificate. Never guess; use "" when something is not printed. ' +
      'Reply with JSON: {"isCertificate": boolean, "playerName": string, "event": string (full tournament name in Title Case, e.g. "Western Asian Youth Chess Championship 2026"), ' +
      '"place": string (city), "year": string (4 digits), "category": string (e.g. "U-10 Girls"), "timeControl": "Classical"|"Rapid"|"Blitz"|"", ' +
      '"rank": string (e.g. "41st"), "points": string (use ½ for halves, e.g. "4½"), "rounds": string (e.g. "9" from "out of 9")}',
    true,
    0,
  );
  if (!out) return null;
  try {
    return certSchema.parse(JSON.parse(out));
  } catch {
    return null;
  }
}

/** A short, warm About paragraph written only from the facts on the page. Returns null without a key or on error. */
export async function writeBio(a: Achiever, other: OtherRating[], results: TournamentResult[], certTitles: string[]): Promise<string | null> {
  if (!aiEnabled()) return null;
  const ratings = [
    ['Standard', a.fide_standard],
    ['Rapid', a.fide_rapid],
    ['Blitz', a.fide_blitz],
  ].filter((r) => typeof r[1] === 'number' && (r[1] as number) >= 1000);
  const facts = {
    name: a.full_name,
    fideId: a.fide_id,
    fideRatings: Object.fromEntries(ratings),
    otherRatings: other.map((o) => `${o.label}: ${o.value}`),
    tournaments: results.map((r) => `${r.year} · ${r.event} · ${r.result}`),
    certificates: certTitles,
  };
  const text = await gemini(
    [{ text: JSON.stringify(facts) }],
    'You write the short "About" paragraph on a young chess player\'s public profile page, shared by their family. ' +
      'Use ONLY the facts given. Never invent wins, titles, coaches, schools, ages, hometowns, personality traits or future plans. ' +
      'Do not use he/she pronouns; use the first name or "they". No contact details. ' +
      'Write 3 to 4 warm, plain-English sentences (max 90 words) for family, coaches and friends. ' +
      'Mention the FIDE ratings and the most notable tournaments naturally; summarise many results rather than listing them all. ' +
      'Be honest about results: a placing like 42nd means "competed", not "won". No headings, quotes, lists or emojis. Reply with the paragraph only.',
    false,
    0.4,
  );
  if (!text) return null;
  const t = text.replace(/^["'\s]+|["'\s]+$/g, '');
  return t.length > 20 ? t.slice(0, 900) : null;
}
