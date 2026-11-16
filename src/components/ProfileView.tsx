import type { CSSProperties } from 'react';
import Link from 'next/link';
import type { LoadedProfile, TournamentResult } from '@/lib/types';
import { buildBio, heroPos } from '@/lib/bio';
import { siteOrigin } from '@/lib/site';
import { Crown, ShieldIcon } from '@/components/icons';
import ShareButton from '@/components/ShareButton';
import CertGallery from '@/components/CertGallery';

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
    { id: 'results', label: 'Results', show: groups.length > 0 },
    { id: 'certificates', label: 'Certificates', show: certificates.length > 0 },
    { id: 'photos', label: 'Photos', show: rest.length > 0 },
  ].filter((s) => s.show);

  const photoStyle: CSSProperties | undefined = main
    ? { backgroundImage: `url("${main.url}")`, backgroundPosition: `${pos.x}% ${pos.y}%` }
    : undefined;

  return (
    <article className="ap">
      <header className="ap-bar">
        <div className="ap-wrap ap-bar-in">
          <Link href="/" className="lg-brand dark">
            <Crown size={28} />
            <span className="lg-brand-t">
              <b>Young Achievers</b>
            </span>
          </Link>
          <ShareButton url={link} title={`${a.full_name} · Young Achievers`} />
        </div>
      </header>

      <section className="ap-hero">
        <div className="ap-wrap ap-hero-in">
          <div className="ap-hero-text">
            <p className="ap-eyebrow">
              <span aria-hidden="true">&#9822;&#xFE0E;</span> Young chess player
            </p>
            <h1>
              {firstName}
              {lastParts.length > 0 && <span> {lastParts.join(' ')}</span>}
            </h1>
            <div className="ap-chips">
            {a.fide_id && (
              <a
                className="ap-fide"
                href={`https://ratings.fide.com/profile/${a.fide_id}`}
                target="_blank"
                rel="noopener noreferrer nofollow"
              >
                <ShieldIcon width={16} height={16} /> FIDE ID {a.fide_id} <span aria-hidden="true">&#8599;</span>
              </a>
            )}
            {a.fide_synced_at && ratings.length > 0 && (
              <p className="ap-verified">
                Ratings from the official FIDE list · updated{' '}
                {new Date(a.fide_synced_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
              </p>
            )}
            </div>
            {stats.length > 0 && (
              <dl className={`ap-stats n${stats.length}`}>
                {stats.map((s) => (
                  <div key={s.l}>
                    <dt>{s.l}</dt>
                    <dd>{s.n}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
          <div className="ap-portrait">
            {main ? (
              <div className="ap-portrait-img" style={photoStyle} role="img" aria-label={`Photo of ${a.full_name}`} />
            ) : (
              <div className="ap-portrait-none" aria-hidden="true">
                {initials}
              </div>
            )}
          </div>
        </div>
      </section>

      {sections.length > 1 && (
        <nav className="ap-tabs" aria-label="Sections">
          <div className="ap-wrap ap-tabs-in">
            {sections.map((s) => (
              <a key={s.id} href={`#${s.id}`}>
                {s.label}
              </a>
            ))}
          </div>
        </nav>
      )}

      <div className="ap-wrap ap-body">
        <div className="ap-main">
          {bio && (
            <section id="about" className="ap-sec">
              <h2>About {firstName}</h2>
              <p className="ap-bio">{bio}</p>
            </section>
          )}

          {groups.length > 0 && (
            <section id="results" className="ap-sec">
              <h2>Tournament results</h2>
              <ol className="ap-results">
                {groups.map((g) => {
                  const [title, place] = splitPlace(g.name);
                  return (
                    <li key={`${g.year}-${g.name}`} className="ap-event">
                      <div className="ap-event-h">
                        <span className="ap-year">{g.year}</span>
                        <div>
                          <h3>{title}</h3>
                          {place && <p className="muted">{place}</p>}
                        </div>
                      </div>
                      <ul className="ap-rows">
                        {g.rows.map((r) => (
                          <li key={r.id}>
                            <span>{r.section || 'Overall'}</span>
                            <b>{r.result}</b>
                          </li>
                        ))}
                      </ul>
                    </li>
                  );
                })}
              </ol>
            </section>
          )}

          {certificates.length > 0 && (
            <section id="certificates" className="ap-sec">
              <h2>Certificates</h2>
              <CertGallery items={certificates} name={a.full_name} />
            </section>
          )}

          {rest.length > 0 && (
            <section id="photos" className="ap-sec">
              <h2>Photos</h2>
              <CertGallery items={rest} name={a.full_name} variant="photo" />
            </section>
          )}
        </div>

        <aside className="ap-side">
          {(ratings.length > 0 || other.length > 0) && (
            <div className="ap-card">
              <h3>Ratings</h3>
              <dl className="ap-rl">
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
                <a className="ap-verify" href={`https://ratings.fide.com/profile/${a.fide_id}`} target="_blank" rel="noopener noreferrer nofollow">
                  Check on the official FIDE site &#8599;
                </a>
              )}
            </div>
          )}
          <div className="ap-card ap-quote">
            <Crown size={26} />
            <p>Every achievement deserves a story.</p>
          </div>
        </aside>
      </div>

      <footer className="ap-foot">
        <div className="ap-wrap">
          <p>
            The details on this page were submitted by the player&apos;s parent or guardian and have not been independently
            verified. FIDE ratings can be checked on the official FIDE ratings site using the FIDE ID above.
          </p>
          <p className="ap-foot-b">
            <Crown size={20} /> Young Achievers
          </p>
        </div>
      </footer>
    </article>
  );
}
