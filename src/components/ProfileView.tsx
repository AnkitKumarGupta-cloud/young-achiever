import type { CSSProperties } from 'react';
import Link from 'next/link';
import type { LoadedProfile, TournamentResult } from '@/lib/types';
import { buildBio, heroPos } from '@/lib/bio';
import { buildHighlights } from '@/lib/highlights';
import { siteOrigin } from '@/lib/site';
import { Logo, ShieldIcon } from '@/components/icons';
import ShareButton from '@/components/ShareButton';
import CertGallery from '@/components/CertGallery';
import RatingChart from '@/components/RatingChart';

type Group = { name: string; year: number; rows: { section: string; result: string; id: string }[] };

/** Groups result rows that belong to the same tournament ("Event · Section") so each event shows once. */
function groupResults(results: TournamentResult[]): Group[] {
  const groups: Group[] = [];
  for (const r of results) {
    const [name, ...rest] = r.event.split(' · ');
    const key = `${r.year}|${name.trim().toLowerCase()}`;
    let g = groups.find((x) => `${x.year}|${x.name.toLowerCase()}` === key);
    if (!g) groups.push((g = { name: name.trim(), year: r.year, rows: [] }));
    g.rows.push({ id: r.id, section: rest.join(' · '), result: r.result });
  }
  return groups;
}

/** Splits "Western Asian Youth Chess Championship 2026, Ahmedabad" into title and place. */
function splitPlace(name: string): [string, string] {
  const m = name.match(/^(.*?),\s*([A-Z][A-Za-z .'-]{2,30})$/);
  return m ? [m[1], m[2]] : [name, ''];
}

/**
 * Shared by the public page, the admin preview and the parent preview. Shows only what the parent
 * entered. The child's own main photo is the hero; there is no stock or generated imagery here.
 * By design there is nothing (and nothing in the database) for contact details, address, school or ID documents.
 */
export default function ProfileView({ profile }: { profile: LoadedProfile }) {
  const { achiever: a, other, results, photos, certificates } = profile;
  const pos = heroPos(a);
  const ratings = [
    { label: 'Standard', value: a.fide_standard },
    { label: 'Rapid', value: a.fide_rapid },
    { label: 'Blitz', value: a.fide_blitz },
  ].filter((r) => typeof r.value === 'number' && r.value >= 1000); // hides typos like "7"

  const main = photos[0];
  const rest = photos.slice(1);
  const bio = a.bio?.trim() || buildBio(a, other, results);
  const link = `${siteOrigin()}/achievers/${a.slug}`;
  const groups = groupResults(results);
  const highlights = buildHighlights(results);
  const history = (a.fide_history ?? []).filter((h) => h && (h.s || h.r || h.b));
  const hasGraph = history.length >= 2;
  const [firstName, ...lastParts] = a.full_name.trim().split(/\s+/);
  const initials = a.full_name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const stats: { n: string | number; l: string }[] = [
    ...ratings.map((r) => ({ n: r.value as number, l: `FIDE ${r.label}` })),
    ...(groups.length ? [{ n: groups.length, l: groups.length === 1 ? 'Tournament' : 'Tournaments' }] : []),
    ...(certificates.length ? [{ n: certificates.length, l: certificates.length === 1 ? 'Certificate' : 'Certificates' }] : []),
  ].slice(0, 4);

  const sections = [
    { id: 'about', label: 'About', show: Boolean(bio) },
    { id: 'progress', label: 'Progress', show: hasGraph },
    { id: 'results', label: 'Results', show: groups.length > 0 },
    { id: 'certificates', label: 'Certificates', show: certificates.length > 0 },
    { id: 'photos', label: 'Photos', show: rest.length > 0 },
  ].filter((s) => s.show);

  const photoStyle: CSSProperties | undefined = main
    ? { backgroundImage: `url("${main.url}")`, backgroundPosition: `${pos.x}% ${pos.y}%` }
    : undefined;

  return (
    <article className="pp">
      <header className="pp-bar">
        <div className="pp-wrap pp-bar-in">
          <Link href="/" className="brand-lockup sm">
            <Logo size={28} />
            <span>Young Achievers</span>
          </Link>
          <ShareButton url={link} title={`${a.full_name}, Young Achievers`} />
        </div>
      </header>

      <section className="pp-wrap pp-top">
        <div className={`pp-card${main ? '' : ' no-photo'}`}>
          <div className="pp-photo">
            {main ? (
              <div className="pp-photo-img" style={photoStyle} role="img" aria-label={`Photo of ${a.full_name}`} />
            ) : (
              <div className="pp-photo-none" aria-hidden="true">
                {initials}
              </div>
            )}
          </div>
          <div className="pp-info">
            <p className="pp-kicker">
              <span>Chess player</span>
              {a.fide_id && (
                <a href={`https://ratings.fide.com/profile/${a.fide_id}`} target="_blank" rel="noopener noreferrer nofollow">
                  <ShieldIcon width={15} height={15} /> FIDE ID {a.fide_id}
                </a>
              )}
            </p>
            <h1>
              {firstName}
              {lastParts.length > 0 && <span> {lastParts.join(' ')}</span>}
            </h1>
            {stats.length > 0 && (
              <dl className={`pp-stats n${stats.length}`}>
                {stats.map((s) => (
                  <div key={s.l}>
                    <dd>{s.n}</dd>
                    <dt>{s.l}</dt>
                  </div>
                ))}
              </dl>
            )}
            {highlights.length > 0 && (
              <ul className="pp-hl" aria-label="Highlights">
                {highlights.map((h) => (
                  <li key={h.kind}>
                    <span className="medal" aria-hidden="true">
                      {h.kind === 'stage' ? '★' : h.kind === 'score' ? '♟︎' : h.big}
                    </span>
                    <span className="pp-hl-t">
                      <b>{h.kind === 'place' ? h.event : h.kind === 'score' ? `${h.big} points` : `${h.big} level`}</b>
                      <span>{h.kind === 'place' ? h.label : h.event}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {sections.length > 1 && (
        <nav className="pp-tabs" aria-label="Sections">
          <div className="pp-wrap pp-tabs-in">
            {sections.map((s) => (
              <a key={s.id} href={`#${s.id}`}>
                {s.label}
              </a>
            ))}
          </div>
        </nav>
      )}

      <div className="pp-wrap pp-body">
        <div className="pp-main">
          {bio && (
            <section id="about" className="pp-sec">
              <h2>About {firstName}</h2>
              <p className="pp-bio">{bio}</p>
            </section>
          )}

          {hasGraph && (
            <section id="progress" className="pp-sec">
              <h2>Rating progress</h2>
              <RatingChart history={history} />
            </section>
          )}

          {groups.length > 0 && (
            <section id="results" className="pp-sec">
              <h2>Tournament results</h2>
              <ol className="pp-results">
                {groups.map((g) => {
                  const [title, place] = splitPlace(g.name);
                  return (
                    <li key={`${g.year}-${g.name}`}>
                      <span className="pp-year">{g.year}</span>
                      <div className="pp-ev">
                        <h3>{title}</h3>
                        {place && <p className="muted">{place}</p>}
                        <ul>
                          {g.rows.map((r) => (
                            <li key={r.id}>
                              <span>{r.section || 'Overall'}</span>
                              <b>{r.result}</b>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          )}

          {certificates.length > 0 && (
            <section id="certificates" className="pp-sec">
              <h2>Certificates</h2>
              <CertGallery items={certificates} name={a.full_name} />
            </section>
          )}

          {rest.length > 0 && (
            <section id="photos" className="pp-sec">
              <h2>Photos</h2>
              <CertGallery items={rest} name={a.full_name} variant="photo" />
            </section>
          )}
        </div>

        <aside className="pp-side">
          {(ratings.length > 0 || other.length > 0) && (
            <div className="pp-sec pp-ratings">
              <h3>Ratings</h3>
              <dl>
                {ratings.map((r) => (
                  <div key={r.label}>
                    <dt>FIDE {r.label}</dt>
                    <dd>{r.value}</dd>
                  </div>
                ))}
                {other.map((r) => (
                  <div key={r.id}>
                    <dt>{r.label}</dt>
                    <dd>{r.value}</dd>
                  </div>
                ))}
              </dl>
              {a.fide_id && (
                <a className="pp-verify" href={`https://ratings.fide.com/profile/${a.fide_id}`} target="_blank" rel="noopener noreferrer nofollow">
                  Check on the official FIDE site
                </a>
              )}
            </div>
          )}
          <div className="pp-share-card">
            <b>Share {firstName}&apos;s page</b>
            <p>Send the link to family, coaches and school.</p>
            <ShareButton url={link} title={`${a.full_name}, Young Achievers`} />
          </div>
        </aside>
      </div>

      <footer className="pp-foot">
        <div className="pp-wrap">
          <p>
            The details on this page were submitted by the player&apos;s parent or guardian and have not been independently
            verified. FIDE ratings can be checked on the official FIDE ratings site using the FIDE ID above.
          </p>
          <span className="brand-lockup sm">
            <Logo size={22} />
            <span>Young Achievers</span>
          </span>
        </div>
      </footer>
    </article>
  );
}
