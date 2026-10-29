import Link from 'next/link';
import { ArrowIcon, Crown, DocIcon, ShareIcon, ShieldIcon, TrophyIcon } from '@/components/icons';

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
        </nav>
        <div className="hm-hero-copy">
          <h1>
            Every Young Achiever Has a <em>Story</em> Worth Telling.
          </h1>
          <p>
            Young Achievers is where parents showcase a young chess player&apos;s ratings, results and photos on one
            page, shared with a single link.
          </p>
          <div className="hm-cta">
            <Link href="/login" className="hm-btn gold">
              Parent Login <ArrowIcon width={18} height={18} />
            </Link>
            <a href="#how" className="hm-btn ghost">
              How it works
            </a>
          </div>
        </div>
        <svg className="hm-wave" viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 52C240 14 470 14 720 50S1180 86 1440 44" fill="none" stroke="#c9a24a" strokeWidth="3" />
          <path d="M0 60C240 22 470 22 720 58S1180 94 1440 52V90H0Z" fill="#f6f2e9" />
        </svg>
      </header>

      <section className="hm-more" id="more">
        <div className="hm-wrap hm-more-in">
          <div className="hm-more-t">
            <p className="hm-eyebrow">More than just a profile</p>
            <h2>A proper home for every result.</h2>
            <p>
              Parents add a biography, photos, FIDE ratings and tournament results, then share one clean page with
              family, coaches and friends.
            </p>
          </div>
          <div className="hm-feat">
            <div>
              <span className="hm-ico"><DocIcon /></span>
              <h3>A page per player</h3>
              <p>Name, biography and photos, written and kept up to date by the parents.</p>
            </div>
            <div>
              <span className="hm-ico"><TrophyIcon /></span>
              <h3>Ratings and results</h3>
              <p>FIDE ratings, other ratings and tournament results, all in one place.</p>
            </div>
            <div>
              <span className="hm-ico"><ShareIcon /></span>
              <h3>Shared by link</h3>
              <p>Anyone with the link can view it. No login needed for visitors.</p>
            </div>
          </div>
        </div>
        <Wave fill="#e6ebe2" />
      </section>

      <section className="hm-how" id="how">
        <div className="hm-wrap">
          <p className="hm-eyebrow">Simple steps</p>
          <h2>How it works</h2>
          <ol className="hm-steps">
            <li>
              <span className="hm-n">1</span>
              <b>Get your login</b>
              <p>Your login is created for you. There is no public signup.</p>
            </li>
            <li>
              <span className="hm-n">2</span>
              <b>Add details</b>
              <p>Biography, photos, FIDE ID, ratings and tournament results.</p>
            </li>
            <li>
              <span className="hm-n">3</span>
              <b>Publish</b>
              <p>Press Publish and the page goes live instantly.</p>
            </li>
            <li>
              <span className="hm-n">4</span>
              <b>Share the link</b>
              <p>Copy the link and send it to anyone you like.</p>
            </li>
          </ol>
          <p className="hm-priv">
            <ShieldIcon width={20} height={20} />
            <span>
              Private by link and hidden from search engines. Contact details, addresses and schools are never shown.
            </span>
          </p>
        </div>
      </section>

      <section className="hm-band">
        <Wave fill="#e6ebe2" top />
        <div className="hm-wrap hm-band-in">
          <h2>
            Because Every Child&apos;s Journey
            <br />
            Deserves to Be Remembered.
          </h2>
          <Link href="/login" className="hm-btn gold">
            Parent Login <ArrowIcon width={18} height={18} />
          </Link>
        </div>
        <Wave fill="#0f2a3a" />
      </section>

      <footer className="hm-foot">
        <div className="hm-wrap hm-foot-in">
          <Link href="/" className="lg-brand dark">
            <Crown size={32} />
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
