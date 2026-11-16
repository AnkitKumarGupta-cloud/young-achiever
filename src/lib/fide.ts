import 'server-only';

/**
 * Reads a player's public FIDE profile (ratings.fide.com/profile/<id>).
 * Ratings come from the monthly rating-history table, read by column position:
 * Period | Std | Std games | Rapid | Rapid games | Blitz | Blitz games.
 * The latest non-zero value in each column is the current rating.
 */
export type FideProfile = {
  name: string;
  federation: string;
  birthYear: string;
  standard: number | null;
  rapid: number | null;
  blitz: number | null;
  period: string; // e.g. "2026-Oct"
};

const strip = (s: string) =>
  s
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

export function parseFideProfile(html: string): FideProfile | null {
  const text = strip(html);
  if (/No record found/i.test(text)) return null;

  // Rating history rows: first cell like "2026-Oct"
  const rows: string[][] = [];
  for (const tr of html.match(/<tr[\s\S]*?<\/tr>/gi) ?? []) {
    const cells = (tr.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi) ?? []).map((c) => strip(c));
    if (cells.length >= 4 && /^\d{4}-[A-Za-z]{3}$/.test(cells[0])) rows.push(cells);
  }
  const latest = (col: number) => {
    for (const r of rows) {
      const n = Number((r[col] ?? '').replace(/[^\d]/g, ''));
      if (n >= 1000 && n <= 3500) return n;
    }
    return null;
  };

  const after = (label: string) => (text.match(new RegExp(`${label}\\s*:?\\s*([A-Za-z][A-Za-z .'-]{1,40}?)(?=\\s+(?:B-Year|Gender|Sex|FIDE title|FIDE ID|Federation|$))`, 'i')) ?? [])[1] ?? '';
  const titleTag = (html.match(/<title>([\s\S]*?)<\/title>/i) ?? [])[1] ?? '';
  const nameFromTitle = strip(titleTag).replace(/\s*[-|·].*FIDE.*$/i, '').replace(/FIDE.*$/i, '').trim();
  const nameMatch = text.match(/([A-Z][A-Za-z'-]+,\s+[A-Z][A-Za-z' -]+?)(?=\s+(?:FIDE ID|STANDARD|Federation|\d))/);

  return {
    name: (nameMatch?.[1] ?? nameFromTitle).trim(),
    federation: after('Federation'),
    birthYear: (text.match(/B-Year\s*:?\s*(\d{4})/i) ?? [])[1] ?? '',
    standard: latest(1),
    rapid: latest(3),
    blitz: latest(5),
    period: rows[0]?.[0] ?? '',
  };
}

export async function fetchFide(id: string): Promise<FideProfile | null> {
  if (!/^\d{3,10}$/.test(id)) return null;
  try {
    const res = await fetch(`https://ratings.fide.com/profile/${id}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; YoungAchievers/1.0; +https://young-achievers.vercel.app)', accept: 'text/html' },
    });
    if (!res.ok) {
      console.error('FIDE fetch failed', id, res.status);
      return null;
    }
    const p = parseFideProfile(await res.text());
    if (!p) console.error('FIDE: no record for', id);
    return p;
  } catch (e) {
    console.error('FIDE fetch error', id, e);
    return null;
  }
}

/** Does the FIDE name plausibly belong to this child? (shares a word of 3+ letters) */
export function nameMatches(fideName: string, childName: string): boolean {
  const w = (s: string) => s.toLowerCase().split(/[^a-z]+/).filter((x) => x.length > 2);
  const mine = new Set(w(childName));
  return !fideName || w(fideName).some((x) => mine.has(x));
}
