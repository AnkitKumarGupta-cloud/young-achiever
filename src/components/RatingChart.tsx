import type { CSSProperties } from 'react';
import type { Achiever } from '@/lib/types';

type Point = NonNullable<Achiever['fide_history']>[number];
type Key = 's' | 'r' | 'b';

const SERIES: { key: Key; label: string; color: string }[] = [
  { key: 'r', label: 'Rapid', color: '#3047F5' },
  { key: 's', label: 'Standard', color: '#F2AD00' },
  { key: 'b', label: 'Blitz', color: '#10B57F' },
];

/** "2025-Jul" -> "Jul '25" */
const short = (p: string) => {
  const [y, m] = p.split('-');
  return `${m} '${y.slice(2)}`;
};

/**
 * Monthly FIDE rating graph, drawn from the history copied off the official FIDE profile.
 * Lines are SVG (stretched to the box); dots and labels are HTML so text stays crisp on phones.
 */
export default function RatingChart({ history }: { history: Point[] }) {
  const h = history.slice(-36);
  const series = SERIES.map((s) => ({
    ...s,
    pts: h.map((x, i) => ({ i, v: x[s.key] })).filter((x): x is { i: number; v: number } => typeof x.v === 'number'),
  })).filter((s) => s.pts.length >= 2);
  if (h.length < 2 || !series.length) return null;

  const all = series.flatMap((s) => s.pts.map((p) => p.v));
  const step = 25;
  let lo = Math.floor((Math.min(...all) - 10) / step) * step;
  let hi = Math.ceil((Math.max(...all) + 10) / step) * step;
  if (hi - lo < 2 * step) hi = lo + 2 * step;
  const ticks: number[] = [];
  const tickStep = (hi - lo) / step > 6 ? step * Math.ceil((hi - lo) / step / 5) : step;
  for (let t = lo; t <= hi; t += tickStep) ticks.push(t);
  const x = (i: number) => (h.length === 1 ? 50 : (i / (h.length - 1)) * 100);
  const y = (v: number) => 100 - ((v - lo) / (hi - lo)) * 100;

  const labelEvery = Math.max(1, Math.ceil(h.length / 6));
  const xLabels = h.map((p, i) => ({ i, t: short(p.p), m: false })).filter(({ i }) => i % labelEvery === 0 || i === h.length - 1);
  if (xLabels.length > 1 && xLabels[xLabels.length - 1].i - xLabels[xLabels.length - 2].i < labelEvery * 0.6) xLabels.splice(-2, 1);
  // Phones keep only first, middle and last.
  const midI = xLabels[Math.floor((xLabels.length - 1) / 2)]?.i;
  xLabels.forEach((l, n) => (l.m = n === 0 || n === xLabels.length - 1 || l.i === midI));

  const main = series[0];
  const area = `M ${x(main.pts[0].i)} 100 ${main.pts.map((p) => `L ${x(p.i)} ${y(p.v)}`).join(' ')} L ${x(main.pts[main.pts.length - 1].i)} 100 Z`;

  const summary = series.map((s) => {
    const first = s.pts[0];
    const last = s.pts[s.pts.length - 1];
    return { ...s, now: last.v, peak: Math.max(...s.pts.map((p) => p.v)), change: last.v - first.v, since: short(h[first.i].p) };
  });

  return (
    <div className="rc">
      <ul className="rc-sum">
        {summary.map((s) => (
          <li key={s.key} style={{ '--c': s.color } as CSSProperties}>
            <span className="rc-k">
              <i /> FIDE {s.label}
            </span>
            <b>{s.now}</b>
            {s.change > 0 && (
              <span className="rc-d up">
                +{s.change} since {s.since}
              </span>
            )}
            <span className="rc-p">Peak {s.peak}</span>
          </li>
        ))}
      </ul>

      <div
        className="rc-box"
        role="img"
        aria-label={`FIDE rating graph, ${short(h[0].p)} to ${short(h[h.length - 1].p)}. ${summary.map((s) => `${s.label} now ${s.now}, peak ${s.peak}`).join('. ')}.`}
      >
        <div className="rc-y" aria-hidden="true">
          {ticks.map((t) => (
            <span key={t} style={{ top: `${y(t)}%` }}>
              {t}
            </span>
          ))}
        </div>
        <div className="rc-plot" aria-hidden="true">
          {ticks.map((t) => (
            <i key={t} className="rc-grid" style={{ top: `${y(t)}%` }} />
          ))}
          <svg viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="rc-fill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor={main.color} stopOpacity=".22" />
                <stop offset="1" stopColor={main.color} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={area} fill="url(#rc-fill)" />
            {series.map((s) => (
              <polyline
                key={s.key}
                points={s.pts.map((p) => `${x(p.i)},${y(p.v)}`).join(' ')}
                fill="none"
                stroke={s.color}
                strokeWidth={s === main ? 3 : 2.5}
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>
          {series.map((s) =>
            s.pts.map((p, n) => {
              const last = n === s.pts.length - 1;
              return (
                <span
                  key={`${s.key}${p.i}`}
                  className={`rc-dot${last ? ' last' : ''}`}
                  style={{ left: `${x(p.i)}%`, top: `${y(p.v)}%`, '--c': s.color } as CSSProperties}
                  title={`${s.label} ${p.v} · ${short(h[p.i].p)}`}
                />
              );
            }),
          )}
        </div>
        <div className="rc-x" aria-hidden="true">
          {xLabels.map((l) => (
            <span key={l.i} className={l.m ? '' : 'rc-mh'} style={{ left: `${x(l.i)}%` }}>
              {l.t}
            </span>
          ))}
        </div>
      </div>
      <p className="rc-note">Monthly ratings from the official FIDE rating lists.</p>
    </div>
  );
}
