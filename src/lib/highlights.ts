import type { TournamentResult } from './types';

export type Highlight = { kind: 'place' | 'score' | 'stage'; big: string; label: string; event: string; year: number };

const WORD_PLACE: [RegExp, number][] = [
  [/\b(winner|champion|gold)\b/i, 1],
  [/\b(runner[- ]?up|silver)\b/i, 2],
  [/\bbronze\b/i, 3],
];

/** How big the event was: 3 world/international, 2 continental, 1 national, 0 other. */
function levelOf(event: string): { n: number; label: string } {
  if (/\b(world|commonwealth|international)\b/i.test(event)) return { n: 3, label: 'International' };
  if (/\b(asian|asia|african|europe(an)?|pan[- ]?american)\b/i.test(event)) return { n: 2, label: 'Continental' };
  if (/\b(national|all india)\b/i.test(event)) return { n: 1, label: 'National' };
  return { n: 0, label: '' };
}

function placeOf(result: string): number | null {
  const m = result.match(/\b(\d{1,3})\s?(st|nd|rd|th)\b/i);
  if (m) return Number(m[1]);
  for (const [re, n] of WORD_PLACE) if (re.test(result)) return n;
  return null;
}

function scoreOf(result: string): { got: number; of: number } | null {
  const m = result.match(/(\d+(?:\.5)?|½)(½)?\s*\/\s*(\d+)/);
  if (!m) return null;
  const got = (m[1] === '½' ? 0.5 : Number(m[1])) + (m[2] ? 0.5 : 0);
  const of = Number(m[3]);
  return of > 0 && got <= of ? { got, of } : null;
}

const ordinal = (n: number) => {
  const s = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th';
  return `${n}${s}`;
};
const fmt = (x: number) => (x % 1 ? `${Math.floor(x) || ''}½` : String(x));

function split(r: TournamentResult) {
  const [name, ...rest] = r.event.split(' · ');
  return { event: name.trim().replace(/,\s*[A-Z][A-Za-z .'-]{2,30}$/, ''), section: rest.join(' · ').trim() };
}

/**
 * Up to three automatic highlights from the saved results, each from a different event:
 * a top-10 finish, the biggest level played (national and up), and the best score.
 */
export function buildHighlights(results: TournamentResult[]): Highlight[] {
  const out: Highlight[] = [];
  const usedEvents = new Set<string>();

  const placed = results
    .map((r) => ({ r, p: placeOf(r.result) }))
    .filter((x): x is { r: TournamentResult; p: number } => x.p !== null && x.p > 0 && x.p <= 10)
    .sort((a, b) => a.p - b.p || levelOf(b.r.event).n - levelOf(a.r.event).n || b.r.year - a.r.year)[0];
  if (placed) {
    const { event, section } = split(placed.r);
    out.push({ kind: 'place', big: ordinal(placed.p), label: section || 'Place', event, year: placed.r.year });
    usedEvents.add(event);
  }

  const stage = results
    .map((r) => ({ r, l: levelOf(split(r).event) }))
    .filter((x) => x.l.n > 0 && !usedEvents.has(split(x.r).event))
    .sort((a, b) => b.l.n - a.l.n || b.r.year - a.r.year)[0];
  if (stage) {
    const { event } = split(stage.r);
    out.push({ kind: 'stage', big: stage.l.label, label: 'Level played', event, year: stage.r.year });
    usedEvents.add(event);
  }

  const scored = results
    .map((r) => ({ r, s: scoreOf(r.result) }))
    .filter((x): x is { r: TournamentResult; s: { got: number; of: number } } => x.s !== null && x.s.of >= 3 && x.s.got / x.s.of >= 0.4)
    .sort(
      (a, b) =>
        Number(usedEvents.has(split(a.r).event)) - Number(usedEvents.has(split(b.r).event)) ||
        b.s.got / b.s.of - a.s.got / a.s.of ||
        b.s.of - a.s.of ||
        b.r.year - a.r.year,
    )[0];
  if (scored && !usedEvents.has(split(scored.r).event)) {
    const { event, section } = split(scored.r);
    out.push({ kind: 'score', big: `${fmt(scored.s.got)}/${scored.s.of}`, label: `Points${section ? ` · ${section}` : ''}`, event, year: scored.r.year });
  }
  return out;
}
