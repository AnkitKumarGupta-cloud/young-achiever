import type { CSSProperties } from 'react';
import Link from 'next/link';
import type { LoadedProfile } from '@/lib/types';
import { buildBio, heroPos } from '@/lib/bio';
import { siteOrigin } from '@/lib/site';
import { Crown } from '@/components/icons';
import CopyLink from '@/components/CopyLink';

/**
 * Shared by the public page, the admin preview and the parent preview. Shows only what the parent
 * entered. The child's own main photo is the hero; there is no stock or generated imagery here.
 * By design there is nothing (and nothing in the database) for contact details, address, school or ID documents.
 */
export default function ProfileView({ profile }: { profile: LoadedProfile }) {
  const { achiever: a, other, results, photos } = profile;
  const pos = heroPos(a);
  const bg = (url: string, p = true): CSSProperties => ({
    backgroundImage: `url("${url}")`,
    ...(p ? { backgroundPosition: `${pos.x}% ${pos.y}%` } : {}),
  });
  const ratings = [
    { label: 'Standard', value: a.fide_standard },
    { label: 'Rapid', value: a.fide_rapid },
    { label: 'Blitz', value: a.fide_blitz },
  ].filter((r) => r.value !== null && r.value !== undefined);

  const main = photos[0];
  const rest = photos.slice(1);
  const banner = rest.length >= 3 ? rest.pop()! : null;
  const bio = buildBio(a, other, results);
  const link = `${siteOrigin()}/achievers/${a.slug}`;

  const highlights: { n: number; l: string }[] = [];
  if (results.length) highlights.push({ n: results.length, l: 'Results' });
  if (photos.length > 1) highlights.push({ n: photos.length, l: 'Photos' });

  return (
    <article>
      <header className="pv2-top">
        <Link href="/" className="lg-brand dark">
          <Crown size={30} />
          <span className="lg-brand-t">
            <b>Young Achievers</b>
          </span>
        </Link>
        <CopyLink url={link} className="pv2-share" />
      </header>

      <div className={`pv2-hero${pos.x < 45 ? ' flip' : ''}`}>
        <div className="pv2-text">
          <p className="pv2-eye">Meet our young achiever</p>
          <h1>{a.full_name}</h1>
          <div className="chips">
            <span className="chip">&#9822;&#xFE0E; Chess</span>
            {a.fide_id && (
              <a
                className="chip"
                href={`https://ratings.fide.com/profile/${a.fide_id}`}
                target="_blank"
                rel="noopener noreferrer nofollow"
              >
                FIDE ID {a.fide_id} &#8599;
              </a>
            )}
          </div>
          {ratings.length > 0 && (
            <div className="pv2-rt">
              {ratings.map((r) => (
                <div key={r.label}>
                  <b>{r.value}</b>
                  <span>FIDE {r.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className={`pv2-photo${main ? '' : ' none'}`} style={main ? bg(main.url) : undefined}>
          {!main && <span>&#9822;&#xFE0E;</span>}
        </div>
      </div>

      <div className="pv2-wavebox">
        <svg className="pv2-wave" viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 52C240 14 470 14 720 50S1180 86 1440 44" fill="none" stroke="#c9a24a" strokeWidth="3" />
          <path d="M0 60C240 22 470 22 720 58S1180 94 1440 52V90H0Z" fill="#f6f2e9" />
        </svg>
      </div>

      <div className="pv2-body">
        <div className="pv2-main">
          {bio && (
            <section>
              <h2 className="sec">About</h2>
              <div className="bio">
                <p>{bio}</p>
              </div>
            </section>
          )}

          {banner && (
            <div className="pv2-ban" style={bg(banner.url, false)}>
              <p>&ldquo;Every achievement deserves a story.&rdquo;</p>
            </div>
          )}

          {results.length > 0 && (
            <section>
              <h2 className="sec">Tournament results</h2>
              <ol className="results">
                {results.map((r) => (
                  <li key={r.id}>
                    <span className="yr">{r.year}</span>
                    <span className="ev">{r.event}</span>
                    <span className="res">{r.result}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {rest.length > 0 && (
            <section>
              <h2 className="sec">Moments</h2>
              <div className="pv2-gal">
                {rest.map((p) => (
                  <figure key={p.id}>
                    <i style={bg(p.url, false)} role="img" aria-label={p.caption || `Photo of ${a.full_name}`} />
                  </figure>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="pv2-side">
          {(ratings.length > 0 || other.length > 0) && (
            <div className="card">
              <h3>Ratings</h3>
              <div className="pv2-rl">
                {ratings.map((r) => (
                  <div key={r.label}>
                    <span>FIDE {r.label}</span>
                    <b>{r.value}</b>
                  </div>
                ))}
                {other.map((r) => (
                  <div key={r.id}>
                    <span>{r.label}</span>
                    <b>{r.value}</b>
                  </div>
                ))}
              </div>
            </div>
          )}
          {highlights.length > 0 && (
            <div className="card">
              <h3>Quick highlights</h3>
              <div className="pv2-hl">
                {highlights.map((h) => (
                  <div key={h.l}>
                    <b>{h.n}</b>
                    <span>{h.l}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {!banner && <div className="pv2-q">&ldquo;Every achievement deserves a story.&rdquo;</div>}
        </aside>
      </div>

      <p className="disclaimer pv2-disc">
        The details on this page were submitted by the player&apos;s parent or guardian and have not been independently
        verified. FIDE ratings can be checked on the official FIDE ratings site using the FIDE ID above.
      </p>
    </article>
  );
}
