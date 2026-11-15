import type { CertGuess } from './types';

/** Best-guess tournament details from a certificate's OCR text. Parents always review before saving. */
const WORDS: Record<string, number> = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11 };

function num(s: string): string {
  const t = s.trim().toLowerCase();
  const half = /(and a half|½|\.5)/.test(t);
  const m = t.match(/\d+/);
  const whole = m ? Number(m[0]) : WORDS[t.split(/\s+/)[0]];
  if (whole === undefined || Number.isNaN(whole)) return s.trim();
  return half ? (whole === 0 ? '½' : `${whole}½`) : String(whole);
}

const titleCase = (s: string) =>
  s
    .toLowerCase()
    .replace(/\b([a-z])/g, (c) => c.toUpperCase())
    .replace(/\b(Fide|Ruas|Aicf|Sai|Gsca)\b/g, (w) => w.toUpperCase())
    .replace(/\b(Of|In|The|And|For)\b/g, (w) => w.toLowerCase())
    .replace(/^./, (c) => c.toUpperCase());

export function parseCertificate(raw: string): CertGuess | null {
  const text = raw.replace(/[—–]/g, '-').replace(/\s*-{2,}\s*/g, ' – ').replace(/[ \t]+/g, ' ');
  const flat = text.replace(/\s*\n\s*/g, ' ');

  let event = '';
  const banner = text
    .split('\n')
    .map((l) => l.trim())
    .find((l) => /(championship|tournament|open|cup|festival)/i.test(l) && l.length > 15 && !/director|arbiter/i.test(l) && l === l.toUpperCase());
  const inline = flat.match(/participated in the (.+?)(?: held | and secured | from \d|$)/i);
  if (banner) event = titleCase(banner.replace(/-(\d{4})$/, ' $1').replace(/[^A-Za-z0-9 .,&'-]/g, ' ').replace(/\s+/g, ' ').trim());
  else if (inline && /[a-z]{4}/i.test(inline[1])) event = inline[1].replace(/\s+/g, ' ').trim();

  const cat = flat.match(/\bca\w{2,5}ry\s*:?[\s_]*(U-?\s?\d+\s?(?:girls|boys|open)?)[\s_]*(?:[a-z]{1,3}(?=[\s_]))?[\s_]*(classical|rapid|blitz|standard)/i);
  let category = '';
  let tc = '';
  if (cat) {
    tc = titleCase(cat[2]);
    category = `${cat[1].replace(/\s+/g, ' ').replace(/U-?\s?(\d+)\s?/i, 'U-$1 ').trim().replace(/girls/i, 'Girls').replace(/boys/i, 'Boys').replace(/open/i, 'Open')} ${tc}`;
  } else {
    const m = flat.match(/\b(rapid|blitz|classical)\b/i);
    if (m && !new RegExp(m[1], 'i').test(event)) category = tc = titleCase(m[1]);
  }

  const years = (flat.match(/\b20\d\d\b/g) ?? []).map(Number);
  const year = (event.match(/\b20\d\d\b/) ?? [])[0] ?? (years.length ? String(Math.max(...years)) : '');

  const outOf = flat.match(/(?:secured|scored)\s+(.+?)\s+out of\s+(\d+)/i);
  const scored = flat.match(/scored\s*_*\s*([\d.½]+|[a-z]+(?: and a half)?)\s*_*\s*points?/i);
  const placed = flat.match(/placed\s*_*\s*(\d+\s?(?:st|nd|rd|th))/i) ?? flat.match(/\b(\d+\s?(?:st|nd|rd|th))\s+(?:place|position|rank)/i);
  const parts: string[] = [];
  if (placed) parts.push(placed[1].replace(/\s/g, ''));
  if (outOf) parts.push(`${num(outOf[1])} / ${outOf[2]} points`);
  else if (scored) {
    const n = num(scored[1]);
    parts.push(`${n} point${n === '1' ? '' : 's'}`);
  }

  if (!event && !parts.length) return null;
  return {
    year,
    event: ([event, category].filter(Boolean).join(' · ') || 'Tournament').slice(0, 160),
    result: (parts.join(' · ') || 'Participated').slice(0, 160),
    title: [event, tc].filter(Boolean).join(' · ').slice(0, 160),
  };
}
