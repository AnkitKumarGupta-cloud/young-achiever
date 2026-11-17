import Link from 'next/link';
import { Logo } from '@/components/icons';

// Public demo page shown to prospective parents (a real, published profile).
const DEMO = `/achievers/${process.env.NEXT_PUBLIC_DEMO_SLUG || 'priyanshi'}`;

const FAQ = [
  { q: 'Do I have to type anything?', a: 'No. Upload photos and certificates and the page writes itself. You can still change anything if you want to.' },
  { q: 'Where do the ratings come from?', a: 'From the official FIDE ratings website, using your child’s FIDE ID. They are checked every day.' },
  { q: 'My child has no FIDE ID yet. Can we still use it?', a: 'Yes. Results, certificates and photos work without one, and you can add other ratings such as national or online ones. Add the FIDE ID later and the graph starts on its own.' },
  { q: 'Is my child’s page private?', a: 'Only people with the link can open it, and it is hidden from Google and other search engines. Addresses, phone numbers and schools are never shown.' },
  { q: 'Can I take something down?', a: 'Yes. Remove any photo or certificate, or hide the whole page, whenever you like.' },
];

const Check = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
    <circle cx="10" cy="10" r="10" fill="#10B57F" />
    <path d="M6 10.3l2.6 2.6L14.2 7.3" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Static sparkline used in the illustrations. */
function Spark({ className, light }: { className?: string; light?: boolean }) {
  const pts = [1412, 1418, 1409, 1431, 1440, 1436, 1458, 1471, 1466, 1489, 1501, 1512];
  const d = pts.map((v, i) => `${(i / (pts.length - 1)) * 100},${100 - ((v - 1400) / 120) * 100}`).join(' ');
  const c = light ? '#FFC233' : '#3047F5';
  return (
    <svg className={className} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <polygon points={`0,100 ${d} 100,100`} fill={light ? 'rgba(255,194,51,.18)' : 'rgba(48,71,245,.12)'} />
      <polyline points={d} fill="none" stroke={c} strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/** The product, drawn as a collectible player card. */
function PlayerCard() {
  return (
    <div className="lp-cards" aria-hidden="true">
      <div className="lp-card back" />
      <div className="lp-card front">
        <div className="lp-card-photo" />
        <span className="lp-medal">
          3rd
          <small>State U-11</small>
        </span>
        <div className="lp-card-body">
          <span className="lp-card-tag">Chess, FIDE rated</span>
          <b className="lp-card-name">Anaya Sharma</b>
          <div className="lp-card-stats">
            <span>
              <strong>1512</strong>Rapid
            </span>
            <span>
              <strong>1488</strong>Blitz
            </span>
            <span>
              <strong>6</strong>Events
            </span>
          </div>
          <Spark className="lp-card-spark" light />
        </div>
      </div>
    </div>
  );
}

// Deliberately does not list any children. Profiles are reachable only by their direct link.
export default function Home() {
  const year = new Date().getFullYear();
  return (
    <main className="lp">
      <nav className="lp-nav">
        <Link href="/" className="brand-lockup">
          <Logo size={34} />
          <span>Young Achievers</span>
        </Link>
        <div className="lp-nav-r">
          <Link href={DEMO} className="lp-nav-link">
            Example page
          </Link>
          <Link href="/login" className="btn ink sm">
            Log in
          </Link>
        </div>
      </nav>

      <header className="lp-hero">
        <div className="lp-hero-copy">
          <h1>A player page for your young chess star.</h1>
          <p>
            Upload photos and certificates. We read the results, follow the FIDE ratings every day and keep one page that family,
            coaches and schools can open on any phone.
          </p>
          <div className="lp-cta">
            <Link href={DEMO} className="btn royal lg">
              See an example page
            </Link>
            <Link href="/login" className="btn ghost lg">
              Parent login
            </Link>
          </div>
          <ul className="lp-checks">
            <li>
              <Check /> Ratings straight from FIDE
            </li>
            <li>
              <Check /> Private by link
            </li>
            <li>
              <Check /> Nothing to type
            </li>
          </ul>
        </div>
        <PlayerCard />
      </header>

      <section className="lp-how" aria-labelledby="how-h">
        <div className="lp-wrap">
          <h2 id="how-h">Ready in three steps</h2>
          <ol className="lp-steps">
            <li>
              <b>We set up your login</b>
              <p>Send us your child’s name and FIDE ID. There are no forms to fill.</p>
            </li>
            <li>
              <b>You upload photos and certificates</b>
              <p>Straight from your phone, right after the tournament.</p>
            </li>
            <li>
              <b>Share one link</b>
              <p>Results, ratings and the About text are already there. Send it on WhatsApp.</p>
            </li>
          </ol>
        </div>
      </section>

      <section className="lp-feat" aria-labelledby="feat-h">
        <div className="lp-wrap">
          <h2 id="feat-h">Everything stays up to date on its own</h2>
          <div className="lp-bento">
            <article className="lp-tile wide">
              <div>
                <h3>Ratings every month</h3>
                <p>Add the FIDE ID once. Standard, Rapid and Blitz ratings and the progress graph follow the official FIDE lists.</p>
              </div>
              <div className="lp-graph">
                <span className="lp-graph-n">
                  1512 <em>+100 this year</em>
                </span>
                <Spark className="lp-graph-svg" />
              </div>
            </article>

            <article className="lp-tile">
              <h3>Results read from certificates</h3>
              <p>Tournament, category, place and points come straight off the photo.</p>
              <div className="lp-read">
                <span className="lp-read-src">…secured 3rd place in the Under-11 category with 6 points…</span>
                <span className="lp-read-out">
                  <b>State U-11 Championship</b>
                  <em>3rd, 6 pts</em>
                </span>
              </div>
            </article>

            <article className="lp-tile sun">
              <h3>Best results first</h3>
              <p>The strongest finish and the biggest event are picked out automatically.</p>
              <div className="lp-medals">
                <span>
                  <i>3rd</i>State U-11 Championship
                </span>
                <span>
                  <i>★</i>National level played
                </span>
              </div>
            </article>

            <article className="lp-tile ink wide">
              <div>
                <h3>One link for everyone</h3>
                <p>Grandparents, coaches, schools and selectors open the same page. No app, no account.</p>
              </div>
              <div className="lp-chat">
                <span className="lp-bubble">
                  Anaya’s chess page, with this weekend’s result
                  <u>young-achievers.vercel.app/achievers/anaya</u>
                  <small>9:41</small>
                </span>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="lp-faq" aria-labelledby="faq-h">
        <div className="lp-wrap lp-faq-in">
          <h2 id="faq-h">Questions parents ask</h2>
          <div className="faq">
            {FAQ.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-wrap">
        <div className="lp-end">
          <h2>Open a real player page and see for yourself.</h2>
          <div className="lp-cta">
            <Link href={DEMO} className="btn sun lg">
              See an example page
            </Link>
            <Link href="/login" className="btn on-dark lg">
              Parent login
            </Link>
          </div>
        </div>
      </section>

      <footer className="lp-foot lp-wrap">
        <span className="brand-lockup sm">
          <Logo size={24} />
          <span>Young Achievers</span>
        </span>
        <span>© {year} Young Achievers</span>
      </footer>
    </main>
  );
}
