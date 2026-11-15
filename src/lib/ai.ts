import 'server-only';
import { generateObject, generateText } from 'ai';
import { z } from 'zod';
import type { Achiever, OtherRating, TournamentResult } from './types';

// Vercel AI Gateway (authenticates automatically when running on Vercel). Small, fast, cheap model.
const MODEL = 'anthropic/claude-haiku-5.5';

export const certSchema = z.object({
  isCertificate: z.boolean().describe('true if the image is a chess certificate or result document'),
  playerName: z.string().describe('Name printed on the certificate, or empty'),
  event: z.string().describe('Full tournament name as printed, in normal Title Case, e.g. "Western Asian Youth Chess Championship 2026"'),
  place: z.string().describe('Venue city if printed, e.g. "Ahmedabad", else empty'),
  year: z.string().describe('Four-digit year of the tournament'),
  category: z.string().describe('Age/section category if printed, e.g. "U-10 Girls", else empty'),
  timeControl: z.string().describe('Classical, Rapid or Blitz if printed, else empty'),
  rank: z.string().describe('Placing exactly as printed, e.g. "41st", else empty'),
  points: z.string().describe('Points scored, using ½ for halves, e.g. "4½"'),
  rounds: z.string().describe('Total rounds or points possible if printed (e.g. "9" in "out of 9"), else empty'),
});
export type CertReading = z.infer<typeof certSchema>;

export async function readCertificateImage(jpeg: Buffer): Promise<CertReading | null> {
  try {
    const { object } = await generateObject({
      model: MODEL,
      schema: certSchema,
      temperature: 0,
      abortSignal: AbortSignal.timeout(25000),
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Read this chess certificate and extract only what is printed on it. Never guess: leave a field empty if it is not printed.' },
            { type: 'image', image: jpeg, mediaType: 'image/jpeg' },
          ],
        },
      ],
    });
    return object;
  } catch (e) {
    console.error('AI certificate read failed', e);
    return null;
  }
}

/** A short, warm About paragraph written only from the facts on the page. Returns null if AI is unavailable. */
export async function writeBio(a: Achiever, other: OtherRating[], results: TournamentResult[], certTitles: string[]): Promise<string | null> {
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
  try {
    const { text } = await generateText({
      model: MODEL,
      temperature: 0.4,
      abortSignal: AbortSignal.timeout(20000),
      system:
        'You write the short "About" paragraph on a young chess player\'s public profile page, shared by their family. ' +
        'Use ONLY the facts given. Never invent wins, titles, coaches, schools, ages, hometowns, personality traits or future plans. ' +
        'Do not use he/she pronouns; use the first name or "they". Do not mention any contact details. ' +
        'Write 3 to 4 warm, plain-English sentences (max 90 words), suitable for family, coaches and friends. ' +
        'Mention the FIDE ratings and the most notable tournaments naturally; summarise many results rather than listing them all. ' +
        'Present results honestly: a placing like 42nd is "competed", not "won". No headings, no quotes, no emojis.',
      prompt: JSON.stringify(facts),
    });
    const t = text.trim().replace(/^"|"$/g, '');
    return t.length > 20 ? t.slice(0, 900) : null;
  } catch (e) {
    console.error('AI bio failed', e);
    return null;
  }
}
