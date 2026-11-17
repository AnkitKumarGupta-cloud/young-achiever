import type { TournamentResult } from './types';

export type Highlight = { kind: 'place' | 'score' | 'stage'; big: string; label: string; event: string; year: number };

const WORD_PLACE: [RegExp, number][] = [
  [/\b(winner|champion|gold)\b/i, 1],
  [/\b(runner[- ]?up|silver)\b/i, 2],
  [/\bbronze\b/i, 3],
];
const BIG_STAGE = /\b(world|asian|asia|commonwealth|international|national)\b/i;

function placeOf(result: string): number | null {
  const m = result.match(/\b(\d{1,3})\s?(st|nd|rd|th)\b/i);
  if (m) return Number(m[1]);
  for (const [re, n] of WORD_PLACE) if (re.test(result)) return n;
  return null;
}

function scoreOf(result: string): { got: number; of: number } | null {
  const m = result.match(/([\d]+(?:\.5)?|½)(½)?\s*\/\s*(\d+)/);
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

/** Up to three automatic highlights from the results: best placing, best score, biggest stage. */
export function buildHighlights(results: TournamentResult[]): Highlight[] {
  const out: Highlight[] = [];
  const used = new Set<string>();

  const placed = results
    .map((r) => ({ r, p: placeOf(r.result) }))
    .filter((x): x is { r: TournamentResult; p: number } => x.p !== null && x.p > 0 && x.p <= 50)
    .sort((a, b) => a.p - b.p || Number(BIG_STAGE.test(b.r.event)) - Number(BIG_STAGE.test(a.r.event)) || b.r.year - a.r.year)[0];
  if (placed) {
    const { event, section } = split(placed.r);
    out.push({ kind: 'place', big: ordinal(placed.p), label: section ? `${section}` : 'Place', event, year: placed.r.year });
    used.add(placed.r.id);
  }

  const scored = results
    .map((r) => ({ r, s: scoreOf(r.result) }))
    .filter((x): x is { r: TournamentResult; s: { got: number; of: number } } => x.s !== null && x.s.of >= 3)
    .sort((a, b) => b.s.got / b.s.of - a.s.got / a.s.of || b.s.of - a.s.of || b.r.year - a.r.year)[0];
  if (scored && (!used.has(scored.r.id) || !placed)) {
    const { event, section } = split(scored.r);
    out.push({
      kind: 'score',
      big: `${fmt(scored.s.got)}/${scored.s.of}`,
      label: `Points${section ? ` · ${section}` : ''}`,
      event,
      year: scored.r.year,
    });
    used.add(scored.r.id);
  }

  const stage = results
    .filter((r) => BIG_STAGE.test(split(r).event))
    .sort((a, b) => Number(/world/i.test(b.event)) - Number(/world/i.test(a.event)) || b.year - a.year)[0];
  if (stage && !used.has(stage.id)) {
    const m = split(stage).event.match(BIG_STAGE)![1].toLowerCase();
    const level = m === 'national' ? 'National' : m === 'asia' || m === 'asian' ? 'Continental' : 'International';
    out.push({ kind: 'stage', big: level, label: 'Level played', event: split(stage).event, year: stage.year });
  }
  return out;
}
