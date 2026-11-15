import 'server-only';
import type { Achiever, OtherRating, TournamentResult } from './types';

/*
 * Optional AI writer for the About paragraph: an open-source model (Meta Llama 3.1 8B) on Groq's free plan.
 * Set GROQ_API_KEY in Vercel to turn it on. Without a key, the standard About text is used.
 */
const KEY = () => process.env.GROQ_API_KEY;
const MODEL = () => process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

async function chat(system: string, user: string): Promise<string | null> {
  const key = KEY();
  if (!key) return null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        cache: 'no-store',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(15000),
        body: JSON.stringify({
          model: MODEL(),
          temperature: 0.4,
          max_tokens: 300,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
        return data.choices?.[0]?.message?.content?.trim() || null;
      }
      console.error('Groq error', res.status, (await res.text()).slice(0, 300));
      if (res.status !== 429 && res.status < 500) return null; // only retry rate limits and server errors
    } catch (e) {
      console.error('Groq request failed', e);
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  return null;
}

/** A short, warm About paragraph written only from the facts on the page. Returns null without a key or on error. */
export async function writeBio(a: Achiever, other: OtherRating[], results: TournamentResult[], certTitles: string[]): Promise<string | null> {
  if (!KEY()) return null;
  const first = a.full_name.trim().split(/\s+/)[0];
  const ratings = [
    ['Standard', a.fide_standard],
    ['Rapid', a.fide_rapid],
    ['Blitz', a.fide_blitz],
  ].filter((r) => typeof r[1] === 'number' && (r[1] as number) >= 1000);
  const facts = [
    `Name: ${a.full_name}`,
    a.fide_id ? `Has a FIDE ID (plays FIDE-rated chess)` : '',
    ratings.length ? `FIDE ratings: ${ratings.map(([k, v]) => `${k} ${v}`).join(', ')}` : 'No FIDE ratings given',
    other.length ? `Other ratings: ${other.map((o) => `${o.label} ${o.value}`).join('; ')}` : '',
    results.length ? `Tournament results:\n${results.map((r) => `- ${r.year}: ${r.event} — ${r.result}`).join('\n')}` : 'No tournament results given',
    certTitles.length ? `Certificates on the page: ${certTitles.join('; ')}` : '',
  ]
    .filter(Boolean)
    .join('\n');
  const text = await chat(
    'You write the short "About" paragraph on a young chess player\'s public profile page, shared by their family. ' +
      'Use ONLY the facts given. Never invent wins, titles, coaches, schools, ages, hometowns, feelings, personality traits or future plans. ' +
      `Do not use he/she/his/her; use "${first}" or "they". No contact details. ` +
      'Write 3 to 4 warm, plain-English sentences, at most 90 words, for family, coaches and friends. ' +
      'Mention the FIDE ratings and the main tournaments naturally; summarise rather than listing every result. ' +
      'Be honest: a placing like 42nd means they competed, not that they won. ' +
      'Reply with the paragraph only: no title, no quotes, no lists, no emojis.',
    facts,
  );
  if (!text) return null;
  const t = text.replace(/^["'\s]+|["'\s]+$/g, '').replace(/\s+/g, ' ');
  // Safety net: reject anything that slips in pronouns or numbers that are not in the facts.
  if (/\b(he|she|his|her|him)\b/i.test(t)) return null;
  const nums: string[] = t.match(/\d+/g) ?? [];
  if (nums.some((n) => !facts.includes(n))) return null;
  return t.length > 20 ? t.slice(0, 900) : null;
}
