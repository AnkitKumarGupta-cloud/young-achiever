import Link from 'next/link';
import { ArrowIcon, Crown, DocIcon, ShareIcon, ShieldIcon, StarIcon, TrophyIcon } from '@/components/icons';

// Public demo page shown to prospective parents (a real, published profile).
const DEMO = `/achievers/${process.env.NEXT_PUBLIC_DEMO_SLUG || 'priyanshi'}`;

const FEATURES = [
  { icon: <DocIcon />, t: 'Just upload', d: 'Drop in photos and certificates from your phone. That’s the only thing you ever do.' },
  { icon: <TrophyIcon />, t: 'Results read for you', d: 'Each certificate is read automatically: tournament, category, placing and points go straight onto the page.' },
  { icon: <StarIcon />, t: 'FIDE ratings, always current', d: 'Add the FIDE ID once. Standard, Rapid and Blitz ratings update by themselves from the official FIDE site.' },
  { icon: <ShareIcon />, t: 'One link to share', d: 'A beautiful page for family, coaches, schools and selectors. Opens instantly on any phone.' },
];

const FAQ = [
  { q: 'Do I have to type anything?', a: 'No. Upload photos and certificates; the page writes itself. You can still edit anything if you want to.' },
  { q: 'Where do the ratings come from?', a: 'Directly from the official FIDE ratings website, using your child’s FIDE ID. They refresh every day.' },
  { q: 'Is my child’s page private?', a: 'Only people with the link can open it, and it is hidden from Google and other search engines. Contact details, addresses and schools are never shown.' },
  { q: 'Can I take something down?', a: 'Yes. Remove any photo or certificate, or unpublish the whole page, at any time.' },
];

function Wave({ fill, top }: { fill: string; top?: boolean }) {
  return (
    <svg className={`hm-wave${top ? ' top' : ''}`} viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 52C240 14 470 14 720 50S1180 86 1440 44" fill="none" stroke="#c9a24a" strokeWidth="3" />
      <path d="M0 60C240 22 470 22 720 58S1180 94 1440 52V90H0Z" fill={fill} />
    </svg>
  );
}

// Deliberately does not list any children. Profiles are reachable only by their direct link.
export default function Home() {
  const year = new Date().getFullYear();
  return (
    <main className="hm">
      <header className="hm-hero">
        <nav className="hm-nav">
          <Link href="/" className="lg-brand dark">
            <Crown size={40} />
            <span className="lg-brand-t">
              <b>Young Achievers</b>
              <i>Small steps. Big dreams.</i>
            </span>
          </Link>
          <Link href="/login" className="hm-navlink">
            Parent login
          </Link>
        </nav>
        <div className="hm-hero-copy">
          <p className="hm-kicker">For parents of young chess players</p>
          <h1>
            Your child&apos;s chess journey, on one <em>beautiful</em> page.
          </h1>
          <p>
            Upload photos and certificates. We read the results, fetch FIDE ratings automatically and build a page you&apos;ll be
            proud to share.
          </p>
          <div className="hm-cta">
            <Link href={DEMO} className="hm-btn gold">
              See a live example <ArrowIcon width={18} height={18} />
            </Link>
            <Link href="/login" className="hm-btn ghost">
              Parent login
            </Link>
          </div>
          <ul className="hm-trust">
            <li>
              <ShieldIcon width={18} height={18} /> Private by link
            </li>
            <li>
              <StarIcon width={18} height={18} /> Ratings from FIDE
            </li>
            <li>
              <TrophyIcon width={18} height={18} /> Certificates read automatically
            </li>
          </ul>
        </div>
        <Wave fill="#f6f2e9" />
      </header>

      <section className="hm-sec" id="what">
        <div className="hm-wrap hm-what">
          <div className="hm-what-t">
            <p className="hm-eyebrow">What you get</p>
            <h2>You upload. We do the rest.</h2>
            <p>Busy week of tournaments? Snap the certificate, upload it, done. The page stays up to date on its own.</p>
            <Link href={DEMO} className="hm-textlink">
              Open the example page <ArrowIcon width={16} height={16} />
            </Link>
          </div>
          <div className="hm-feat">
            {FEATURES.map((f) => (
              <div key={f.t}>
                <span className="hm-ico">{f.icon}</span>
                <h3>{f.t}</h3>
                <p>{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="hm-show">
        <div className="hm-wrap hm-show-in">
          <div className="hm-mock" aria-hidden="true">
            <div className="hm-mock-top">
              <Crown size={18} /> <span>Young Achievers</span>
            </div>
            <div className="hm-mock-hero">
              <div>
                <i>Young chess player</i>
                <b>
                  Aarav <em>Sharma</em>
                </b>
                <div className="hm-mock-stats">
                  <span>
                    <small>FIDE Rapid</small>1512
                  </span>
                  <span>
                    <small>FIDE Blitz</small>1488
                  </span>
                  <span>
                    <small>Tournaments</small>6
                  </span>
                </div>
              </div>
              <div className="hm-mock-photo" />
            </div>
            <div className="hm-mock-body">
              <span className="hm-mock-line w80" />
              <span className="hm-mock-line w60" />
              <div className="hm-mock-res">
                <span>2026 · State U-11 Championship</span>
                <b>3rd place</b>
              </div>
              <div className="hm-mock-res">
                <span>2026 · District Rapid Open</span>
                <b>6/7 points</b>
              </div>
            </div>
          </div>
          <div className="hm-show-t">
            <p className="hm-eyebrow">How it works</p>
            <h2>Ready in minutes</h2>
            <ol className="hm-steps">
              <li>
                <span className="hm-n">1</span>
                <div>
                  <b>We set up your login</b>
                  <p>Tell us your child&apos;s name and FIDE ID. No forms to fill.</p>
                </div>
              </li>
              <li>
                <span className="hm-n">2</span>
                <div>
                  <b>Upload photos &amp; certificates</b>
                  <p>Results, ratings and the About text appear automatically.</p>
                </div>
              </li>
              <li>
                <span className="hm-n">3</span>
                <div>
                  <b>Share one link</b>
                  <p>Send it on WhatsApp to family, coaches and schools.</p>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </section>

      <section className="hm-sec hm-faq-sec">
        <div className="hm-wrap">
          <p className="hm-eyebrow">Questions parents ask</p>
          <h2>Good to know</h2>
          <div className="hm-faq">
            {FAQ.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="hm-band">
        <Wave fill="#f6f2e9" top />
        <div className="hm-wrap hm-band-in">
          <h2>
            Because every child&apos;s journey
            <br />
            deserves to be remembered.
          </h2>
          <div className="hm-cta">
            <Link href={DEMO} className="hm-btn gold">
              See a live example <ArrowIcon width={18} height={18} />
            </Link>
            <Link href="/login" className="hm-btn ghost">
              Parent login
            </Link>
          </div>
        </div>
        <Wave fill="#0c271e" />
      </section>

      <footer className="hm-foot">
        <div className="hm-wrap hm-foot-in">
          <Link href="/" className="lg-brand dark">
            <Crown size={28} />
            <span className="lg-brand-t">
              <b>Young Achievers</b>
            </span>
          </Link>
          <span>&copy; {year} Young Achievers</span>
        </div>
      </footer>
    </main>
  );
}
