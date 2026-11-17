import Link from 'next/link';
import { requireParent } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabase/server';
import { loadProfile } from '@/lib/profile';
import { FIDE_MAX_AGE_MS, refreshBio, syncFide } from '@/lib/sync';
import { buildBio } from '@/lib/bio';
import { siteOrigin } from '@/lib/site';
import { logout } from '@/app/login/actions';
import { Logo, EyeIcon, HelpIcon, PenIcon, GridIcon } from '@/components/icons';
import Dashboard from './Dashboard';

export const dynamic = 'force-dynamic';

export default async function ParentPage() {
  const me = await requireParent();
  // RLS guarantees this can only ever return this parent's own child.
  const sb = supabaseServer();
  // Keep ratings fresh: if FIDE was last checked over a day ago, check again now.
  const { data: own } = await sb.from('achievers').select('id, fide_id, full_name, fide_synced_at').eq('owner_id', me.id).maybeSingle();
  if (own?.fide_id && (!own.fide_synced_at || Date.now() - new Date(own.fide_synced_at).getTime() > FIDE_MAX_AGE_MS)) {
    const r = await syncFide(sb, own);
    if (r.changed) await refreshBio(sb, own.id);
  }
  const profile = await loadProfile(sb, { ownerId: me.id });

  const top = (
    <header className="pd-top">
      <Link href="/parent" className="brand-lockup">
        <Logo size={32} />
        <span>Young Achievers</span>
      </Link>
      <form action={logout} className="pd-user">
        <span>Logged in as <b>{me.username}</b></span>
        <button className="btn-sm">Log out</button>
      </form>
    </header>
  );

  if (!profile) {
    return (
      <div className="pd">
        {top}
        <main className="pd-main"><div className="card"><p style={{ margin: 0 }}>Your page has not been set up yet. Please contact the administrator.</p></div></main>
      </div>
    );
  }

  const { achiever: a, other, results, photos, certificates } = profile;
  const fullUrl = `${siteOrigin()}/achievers/${a.slug}`;
  const done = [a.full_name, photos.length, a.fide_id, a.fide_standard ?? a.fide_rapid ?? a.fide_blitz ?? other.length, results.length || certificates.length];
  const pct = Math.round((done.filter(Boolean).length / done.length) * 100);
  const live = a.published && !a.taken_down;
  const main = photos[0];

  return (
    <div className="pd">
      {top}
      <nav className="pd-side" aria-label="Dashboard">
        <a href="#top" className="on"><GridIcon /> <span>Dashboard</span></a>
        <a href="#edit"><PenIcon /> <span>Edit page</span></a>
        <Link href="/parent/preview" target="_blank"><EyeIcon /> <span>Preview page</span></Link>
        <a href="#help"><HelpIcon /> <span>Help</span></a>
      </nav>
      <main className="pd-main" id="top">
        <section className="pd-banner">
          <h1>Hello! Let&rsquo;s keep the page up to date.</h1>
          <p>Drop in new photos and certificates below. Ratings and results update by themselves. Press Publish when you are happy.</p>
        </section>
        <Dashboard
          key={`${a.fide_standard}-${a.fide_rapid}-${a.fide_blitz}-${a.full_name}-${photos.map((p) => p.id).join(",")}`}
          achiever={a}
          other={other}
          results={results}
          photos={photos}
          certificates={certificates}
          bioText={a.bio?.trim() || buildBio(a, other, results)}
          pct={pct}
          fullUrl={fullUrl}
        />
      </main>
      <aside className="pd-right">
        <section className="card">
          <div className="pd-ph"><h3>Page preview</h3><Link href="/parent/preview" target="_blank">Open full page</Link></div>
          <div className="pd-pv">
            <div className="pd-pv-ph" style={main ? { backgroundImage: `url("${main.url}")`, backgroundPosition: `${a.hero_x ?? 50}% ${a.hero_y ?? 35}%` } : undefined} />
            <b>{a.full_name}</b>
            <span className="muted">&#9822;&#xFE0E; Chess</span>
            <div>{a.taken_down ? <span className="badge down">Taken down</span> : live ? <span className="badge live">Live</span> : <span className="badge">Draft</span>}</div>
          </div>
        </section>
        <section className="card">
          <h3>Publishing status</h3>
          <ol className="pd-flow">
            <li className={live ? '' : 'on'}><i /><div><b>Draft</b><span className="muted">Saved and not visible to the public.</span></div></li>
            <li className={live ? 'on' : ''}><i /><div><b>Published</b><span className="muted">Live for anyone with the link. No approval step.</span></div></li>
          </ol>
        </section>
        <section className="card" id="help">
          <h3>Need help?</h3>
          <p className="muted" style={{ margin: '6px 0 0' }}>
            For a forgotten password or any question about your page, ask the administrator who gave you your login.
          </p>
        </section>
      </aside>
    </div>
  );
}
