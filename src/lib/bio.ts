import type { Achiever, OtherRating, TournamentResult } from './types';

/**
 * The standard "About" text, written from a fixed set of sentence patterns using only what the parent entered.
 * No free text from parents, no invented facts, no gendered wording, no age/school/location.
 * (If an AI key is set, saving replaces this with an AI-written paragraph built from the same facts.)
 */
export function buildBio(a: Achiever, other: OtherRating[], results: TournamentResult[]): string {
  const name = a.full_name.trim();
  if (!name) return '';
  const first = name.split(/\s+/)[0];
  const list = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
  const t: string[] = [];

  t.push(a.fide_id ? `${name} is a young chess player who competes in FIDE-rated tournaments.` : `${name} is a young chess player.`);

  const rt = [
    ['Rapid', a.fide_rapid],
    ['Standard', a.fide_standard],
    ['Blitz', a.fide_blitz],
  ].filter((x): x is [string, number] => typeof x[1] === 'number' && x[1] >= 1000);
  if (rt.length === 1) t.push(`${first} holds a FIDE ${rt[0][0]} rating of ${rt[0][1]}.`);
  else if (rt.length > 1) t.push(`${first} holds FIDE ratings of ${list(rt.map(([k, v]) => `${v} in ${k}`))}.`);

  if (results.length) {
    const year = Math.max(...results.map((r) => r.year));
    const base = (e: string) => e.split(' · ')[0].trim();
    const events: string[] = [];
    const sections = new Map<string, string[]>();
    for (const r of results.filter((x) => x.year === year)) {
      const b = base(r.event);
      if (!events.includes(b)) events.push(b);
      const tc = (r.event.match(/\b(classical|rapid|blitz)\b/i) ?? [])[1];
      if (tc) sections.set(b, [...(sections.get(b) ?? []), tc.toLowerCase()]);
    }
    const named = events.slice(0, 3).map((e) => {
      const tcs = sections.get(e) ?? [];
      return tcs.length > 1 ? `the ${e} (${list(tcs)})` : `the ${e}`;
    });
    const more = events.length > 3 ? ` and ${events.length - 3} more event${events.length - 3 > 1 ? 's' : ''}` : '';
    t.push(`In ${year}, ${first} played in ${list(named)}${more}.`);
    const podium = results.find((r) => /\b(1st|2nd|3rd|first|second|third|winner|champion|gold|silver|bronze)\b/i.test(r.result));
    if (podium) t.push(`A highlight was ${podium.result} at the ${base(podium.event)} (${podium.year}).`);
    const older = results.filter((r) => r.year < year).length;
    if (older) t.push(`The page also lists ${older} earlier result${older > 1 ? 's' : ''}.`);
  }
  if (other.length) t.push(`${first} also holds ${list(other.map((x) => `a ${x.label} of ${x.value}`))}.`);
  t.push(`This page was put together by the family to share ${first}\u2019s chess journey.`);
  return t.join(' ');
}

/** Percent position of the face in the main photo. */
export function heroPos(a: Achiever): { x: number; y: number } {
  const c = (v: number | null | undefined, d: number) => (typeof v === 'number' && v >= 0 && v <= 100 ? v : d);
  return { x: c(a.hero_x, 50), y: c(a.hero_y, 35) };
}
