import type { Achiever, OtherRating, TournamentResult } from './types';

/**
 * The "About" text is written from a fixed template using only the details the parent entered.
 * No free text from parents, no invented facts, no gendered wording, no age/school/location.
 */
export function buildBio(a: Achiever, other: OtherRating[], results: TournamentResult[]): string {
  const name = a.full_name.trim();
  if (!name) return '';
  const first = name.split(/\s+/)[0];
  const t: string[] = [`${name} is a young chess player.`];

  const rt = [
    ['Standard', a.fide_standard],
    ['Rapid', a.fide_rapid],
    ['Blitz', a.fide_blitz],
  ].filter((x): x is [string, number] => typeof x[1] === 'number' && x[1] >= 1000);

  if (rt.length === 1) t.push(`${first} holds a FIDE ${rt[0][0]} rating of ${rt[0][1]}.`);
  else if (rt.length > 1) {
    const l = rt.map((x) => `${x[0]} ${x[1]}`);
    t.push(`${first} holds FIDE ratings of ${l.slice(0, -1).join(', ')} and ${l[l.length - 1]}.`);
  }
  if (a.fide_id) {
    t.push(rt.length ? `Ratings can be checked on the official FIDE site using FIDE ID ${a.fide_id}.` : `${first} is registered with FIDE (ID ${a.fide_id}).`);
  }
  if (other.length) t.push(`Other ratings: ${other.map((x) => `${x.label} ${x.value}`).join('; ')}.`);
  if (results.length) {
    const last = [...results].sort((x, y) => y.year - x.year)[0];
    t.push(
      `${first} has ${results.length} tournament result${results.length > 1 ? 's' : ''} on this page, most recently ${last.event} (${last.year}): ${last.result}.`,
    );
  }
  t.push(`This page was put together by the family to share ${first}’s chess journey.`);
  return t.join(' ');
}

/** Percent position of the face in the main photo. */
export function heroPos(a: Achiever): { x: number; y: number } {
  const c = (v: number | null | undefined, d: number) => (typeof v === 'number' && v >= 0 && v <= 100 ? v : d);
  return { x: c(a.hero_x, 50), y: c(a.hero_y, 35) };
}
